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
}
