import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';
import { UploadService, UploadResult } from './upload.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

interface StatsFilters {
  from?: Date;
  to?: Date;
  clientId?: string;
}

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
    private uploadService: UploadService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto, userId: string) {
    // Verificar se as horas pertencem ao usuário
    const workHours = await this.prisma.workHour.findMany({
      where: {
        id: {
          in: createInvoiceDto.workHourIds,
        },
        userId,
      },
      // No include here to keep types simple
    });

    if (workHours.length !== createInvoiceDto.workHourIds.length) {
      throw new NotFoundException('Some work hours not found');
    }

    // Verificar se todas as horas pertencem ao mesmo cliente
    const clientIds = [...new Set(workHours.map((wh) => wh.clientId))];
    if (clientIds.length > 1) {
      throw new Error('All work hours must belong to the same client');
    }

    // Verificar se há horas já faturadas em faturas não canceladas
    const alreadyInvoiced = await this.prisma.invoiceWorkHour.findMany({
      where: {
        workHourId: {
          in: createInvoiceDto.workHourIds,
        },
        invoice: {
          status: {
            not: 'CANCELED', // Permitir reutilização apenas se a fatura estiver cancelada
          },
        },
      },
      include: {
        invoice: {
          select: {
            id: true,
            status: true,
            number: true,
          },
        },
      },
    });

    if (alreadyInvoiced.length > 0) {
      const invoiceNumbers = alreadyInvoiced
        .map((item) => item.invoice.number || item.invoice.id.slice(0, 8))
        .join(', ');
      throw new Error(
        `Some work hours are already invoiced in non-canceled invoices: ${invoiceNumbers}`,
      );
    }

    const clientId = workHours[0].clientId;

    // Compute amount based on project hourly rates when possible
    const projectIds = Array.from(
      new Set(
        workHours
          .map((wh) => wh.projectId)
          .filter((id): id is string => typeof id === 'string'),
      ),
    );

    const projects = projectIds.length
      ? await this.prisma.project.findMany({
          where: { id: { in: projectIds } },
        })
      : [];

    type ProjectRate = { id: string; hourlyRate?: number };
    const rateMap = new Map(
      (projects as unknown as ProjectRate[]).map((p) => [
        p.id,
        p.hourlyRate ?? 0,
      ]),
    );

    const computedAmount = workHours.reduce((sum, wh) => {
      const rate = wh.projectId ? (rateMap.get(wh.projectId) ?? 0) : 0;
      return sum + wh.hours * rate;
    }, 0);

    // Criar a invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        clientId,
        // If client sent amount explicitly, use it; otherwise use computed
        amount:
          typeof createInvoiceDto.amount === 'number'
            ? createInvoiceDto.amount
            : computedAmount,
        status: (createInvoiceDto.status as any) || 'PENDING',
        fileUrl: createInvoiceDto.fileUrl,
        description: createInvoiceDto.description,
        invoiceWorkHours: {
          create: createInvoiceDto.workHourIds.map((workHourId) => ({
            workHourId,
          })),
        },
      },
      include: {
        client: true,
        invoiceWorkHours: true,
      },
    });

    // Enviar notificação ao cliente sobre a nova invoice
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { email: true },
    });

    if (client?.email) {
      try {
        await this.notificationsService.sendInvoiceUploadNotification(
          client.email,
          invoice.id,
        );
      } catch (error) {
        console.error('Failed to send invoice notification:', error);
        // Não falhar a criação da invoice se a notificação falhar
      }
    }

    return invoice;
  }

  async uploadFileToInvoice(
    id: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<any> {
    try {
      this.logger.log(`📤 Starting file upload for invoice ${id}`);

      // Verificar se a invoice existe e pertence ao usuário
      const invoice = await this.findOne(id, userId);
      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      // Upload do arquivo usando o serviço robusto
      const uploadResult: UploadResult = await this.uploadService.uploadFile(
        file,
        {
          userId,
          folder: 'invoices',
          preserveOriginalName: false,
        },
      );

      // Atualizar a invoice com a URL do arquivo
      const updatedInvoice = await this.prisma.invoice.update({
        where: { id },
        data: {
          fileUrl: uploadResult.url,
        },
        include: {
          client: true,
          invoiceWorkHours: {
            include: {
              workHour: {
                include: {
                  client: true,
                  project: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(
        `✅ File uploaded successfully for invoice ${id}: ${uploadResult.url}`,
      );

      return {
        ...updatedInvoice,
        uploadInfo: {
          originalName: uploadResult.originalName,
          size: uploadResult.size,
          mimeType: uploadResult.mimeType,
          storage: uploadResult.storage,
          uploadedAt: new Date(),
        },
      };
    } catch (error) {
      this.logger.error(
        `❌ File upload failed for invoice ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async findAll(userId: string) {
    return this.prisma.invoice.findMany({
      where: {
        invoiceWorkHours: {
          some: {
            workHour: {
              userId,
            },
          },
        },
      },
      include: {
        client: true,
        invoiceWorkHours: {
          include: {
            workHour: {
              include: {
                client: true,
                project: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        invoiceWorkHours: {
          some: {
            workHour: {
              userId,
            },
          },
        },
      },
      include: {
        client: true,
        invoiceWorkHours: {
          include: {
            workHour: {
              include: {
                client: true,
                project: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto, userId: string) {
    const existingInvoice = await this.findOne(id, userId); // Verify invoice exists and belongs to user

    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        ...updateInvoiceDto,
        status: updateInvoiceDto.status as any,
      },
      include: {
        client: true,
        invoiceWorkHours: {
          include: {
            workHour: {
              include: {
                client: true,
                project: true,
              },
            },
          },
        },
      },
    });

    // Log quando uma fatura for cancelada (liberando horas para reutilização)
    if (
      updateInvoiceDto.status === 'CANCELED' &&
      existingInvoice.status !== 'CANCELED'
    ) {
      const workHoursCount = updatedInvoice.invoiceWorkHours.length;
      this.logger.log(
        `📋 Invoice ${id} canceled - ${workHoursCount} work hours are now available for reuse`,
      );
    }

    return updatedInvoice;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // Verify invoice exists and belongs to user

    return this.prisma.invoice.delete({
      where: { id },
    });
  }

  // Buscar invoices por cliente (para dashboard público)
  async findByClient(clientId: string) {
    return this.prisma.invoice.findMany({
      where: { clientId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
        invoiceWorkHours: {
          include: {
            workHour: {
              select: {
                id: true,
                date: true,
                description: true,
                hours: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getStats(userId: string, filters: StatsFilters) {
    const where = {
      invoiceWorkHours: {
        some: {
          workHour: {
            userId,
            ...(filters.from && filters.to
              ? {
                  date: {
                    gte: filters.from,
                    lte: filters.to,
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
      },
    });

    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const totalPending = invoices
      .filter((inv) => inv.status === 'PENDING')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const totalCanceled = invoices
      .filter((inv) => inv.status === 'CANCELED')
      .reduce((sum, inv) => sum + inv.amount, 0);

    // Group by client
    const clientMap = new Map();
    invoices.forEach((inv) => {
      const key = inv.clientId;
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          clientId: inv.clientId,
          clientName: inv.client.name,
          totalAmount: 0,
        });
      }
      const client = clientMap.get(key);
      client.totalAmount += inv.amount;
    });

    // Group by month
    const monthMap = new Map();
    invoices.forEach((inv) => {
      const month = inv.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!monthMap.has(month)) {
        monthMap.set(month, {
          month,
          totalAmount: 0,
        });
      }
      const monthData = monthMap.get(month);
      monthData.totalAmount += inv.amount;
    });

    return {
      totalInvoices,
      totalAmount,
      totalPaid,
      totalPending,
      totalCanceled,
      totalAmountByClient: Array.from(clientMap.values()),
      totalAmountByMonth: Array.from(monthMap.values()),
    };
  }
}
