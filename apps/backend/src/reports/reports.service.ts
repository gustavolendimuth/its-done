import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  companyId?: string;
}

export interface HoursReport {
  totalHours: number;
  totalDays: number;
  averageHoursPerDay: number;
  companyBreakdown: {
    companyId: string;
    companyName: string;
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
  companyBreakdown: {
    companyId: string;
    companyName: string;
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
      ...(filters.companyId ? { companyId: filters.companyId } : {}),
    };

    const workHours = await this.prisma.workHour.findMany({
      where,
      include: {
        company: true,
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

    // Company breakdown
    const companyMap = new Map();
    workHours.forEach((wh) => {
      const key = wh.companyId;
      if (!companyMap.has(key)) {
        companyMap.set(key, {
          companyId: wh.companyId,
          companyName: wh.company.name,
          totalHours: 0,
        });
      }
      companyMap.get(key).totalHours += wh.hours;
    });

    const companyBreakdown = Array.from(companyMap.values()).map((company) => ({
      ...company,
      percentage: totalHours > 0 ? (company.totalHours / totalHours) * 100 : 0,
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
      companyBreakdown,
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
      ...(filters.companyId ? { companyId: filters.companyId } : {}),
    };

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        company: true,
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

    // Company breakdown
    const companyMap = new Map();
    invoices.forEach((inv) => {
      const key = inv.companyId;
      if (!companyMap.has(key)) {
        companyMap.set(key, {
          companyId: inv.companyId,
          companyName: inv.company.name,
          totalInvoices: 0,
          pendingInvoices: 0,
          paidInvoices: 0,
        });
      }
      const company = companyMap.get(key);
      company.totalInvoices++;
      if (inv.status === 'PENDING') company.pendingInvoices++;
      if (inv.status === 'PAID') company.paidInvoices++;
      if (inv.status === 'CANCELED')
        company.canceledInvoices = (company.canceledInvoices || 0) + 1;
    });

    const companyBreakdown = Array.from(companyMap.values());

    return {
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      companyBreakdown,
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
