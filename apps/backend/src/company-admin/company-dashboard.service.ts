import { Injectable } from '@nestjs/common';
import { CollaboratorOrigin } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface DashboardPeriod {
  from: Date;
  to: Date;
}

export interface CompanyDashboardOverview {
  collaboratorsAtivos: number;
  horasPeriodo: number;
  totalFaturado: number;
  pendingInvites: number;
  from: string;
  to: string;
}

export interface CollaboratorDashboardRow {
  id: string;
  userId: string;
  name: string;
  email: string;
  origin: CollaboratorOrigin | null;
  horas: number;
  projetos: number;
  faturado: number;
}

type WorkHourForMetrics = {
  hours: number;
  projectId: string | null;
};

/**
 * MW-24 — Aggregation endpoints for the Company dashboard. Everything is
 * scoped to a single Company (req.user.companyId, checked in the
 * controller) — never accepts a companyId coming from the client.
 *
 * "Amount invoiced" is the sum of `Invoice.amount` (non-canceled invoices,
 * issued — `createdAt` — within the period). `Invoice` has no `userId` of
 * its own, but each Invoice only aggregates WorkHours from a single user
 * (`InvoicesService.create` filters work hours by `userId` on creation), so
 * attributing an invoice to a Collaborator via `invoiceWorkHours.workHour
 * .userId` is safe. "Hours in period" and "projects" still come from
 * `WorkHour` directly — they count logged work, not billing.
 */
@Injectable()
export class CompanyDashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Default period when from/to are not given: current month (day 1
   * through the last day of the month, inclusive).
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
   * Pure aggregation over an already-fetched set of WorkHours: sums hours
   * and counts distinct projects. Kept separate from the Prisma queries on
   * purpose, so it's testable with hand-built fixtures.
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
   * Sums `Invoice.amount` across this Company's non-canceled invoices,
   * created within the period, whose work hours belong to one of the given
   * `userIds`.
   */
  private async sumFaturado(
    companyId: string,
    userIds: string[],
    period: DashboardPeriod,
  ): Promise<number> {
    if (!userIds.length) {
      return 0;
    }

    const result = await this.prisma.invoice.aggregate({
      where: {
        companyId,
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
    companyId: string,
    from?: string,
    to?: string,
  ): Promise<CompanyDashboardOverview> {
    const period = this.resolvePeriod(from, to);

    const [collaborators, pendingInvites] = await Promise.all([
      this.prisma.collaborator.findMany({ where: { companyId } }),
      this.prisma.pendingInvite.count({
        where: { companyId, status: 'PENDING' },
      }),
    ]);

    const userIds = collaborators.map((c) => c.userId);
    const [workHours, faturado] = await Promise.all([
      userIds.length
        ? this.prisma.workHour.findMany({
            where: {
              companyId,
              userId: { in: userIds },
              date: { gte: period.from, lte: period.to },
            },
            select: this.workHourSelect(),
          })
        : Promise.resolve([]),
      this.sumFaturado(companyId, userIds, period),
    ]);

    const { horas } = this.aggregateWorkHours(workHours as WorkHourForMetrics[]);

    return {
      collaboratorsAtivos: collaborators.length,
      horasPeriodo: horas,
      totalFaturado: faturado,
      pendingInvites,
      from: period.from.toISOString(),
      to: period.to.toISOString(),
    };
  }

  async getCollaboratorsTable(
    companyId: string,
    from?: string,
    to?: string,
  ): Promise<CollaboratorDashboardRow[]> {
    const period = this.resolvePeriod(from, to);

    const collaborators = await this.prisma.collaborator.findMany({
      where: { companyId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows: CollaboratorDashboardRow[] = [];
    for (const collaborator of collaborators) {
      const [workHours, faturado] = await Promise.all([
        this.prisma.workHour.findMany({
          where: {
            companyId,
            userId: collaborator.userId,
            date: { gte: period.from, lte: period.to },
          },
          select: this.workHourSelect(),
        }),
        this.sumFaturado(companyId, [collaborator.userId], period),
      ]);

      const { horas, projetos } = this.aggregateWorkHours(
        workHours as WorkHourForMetrics[],
      );

      rows.push({
        id: collaborator.id,
        userId: collaborator.userId,
        name: collaborator.user.name,
        email: collaborator.user.email,
        origin: collaborator.origin,
        horas,
        projetos,
        faturado,
      });
    }

    return rows;
  }

  private originLabel(origin: CollaboratorOrigin | null): string {
    if (origin === 'INVITE') return 'Convite';
    if (origin === 'DOMAIN') return 'Domínio';
    return '';
  }

  private escapeCsvField(value: string): string {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  async exportCsv(
    companyId: string,
    from?: string,
    to?: string,
  ): Promise<string> {
    const rows = await this.getCollaboratorsTable(companyId, from, to);

    const header = [
      'Collaborator',
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
