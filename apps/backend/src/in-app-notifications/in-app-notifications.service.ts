import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInAppNotificationDto } from './dto/create-notification.dto';
import { UpdateInAppNotificationDto } from './dto/update-notification.dto';
import { InAppNotificationType } from '@prisma/client';

@Injectable()
export class InAppNotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateInAppNotificationDto) {
    return this.prisma.inAppNotification.create({
      data: {
        userId,
        title: dto.title,
        message: dto.message,
        type: dto.type || InAppNotificationType.INFO,
        metadata: dto.metadata || null,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.inAppNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUnread(userId: string) {
    return this.prisma.inAppNotification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.inAppNotification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.inAppNotification.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateInAppNotificationDto) {
    return this.prisma.inAppNotification.updateMany({
      where: {
        id,
        userId,
      },
      data: dto,
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.inAppNotification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        read: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.inAppNotification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.inAppNotification.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }

  async removeAll(userId: string) {
    return this.prisma.inAppNotification.deleteMany({
      where: { userId },
    });
  }

  // Helper method to create hours threshold notification
  async createHoursThresholdNotification(
    userId: string,
    totalHours: number,
    threshold: number,
    clientName?: string,
    invoiceId?: string,
  ) {
    const title = clientName
      ? `${clientName} - Hours Threshold Reached`
      : 'Hours Threshold Reached';

    const message = clientName
      ? `Client ${clientName} has logged ${totalHours} hours, reaching the threshold of ${threshold} hours. A draft invoice has been created automatically.`
      : `You have logged ${totalHours} hours, reaching your configured threshold of ${threshold} hours.`;

    return this.create(userId, {
      title,
      message,
      type: InAppNotificationType.WARNING,
      metadata: {
        totalHours,
        threshold,
        clientName,
        invoiceId,
        action: invoiceId ? 'view_draft_invoice' : 'create_invoice',
      },
    });
  }

  // Helper method to create invoice uploaded notification
  async createInvoiceUploadedNotification(
    userId: string,
    invoiceId: string,
    clientName: string,
  ) {
    return this.create(userId, {
      title: 'Invoice Created',
      message: `Invoice for ${clientName} has been successfully created and uploaded.`,
      type: InAppNotificationType.SUCCESS,
      metadata: {
        invoiceId,
        clientName,
        action: 'view_invoice',
      },
    });
  }

  // MW-23: notifies a User that they were just linked as Colaborador to an
  // Empresa (via Convite Pendente or Domínio Autorizado).
  async createColaboradorLinkedNotification(
    userId: string,
    empresaName: string,
  ) {
    return this.create(userId, {
      title: `Linked to ${empresaName}`,
      message: `You were linked as Colaborador to ${empresaName}. They can now see your aggregated hours, projects and invoices.`,
      type: InAppNotificationType.INFO,
      metadata: {
        empresaName,
        action: 'view_empresas',
      },
    });
  }

  // MW-23: notifies a User that their Colaborador link to an Empresa was
  // removed, by themselves or by the Empresa's Administrador.
  async createColaboradorUnlinkedNotification(
    userId: string,
    empresaName: string,
    unlinkedBy: 'colaborador' | 'admin',
  ) {
    const message =
      unlinkedBy === 'admin'
        ? `The Administrator of ${empresaName} removed you as Colaborador. Your existing hours, projects and invoices remain unchanged.`
        : `You unlinked yourself from ${empresaName}. Your existing hours, projects and invoices remain unchanged.`;

    return this.create(userId, {
      title: `Unlinked from ${empresaName}`,
      message,
      type: InAppNotificationType.INFO,
      metadata: {
        empresaName,
        unlinkedBy,
        action: 'view_empresas',
      },
    });
  }

  // MW-26: notifies a Colaborador that the Empresa they are linked to was
  // deactivated (all its EmpresaAdmin removed). The Colaborador link itself
  // is untouched — this only explains why the "Empresa vinculada" badge
  // disappeared.
  async createEmpresaDeactivatedNotification(
    userId: string,
    empresaName: string,
  ) {
    return this.create(userId, {
      title: `${empresaName} was deactivated`,
      message: `${empresaName} deactivated its account and no longer manages it. You can keep logging and invoicing hours against it normally.`,
      type: InAppNotificationType.INFO,
      metadata: {
        empresaName,
        action: 'view_empresas',
      },
    });
  }
}
