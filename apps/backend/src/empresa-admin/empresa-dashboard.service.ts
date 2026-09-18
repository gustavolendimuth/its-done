import { Injectable } from '@nestjs/common';
import { ColaboradorOrigin } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { resolveHourlyRate } from '../work-hours/utils/resolve-hourly-rate.util';

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
  project: { hourlyRate?: number | null } | null;
};

/**
 * MW-24 — Endpoints de agregação pro Dashboard da Empresa. Tudo escopado a
 * uma única Empresa (req.user.empresaId, checado no controller) — nunca
 * recebe/aceita um empresaId vindo do cliente.
 *
 * "Valor faturado" é calculado a partir de WorkHour.hours * resolveHourlyRate
 * (mesma lógica documentada em CLAUDE.md e usada por
 * work-hours/services/draft-invoice.service.ts e invoices.service.ts) — não
 * da soma de Invoice.amount. Invoice não carrega um userId próprio (só
 * clientId), então somar Invoice.amount não daria pra atribuir o valor a um
 * Colaborador específico com segurança; WorkHour.userId é a fonte confiável
 * de "de quem é essa hora/valor".
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
   * Pure aggregation over an already-fetched set of WorkHours: sums hours,
   * the billable amount (resolveHourlyRate — rate do Project, senão da
   * Empresa, senão 0) and conta projetos distintos. Separado das queries
   * Prisma de propósito, pra ser testável com fixtures à mão.
   */
  private aggregateWorkHours(
    workHours: WorkHourForMetrics[],
    empresa: { hourlyRate?: number | null },
  ): { horas: number; faturado: number; projetos: number } {
    const projectIds = new Set<string>();
    let horas = 0;
    let faturado = 0;

    for (const wh of workHours) {
      horas += wh.hours;
      faturado += wh.hours * resolveHourlyRate(wh.project, empresa);
      if (wh.projectId) {
        projectIds.add(wh.projectId);
      }
    }

    return { horas, faturado, projetos: projectIds.size };
  }

  private workHourSelect() {
    return {
      hours: true,
      projectId: true,
      project: { select: { hourlyRate: true } },
    } as const;
  }

  async getOverview(
    empresaId: string,
    from?: string,
    to?: string,
  ): Promise<EmpresaDashboardOverview> {
    const period = this.resolvePeriod(from, to);

    const [empresa, colaboradores, convitesPendentes] = await Promise.all([
      this.prisma.empresa.findUnique({ where: { id: empresaId } }),
      this.prisma.colaborador.findMany({ where: { empresaId } }),
      this.prisma.convitePendente.count({
        where: { empresaId, status: 'PENDING' },
      }),
    ]);

    const userIds = colaboradores.map((c) => c.userId);
    const workHours = userIds.length
      ? await this.prisma.workHour.findMany({
          where: {
            clientId: empresaId,
            userId: { in: userIds },
            date: { gte: period.from, lte: period.to },
          },
          select: this.workHourSelect(),
        })
      : [];

    const { horas, faturado } = this.aggregateWorkHours(
      workHours as WorkHourForMetrics[],
      empresa ?? { hourlyRate: null },
    );

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

    const [empresa, colaboradores] = await Promise.all([
      this.prisma.empresa.findUnique({ where: { id: empresaId } }),
      this.prisma.colaborador.findMany({
        where: { empresaId },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const rows: ColaboradorDashboardRow[] = [];
    for (const colaborador of colaboradores) {
      const workHours = await this.prisma.workHour.findMany({
        where: {
          clientId: empresaId,
          userId: colaborador.userId,
          date: { gte: period.from, lte: period.to },
        },
        select: this.workHourSelect(),
      });

      const { horas, faturado, projetos } = this.aggregateWorkHours(
        workHours as WorkHourForMetrics[],
        empresa ?? { hourlyRate: null },
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
