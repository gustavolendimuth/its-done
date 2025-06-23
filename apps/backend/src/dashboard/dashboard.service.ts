import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DashboardStats {
  totalHours: number;
  totalClients: number;
  totalInvoices: number;
  pendingInvoices: number;
  thisMonthHours: number;
  lastMonthHours: number;
  hoursGrowth: number;
  recentActivities: {
    type: 'work_hour' | 'invoice' | 'client';
    description: {
      key: string;
      values: Record<string, any>;
    };
    date: Date;
    client?: string;
  }[];
  topClients: {
    id: string;
    name: string;
    totalHours: number;
    totalInvoices: number;
  }[];
  weeklyHours: {
    week: string;
    hours: number;
  }[];
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private formatHours(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  }

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const last4Weeks = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    // Parallel data fetching for better performance
    const [
      totalWorkHours,
      totalClients,
      totalInvoices,
      pendingInvoices,
      thisMonthWorkHours,
      lastMonthWorkHours,
      recentWorkHours,
      recentInvoices,
      recentClients,
      last4WeeksWorkHours,
    ] = await Promise.all([
      // Total hours
      this.prisma.workHour.aggregate({
        where: { userId },
        _sum: { hours: true },
      }),

      // Total clients
      this.prisma.client.count({
        where: { userId },
      }),

      // Total invoices
      this.prisma.invoice.count({
        where: {
          invoiceWorkHours: {
            some: {
              workHour: { userId },
            },
          },
        },
      }),

      // Pending invoices
      this.prisma.invoice.count({
        where: {
          invoiceWorkHours: {
            some: {
              workHour: { userId },
            },
          },
          status: 'PENDING',
        },
      }),

      // This month hours
      this.prisma.workHour.aggregate({
        where: {
          userId,
          date: { gte: startOfThisMonth },
        },
        _sum: { hours: true },
      }),

      // Last month hours
      this.prisma.workHour.aggregate({
        where: {
          userId,
          date: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
        _sum: { hours: true },
      }),

      // Recent work hours (last 10)
      this.prisma.workHour.findMany({
        where: { userId },
        include: { client: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Recent invoices (last 5)
      this.prisma.invoice.findMany({
        where: {
          invoiceWorkHours: {
            some: {
              workHour: { userId },
            },
          },
        },
        include: { client: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),

      // Recent clients (last 3)
      this.prisma.client.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 2,
      }),

      // Last 4 weeks work hours for weekly chart
      this.prisma.workHour.findMany({
        where: {
          userId,
          date: { gte: last4Weeks },
        },
        include: { client: true },
        orderBy: { date: 'asc' },
      }),
    ]);

    // Calculate growth percentage
    const thisMonth = thisMonthWorkHours._sum.hours || 0;
    const lastMonth = lastMonthWorkHours._sum.hours || 0;
    const hoursGrowth =
      lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    // Process recent activities
    const recentActivities = [
      ...recentWorkHours.map((wh) => ({
        type: 'work_hour' as const,
        description: {
          key: 'loggedHours',
          values: {
            hours: this.formatHours(wh.hours),
            description: wh.description,
          },
        },
        date: wh.createdAt,
        client: wh.client.company,
      })),
      ...recentInvoices.map((inv) => ({
        type: 'invoice' as const,
        description: {
          key: 'invoiceCreatedFor',
          values: { company: inv.client.company },
        },
        date: inv.createdAt,
        client: inv.client.company,
      })),
      ...recentClients.map((client) => ({
        type: 'client' as const,
        description: {
          key: 'newClient',
          values: { company: client.company },
        },
        date: client.createdAt,
        client: client.company,
      })),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);

    // Get top clients by hours and invoices
    const clientStats = await this.prisma.client.findMany({
      where: { userId },
      include: {
        workHours: {
          select: { hours: true },
        },
        invoices: {
          select: { id: true },
        },
      },
    });

    const topClients = clientStats
      .map((client) => ({
        id: client.id,
        name: client.company,
        totalHours: client.workHours.reduce((sum, wh) => sum + wh.hours, 0),
        totalInvoices: client.invoices.length,
      }))
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 5);

    // Process weekly hours for chart
    const weeklyMap = new Map<string, number>();
    last4WeeksWorkHours.forEach((wh) => {
      const week = this.getWeekKey(wh.date);
      weeklyMap.set(week, (weeklyMap.get(week) || 0) + wh.hours);
    });

    const weeklyHours = Array.from(weeklyMap.entries())
      .map(([week, hours]) => ({ week, hours }))
      .sort((a, b) => a.week.localeCompare(b.week));

    return {
      totalHours: Math.round((totalWorkHours._sum.hours || 0) * 100) / 100,
      totalClients,
      totalInvoices,
      pendingInvoices,
      thisMonthHours: Math.round(thisMonth * 100) / 100,
      lastMonthHours: Math.round(lastMonth * 100) / 100,
      hoursGrowth: Math.round(hoursGrowth * 100) / 100,
      recentActivities,
      topClients,
      weeklyHours,
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
