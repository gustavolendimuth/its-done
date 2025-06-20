import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  clientId?: string;
}

export interface HoursReport {
  totalHours: number;
  totalDays: number;
  averageHoursPerDay: number;
  clientBreakdown: {
    clientId: string;
    clientName: string;
    totalHours: number;
    percentage: number;
  }[];
  weeklyBreakdown: {
    week: string;
    totalHours: number;
  }[];
  monthlyBreakdown: {
    month: string;
    totalHours: number;
  }[];
}

export interface InvoiceReport {
  totalInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
  totalValue?: number;
  clientBreakdown: {
    clientId: string;
    clientName: string;
    totalInvoices: number;
    pendingInvoices: number;
    paidInvoices: number;
  }[];
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateHoursReport(
    userId: string,
    filters: ReportFilters,
  ): Promise<HoursReport> {
    const where = {
      userId,
      ...(filters.startDate && filters.endDate
        ? {
            date: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          }
        : {}),
      ...(filters.clientId ? { clientId: filters.clientId } : {}),
    };

    const workHours = await this.prisma.workHour.findMany({
      where,
      include: {
        client: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Calculate totals
    const totalHours = workHours.reduce((sum, wh) => sum + wh.hours, 0);
    const uniqueDates = new Set(
      workHours.map((wh) => wh.date.toISOString().split('T')[0]),
    );
    const totalDays = uniqueDates.size;
    const averageHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;

    // Client breakdown
    const clientMap = new Map();
    workHours.forEach((wh) => {
      const key = wh.clientId;
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          clientId: wh.clientId,
          clientName: wh.client.name,
          totalHours: 0,
        });
      }
      clientMap.get(key).totalHours += wh.hours;
    });

    const clientBreakdown = Array.from(clientMap.values()).map((client) => ({
      ...client,
      percentage: totalHours > 0 ? (client.totalHours / totalHours) * 100 : 0,
    }));

    // Weekly breakdown
    const weeklyMap = new Map();
    workHours.forEach((wh) => {
      const date = new Date(wh.date);
      const week = this.getWeekKey(date);
      if (!weeklyMap.has(week)) {
        weeklyMap.set(week, 0);
      }
      weeklyMap.set(week, weeklyMap.get(week) + wh.hours);
    });

    const weeklyBreakdown = Array.from(weeklyMap.entries()).map(
      ([week, totalHours]) => ({
        week,
        totalHours,
      }),
    );

    // Monthly breakdown
    const monthlyMap = new Map();
    workHours.forEach((wh) => {
      const date = new Date(wh.date);
      const month = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, 0);
      }
      monthlyMap.set(month, monthlyMap.get(month) + wh.hours);
    });

    const monthlyBreakdown = Array.from(monthlyMap.entries()).map(
      ([month, totalHours]) => ({
        month,
        totalHours,
      }),
    );

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      totalDays,
      averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
      clientBreakdown,
      weeklyBreakdown,
      monthlyBreakdown,
    };
  }

  async generateInvoiceReport(
    userId: string,
    filters: ReportFilters,
  ): Promise<InvoiceReport> {
    const where = {
      invoiceWorkHours: {
        some: {
          workHour: {
            userId,
            ...(filters.startDate && filters.endDate
              ? {
                  date: {
                    gte: filters.startDate,
                    lte: filters.endDate,
                  },
                }
              : {}),
          },
        },
      },
      ...(filters.clientId ? { clientId: filters.clientId } : {}),
    };

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        client: true,
        invoiceWorkHours: {
          include: {
            workHour: true,
          },
        },
      },
    });

    const totalInvoices = invoices.length;
    const pendingInvoices = invoices.filter(
      (inv) => inv.status === 'PENDING',
    ).length;
    const paidInvoices = invoices.filter((inv) => inv.status === 'PAID').length;
    const canceledInvoices = invoices.filter(
      (inv) => inv.status === 'CANCELED',
    ).length;

    // Client breakdown
    const clientMap = new Map();
    invoices.forEach((inv) => {
      const key = inv.clientId;
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          clientId: inv.clientId,
          clientName: inv.client.name,
          totalInvoices: 0,
          pendingInvoices: 0,
          paidInvoices: 0,
        });
      }
      const client = clientMap.get(key);
      client.totalInvoices++;
      if (inv.status === 'PENDING') client.pendingInvoices++;
      if (inv.status === 'PAID') client.paidInvoices++;
      if (inv.status === 'CANCELED')
        client.canceledInvoices = (client.canceledInvoices || 0) + 1;
    });

    const clientBreakdown = Array.from(clientMap.values());

    return {
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      clientBreakdown,
    };
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
