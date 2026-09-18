import { Injectable } from '@nestjs/common';
import { ColaboradorOrigin } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface DashboardPeriod {
  from: Date;
  to: Date;
}

export interface EmpresaDashboardOverview {
  colaboradoresAtivos: number;
  horasPeriodo: number;
  totalFaturado: number;
  convitesPendentes: number;
  from: string;
  to: string;
}

export interface ColaboradorDashboardRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  origin: ColaboradorOrigin | null;
  horas: number;
  projetos: number;
  faturado: number;
}

type WorkHourForMetrics = {
  hours: number;
  projectId: string | null;
};

/**
 * MW-24 — Endpoints de agregação pro Dashboard da Empresa. Tudo escopado a
 * uma única Empresa (req.user.empresaId, checado no controller) — nunca
 * recebe/aceita um empresaId vindo do cliente.
 *
 * "Valor faturado" é a soma de `Invoice.amount` (invoices não canceladas,
 * emitidas — `createdAt` — dentro do período). `Invoice` não carrega um
 * `userId` próprio, mas cada Invoice só agrega WorkHour de um único usuário
 * (`InvoicesService.create` filtra os work hours por `userId` na criação),
 * então atribuir a invoice a um Colaborador via `invoiceWorkHours.workHour
 * .userId` é seguro. "Horas no período" e "projetos" continuam vindo de
 * `WorkHour` diretamente — são contagens de trabalho registrado, não de
 * faturamento.
 */
@Injectable()
export class EmpresaDashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Período default quando from/to não são informados: mês corrente (dia 1
   * até o último dia do mês, inclusive).
   */
  resolvePeriod(from?: string, to?: string): DashboardPeriod {
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultTo = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    return {
      from: from ? new Date(from) : defaultFrom,
      to: to ? this.endOfDay(new Date(to)) : defaultTo,
    };
  }

  private endOfDay(date: Date): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Pure aggregation over an already-fetched set of WorkHours: sums hours e
   * conta projetos distintos. Separado das queries Prisma de propósito, pra
   * ser testável com fixtures à mão.
   */
  private aggregateWorkHours(
    workHours: WorkHourForMetrics[],
  ): { horas: number; projetos: number } {
    const projectIds = new Set<string>();
    let horas = 0;

    for (const wh of workHours) {
      horas += wh.hours;
      if (wh.projectId) {
        projectIds.add(wh.projectId);
      }
    }

    return { horas, projetos: projectIds.size };
  }

  private workHourSelect() {
    return {
      hours: true,
      projectId: true,
    } as const;
  }

  /**
   * Soma `Invoice.amount` das invoices não canceladas dessa Empresa, criadas
   * dentro do período, cujos work hours pertencem a algum dos `userIds`
   * informados.
   */
  private async sumFaturado(
    empresaId: string,
    userIds: string[],
    period: DashboardPeriod,
  ): Promise<number> {
    if (!userIds.length) {
      return 0;
    }

    const result = await this.prisma.invoice.aggregate({
      where: {
        clientId: empresaId,
        status: { not: 'CANCELED' },
        createdAt: { gte: period.from, lte: period.to },
        invoiceWorkHours: {
          some: { workHour: { userId: { in: userIds } } },
        },
      },
      _sum: { amount: true },
    });

    return result._sum.amount ?? 0;
  }

  async getOverview(
    empresaId: string,
    from?: string,
    to?: string,
  ): Promise<EmpresaDashboardOverview> {
    const period = this.resolvePeriod(from, to);

    const [colaboradores, convitesPendentes] = await Promise.all([
      this.prisma.colaborador.findMany({ where: { empresaId } }),
      this.prisma.convitePendente.count({
        where: { empresaId, status: 'PENDING' },
      }),
    ]);

    const userIds = colaboradores.map((c) => c.userId);
    const [workHours, faturado] = await Promise.all([
      userIds.length
        ? this.prisma.workHour.findMany({
            where: {
              clientId: empresaId,
              userId: { in: userIds },
              date: { gte: period.from, lte: period.to },
            },
            select: this.workHourSelect(),
          })
        : Promise.resolve([]),
      this.sumFaturado(empresaId, userIds, period),
    ]);

    const { horas } = this.aggregateWorkHours(workHours as WorkHourForMetrics[]);

    return {
      colaboradoresAtivos: colaboradores.length,
      horasPeriodo: horas,
      totalFaturado: faturado,
      convitesPendentes,
      from: period.from.toISOString(),
      to: period.to.toISOString(),
    };
  }

  async getColaboradoresTable(
    empresaId: string,
    from?: string,
    to?: string,
  ): Promise<ColaboradorDashboardRow[]> {
    const period = this.resolvePeriod(from, to);

    const colaboradores = await this.prisma.colaborador.findMany({
      where: { empresaId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows: ColaboradorDashboardRow[] = [];
    for (const colaborador of colaboradores) {
      const [workHours, faturado] = await Promise.all([
        this.prisma.workHour.findMany({
          where: {
            clientId: empresaId,
            userId: colaborador.userId,
            date: { gte: period.from, lte: period.to },
          },
          select: this.workHourSelect(),
        }),
        this.sumFaturado(empresaId, [colaborador.userId], period),
      ]);

      const { horas, projetos } = this.aggregateWorkHours(
        workHours as WorkHourForMetrics[],
      );

      rows.push({
        id: colaborador.id,
        userId: colaborador.userId,
        name: colaborador.user.name,
        email: colaborador.user.email,
        origin: colaborador.origin,
        horas,
        projetos,
        faturado,
      });
    }

    return rows;
  }

  private originLabel(origin: ColaboradorOrigin | null): string {
    if (origin === 'CONVITE') return 'Convite';
    if (origin === 'DOMINIO') return 'Domínio';
    return '';
  }

  private escapeCsvField(value: string): string {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  async exportCsv(
    empresaId: string,
    from?: string,
    to?: string,
  ): Promise<string> {
    const rows = await this.getColaboradoresTable(empresaId, from, to);

    const header = [
      'Colaborador',
      'Email',
      'Vinculo',
      'Horas',
      'Projetos',
      'Faturado',
    ];

    const lines = [header.join(',')];
    for (const row of rows) {
      lines.push(
        [
          this.escapeCsvField(row.name),
          this.escapeCsvField(row.email),
          this.originLabel(row.origin),
          row.horas.toFixed(2),
          String(row.projetos),
          row.faturado.toFixed(2),
        ].join(','),
      );
    }

    return lines.join('\n');
  }
}
