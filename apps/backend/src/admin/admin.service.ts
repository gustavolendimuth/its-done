import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getSystemStats() {
    const [
      totalUsers,
      totalClients,
      totalProjects,
      totalWorkHours,
      totalInvoices,
      pendingInvoices,
      paidInvoices,
      totalRevenue,
      adminUsers,
      regularUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.client.count(),
      this.prisma.project.count(),
      this.prisma.workHour.count(),
      this.prisma.invoice.count(),
      this.prisma.invoice.count({ where: { status: 'PENDING' } }),
      this.prisma.invoice.count({ where: { status: 'PAID' } }),
      this.prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { role: 'USER' } }),
    ]);

    const totalHoursWorked = await this.prisma.workHour.aggregate({
      _sum: { hours: true },
    });

    return {
      users: {
        total: totalUsers,
        admins: adminUsers,
        regular: regularUsers,
      },
      clients: totalClients,
      projects: totalProjects,
      workHours: {
        total: totalWorkHours,
        totalHours: totalHoursWorked._sum.hours || 0,
      },
      invoices: {
        total: totalInvoices,
        pending: pendingInvoices,
        paid: paidInvoices,
      },
      revenue: totalRevenue._sum.amount || 0,
    };
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            clients: true,
            projects: true,
            workHours: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(userId: string) {
    // Verificar se não é o último admin
    const adminCount = await this.prisma.user.count({
      where: { role: 'ADMIN' },
    });

    const userToDelete = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (userToDelete?.role === 'ADMIN' && adminCount <= 1) {
      throw new Error('Cannot delete the last admin user');
    }

    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async getRecentActivity(limit: number = 50) {
    const [recentWorkHours, recentInvoices, recentUsers] = await Promise.all([
      this.prisma.workHour.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true },
          },
          client: {
            select: { name: true, company: true },
          },
          project: {
            select: { name: true },
          },
        },
      }),
      this.prisma.invoice.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: { name: true, company: true },
          },
        },
      }),
      this.prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      workHours: recentWorkHours,
      invoices: recentInvoices,
      newUsers: recentUsers,
    };
  }
}
