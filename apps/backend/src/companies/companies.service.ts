import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyLinkingService } from '../company-admin/company-linking.service';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private companyLinkingService: CompanyLinkingService,
  ) {}

  async create(userId: string, createCompanyDto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        ...createCompanyDto,
        collaborators: {
          create: { userId },
        },
      },
    });
  }

  async findAll(userId: string) {
    const companies = await this.prisma.company.findMany({
      where: { collaborators: { some: { userId } } },
      include: {
        _count: {
          select: {
            workHours: true,
            invoices: true,
            companyAdmins: true,
          },
        },
      },
    });

    return companies.map((company) => this.mapWithHasActiveAdmin(company));
  }

  async findOne(userId: string, id: string) {
    const company = await this.prisma.company.findFirst({
      where: {
        id,
        collaborators: { some: { userId } },
      },
      include: {
        _count: {
          select: {
            workHours: true,
            invoices: true,
            companyAdmins: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.mapWithHasActiveAdmin(company);
  }

  private mapWithHasActiveAdmin<
    T extends { _count: { companyAdmins: number } },
  >(company: T) {
    const { _count, ...rest } = company;
    const { companyAdmins, ...restCount } = _count;
    return {
      ...rest,
      _count: restCount,
      hasActiveAdmin: companyAdmins > 0,
    };
  }

  async update(userId: string, id: string, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.prisma.company.findFirst({
      where: {
        id,
        collaborators: { some: { userId } },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
  }

  async remove(userId: string, id: string) {
    const company = await this.prisma.company.findFirst({
      where: {
        id,
        collaborators: { some: { userId } },
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.prisma.company.delete({
      where: { id },
    });

    return { message: 'Company deleted successfully' };
  }

  /**
   * MW-23: Collaborator self-unlink. Removes only the Collaborator row for
   * this User↔Company pair — the Company record and this User's own
   * WorkHour/Project/Task/Invoice (owned by userId, not by the Collaborator
   * link) are left untouched.
   */
  async removeCollaborator(userId: string, companyId: string) {
    const collaborator = await this.prisma.collaborator.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });

    if (!collaborator) {
      throw new NotFoundException('Collaborator link not found');
    }

    await this.prisma.collaborator.delete({ where: { id: collaborator.id } });

    await this.companyLinkingService.notifyCollaboratorUnlinked(
      userId,
      companyId,
      'collaborator',
    );

    return { message: 'Collaborator link removed successfully' };
  }

  async getStats(userId: string) {
    const totalClients = await this.prisma.company.count({
      where: { collaborators: { some: { userId } } },
    });

    const totalHoursResult = await this.prisma.workHour.aggregate({
      where: {
        company: {
          collaborators: { some: { userId } },
        },
      },
      _sum: {
        hours: true,
      },
    });

    const totalInvoices = await this.prisma.invoice.count({
      where: {
        company: {
          collaborators: { some: { userId } },
        },
      },
    });

    // Get invoice stats
    const invoiceAmountResult = await this.prisma.invoice.aggregate({
      where: {
        company: {
          collaborators: { some: { userId } },
        },
      },
      _sum: {
        amount: true,
      },
    });

    const paidInvoicesResult = await this.prisma.invoice.aggregate({
      where: {
        company: {
          collaborators: { some: { userId } },
        },
        status: 'PAID',
      },
      _sum: {
        amount: true,
      },
    });

    const pendingInvoicesResult = await this.prisma.invoice.aggregate({
      where: {
        company: {
          collaborators: { some: { userId } },
        },
        status: 'PENDING',
      },
      _sum: {
        amount: true,
      },
    });

    const canceledInvoicesResult = await this.prisma.invoice.aggregate({
      where: {
        company: {
          collaborators: { some: { userId } },
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
    const company = await this.prisma.company.findFirst({
      where: {
        id,
        collaborators: { some: { userId } },
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

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const totalHours = company.workHours.reduce(
      (sum, workHour) => sum + workHour.hours,
      0,
    );

    const paidInvoicesAmount = company.invoices
      .filter((invoice) => invoice.status === 'PAID')
      .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

    const pendingInvoicesAmount = company.invoices
      .filter((invoice) => invoice.status === 'PENDING')
      .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

    const canceledInvoicesAmount = company.invoices
      .filter((invoice) => invoice.status === 'CANCELED')
      .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

    const totalValue = company.invoices.reduce(
      (sum, invoice) => sum + (invoice.amount || 0),
      0,
    );

    return {
      totalHours,
      totalValue,
      paidValue: paidInvoicesAmount,
      pendingValue: pendingInvoicesAmount,
      canceledValue: canceledInvoicesAmount,
      totalInvoices: company.invoices.length,
    };
  }
}
