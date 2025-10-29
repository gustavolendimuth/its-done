import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DraftInvoiceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a draft invoice for a client with available hours
   */
  async createDraft(userId: string, clientId: string, workHours: any[]) {
    // Calculate total amount from work hours
    let totalAmount = 0;
    const workHourIds: string[] = [];

    for (const wh of workHours) {
      const hourlyRate = wh.project?.hourlyRate || 0;
      totalAmount += wh.hours * hourlyRate;
      workHourIds.push(wh.id);
    }

    const totalHours = workHours.reduce(
      (sum, wh) => sum + wh.hours,
      0,
    );

    // Create draft invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        clientId,
        amount: totalAmount,
        status: 'DRAFT',
        description: `Auto-generated draft - ${totalHours.toFixed(2)}h (${workHours.length} entries)`,
        invoiceWorkHours: {
          create: workHourIds.map((workHourId) => ({
            workHourId,
          })),
        },
      },
      include: {
        client: true,
        invoiceWorkHours: {
          include: {
            workHour: {
              include: {
                project: true,
              },
            },
          },
        },
      },
    });

    return invoice;
  }

  /**
   * Convert a draft invoice to pending status
   */
  async convertToPending(invoiceId: string, userId: string) {
    // Verify the invoice belongs to the user
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        client: {
          userId,
        },
        status: 'DRAFT',
      },
    });

    if (!invoice) {
      throw new Error('Draft invoice not found or already converted');
    }

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PENDING',
      },
      include: {
        client: true,
        invoiceWorkHours: {
          include: {
            workHour: true,
          },
        },
      },
    });
  }

  /**
   * Delete a draft invoice (release work hours)
   */
  async deleteDraft(invoiceId: string, userId: string) {
    // Verify the invoice belongs to the user and is a draft
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        client: {
          userId,
        },
        status: 'DRAFT',
      },
    });

    if (!invoice) {
      throw new Error('Draft invoice not found');
    }

    // Delete will cascade and remove InvoiceWorkHour entries
    await this.prisma.invoice.delete({
      where: { id: invoiceId },
    });

    return { message: 'Draft invoice deleted successfully' };
  }
}
