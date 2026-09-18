import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createClientDto: CreateClientDto) {
    return this.prisma.empresa.create({
      data: {
        ...createClientDto,
        colaboradores: {
          create: { userId },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.empresa.findMany({
      where: { colaboradores: { some: { userId } } },
      include: {
        _count: {
          select: {
            workHours: true,
            invoices: true,
          },
        },
      },
    });
  }

  async findOne(userId: string, id: string) {
    const client = await this.prisma.empresa.findFirst({
      where: {
        id,
        colaboradores: { some: { userId } },
      },
      include: {
        _count: {
          select: {
            workHours: true,
            invoices: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(userId: string, id: string, updateClientDto: UpdateClientDto) {
    const client = await this.prisma.empresa.findFirst({
      where: {
        id,
        colaboradores: { some: { userId } },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return this.prisma.empresa.update({
      where: { id },
      data: updateClientDto,
    });
  }

  async remove(userId: string, id: string) {
    const client = await this.prisma.empresa.findFirst({
      where: {
        id,
        colaboradores: { some: { userId } },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    await this.prisma.empresa.delete({
      where: { id },
    });

    return { message: 'Client deleted successfully' };
  }

  async getStats(userId: string) {
    const totalClients = await this.prisma.empresa.count({
      where: { colaboradores: { some: { userId } } },
    });

    const totalHoursResult = await this.prisma.workHour.aggregate({
      where: {
        client: {
          colaboradores: { some: { userId } },
        },
      },
      _sum: {
        hours: true,
      },
    });

    const totalInvoices = await this.prisma.invoice.count({
      where: {
        client: {
          colaboradores: { some: { userId } },
        },
      },
    });

    // Get invoice stats
    const invoiceAmountResult = await this.prisma.invoice.aggregate({
      where: {
        client: {
          colaboradores: { some: { userId } },
        },
      },
      _sum: {
        amount: true,
      },
    });

    const paidInvoicesResult = await this.prisma.invoice.aggregate({
      where: {
        client: {
          colaboradores: { some: { userId } },
        },
        status: 'PAID',
      },
      _sum: {
        amount: true,
      },
    });

    const pendingInvoicesResult = await this.prisma.invoice.aggregate({
      where: {
        client: {
          colaboradores: { some: { userId } },
        },
        status: 'PENDING',
      },
      _sum: {
        amount: true,
      },
    });

    const canceledInvoicesResult = await this.prisma.invoice.aggregate({
      where: {
        client: {
          colaboradores: { some: { userId } },
        },
        status: 'CANCELED',
      },
      _sum: {
        amount: true,
      },
    });

    return {
      totalClients,
      totalHours: totalHoursResult._sum.hours || 0,
      totalInvoices,
      totalAmount: invoiceAmountResult._sum.amount || 0,
      totalPaid: paidInvoicesResult._sum.amount || 0,
      totalPending: pendingInvoicesResult._sum.amount || 0,
      totalCanceled: canceledInvoicesResult._sum.amount || 0,
      totalOverdue: 0, // Para implementar depois
      totalHoursByClient: [], // Para implementar depois
      totalAmountByClient: [], // Para implementar depois
      totalHoursByMonth: [], // Para implementar depois
      totalAmountByMonth: [], // Para implementar depois
    };
  }

  async getClientStats(userId: string, id: string) {
    const client = await this.prisma.empresa.findFirst({
      where: {
        id,
        colaboradores: { some: { userId } },
      },
      include: {
        workHours: {
          select: {
            hours: true,
            date: true,
          },
        },
        invoices: {
          select: {
            status: true,
            amount: true,
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const totalHours = client.workHours.reduce(
      (sum, workHour) => sum + workHour.hours,
      0,
    );

    const paidInvoicesAmount = client.invoices
      .filter((invoice) => invoice.status === 'PAID')
      .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

    const pendingInvoicesAmount = client.invoices
      .filter((invoice) => invoice.status === 'PENDING')
      .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

    const canceledInvoicesAmount = client.invoices
      .filter((invoice) => invoice.status === 'CANCELED')
      .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

    const totalValue = client.invoices.reduce(
      (sum, invoice) => sum + (invoice.amount || 0),
      0,
    );

    return {
      totalHours,
      totalValue,
      paidValue: paidInvoicesAmount,
      pendingValue: pendingInvoicesAmount,
      canceledValue: canceledInvoicesAmount,
      totalInvoices: client.invoices.length,
    };
  }
}
