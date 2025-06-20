import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkHourDto } from './dto/create-work-hour.dto';
import { UpdateWorkHourDto } from './dto/update-work-hour.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WorkHoursService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, createWorkHourDto: CreateWorkHourDto) {
    const workHour = await this.prisma.workHour.create({
      data: {
        ...createWorkHourDto,
        userId,
      },
    });

    // Check if hours threshold notification should be sent
    await this.checkAndSendHoursThresholdNotification(userId);

    return workHour;
  }

  async findAll(userId: string, from?: Date, to?: Date, clientId?: string) {
    const where = {
      userId,
      ...(from && to
        ? {
            date: {
              gte: from,
              lte: to,
            },
          }
        : {}),
      ...(clientId ? { clientId } : {}),
    };

    return this.prisma.workHour.findMany({
      where,
      include: {
        client: true,
        project: true,
        invoiceWorkHours: {
          include: {
            invoice: {
              select: {
                id: true,
                status: true,
                number: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findAvailable(
    userId: string,
    from?: Date,
    to?: Date,
    clientId?: string,
  ) {
    const where = {
      userId,
      ...(from && to
        ? {
            date: {
              gte: from,
              lte: to,
            },
          }
        : {}),
      ...(clientId ? { clientId } : {}),
    };

    return this.prisma.workHour.findMany({
      where: {
        ...where,
        OR: [
          // Horas que não estão em nenhuma fatura
          {
            invoiceWorkHours: {
              none: {},
            },
          },
          // Horas que estão apenas em faturas canceladas
          {
            invoiceWorkHours: {
              every: {
                invoice: {
                  status: 'CANCELED',
                },
              },
            },
          },
        ],
      },
      include: {
        client: true,
        project: true,
        invoiceWorkHours: {
          include: {
            invoice: {
              select: {
                id: true,
                status: true,
                number: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const workHour = await this.prisma.workHour.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        client: true,
        project: true,
      },
    });

    if (!workHour) {
      throw new NotFoundException('Work hour not found');
    }

    return workHour;
  }

  async update(
    userId: string,
    id: string,
    updateWorkHourDto: UpdateWorkHourDto,
  ) {
    const workHour = await this.prisma.workHour.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!workHour) {
      throw new NotFoundException('Work hour not found');
    }

    const updatedWorkHour = await this.prisma.workHour.update({
      where: { id },
      data: updateWorkHourDto,
      include: {
        client: true,
        project: true,
      },
    });

    // Check if hours threshold notification should be sent
    await this.checkAndSendHoursThresholdNotification(userId);

    return updatedWorkHour;
  }

  async remove(userId: string, id: string) {
    const workHour = await this.prisma.workHour.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!workHour) {
      throw new NotFoundException('Work hour not found');
    }

    await this.prisma.workHour.delete({
      where: { id },
    });

    return { message: 'Work hour deleted successfully' };
  }

  async getTotalHours(userId: string, startDate?: Date, endDate?: Date) {
    const where = {
      userId,
      ...(startDate && endDate
        ? {
            date: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {}),
    };

    const workHours = await this.prisma.workHour.findMany({
      where,
      select: {
        hours: true,
      },
    });

    return workHours.reduce((total, workHour) => total + workHour.hours, 0);
  }

  async getStats(userId: string, from?: Date, to?: Date, clientId?: string) {
    const where = {
      userId,
      ...(from && to
        ? {
            date: {
              gte: from,
              lte: to,
            },
          }
        : {}),
      ...(clientId ? { clientId } : {}),
    };

    const workHours = await this.prisma.workHour.findMany({
      where,
      include: {
        client: true,
        project: true,
      },
    });

    const totalHours = workHours.reduce((sum, wh) => sum + wh.hours, 0);

    // Calculate average hours per day
    const dateRange =
      from && to
        ? Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 1;
    const averageHoursPerDay = totalHours / dateRange;

    // Count unique clients
    const uniqueClients = new Set(workHours.map((wh) => wh.clientId));
    const activeClients = uniqueClients.size;

    return {
      totalHours: Math.round(totalHours * 100) / 100,
      averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
      activeClients,
    };
  }

  /**
   * Check if user has reached hours threshold and send notification if needed
   * Prevents spam by checking if notification was already sent for this threshold
   */
  private async checkAndSendHoursThresholdNotification(userId: string) {
    try {
      // Get user settings
      const settings = await this.prisma.settings.findUnique({
        where: { userId },
      });

      if (!settings || !settings.notificationEmail || !settings.alertHours) {
        return;
      }

      // Calculate total hours for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const totalHours = await this.getTotalHours(
        userId,
        startOfMonth,
        endOfMonth,
      );

      // Check if threshold is reached
      if (totalHours >= settings.alertHours) {
        // Check if notification was already sent for this threshold this month
        const existingNotification = await (
          this.prisma as any
        ).notificationLog.findFirst({
          where: {
            userId,
            type: 'HOURS_THRESHOLD',
            threshold: settings.alertHours,
            sentAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        // Send notification only if not already sent
        if (!existingNotification) {
          await this.notificationsService.sendHoursThresholdAlert(
            userId,
            totalHours,
          );

          // Log the notification
          await (this.prisma as any).notificationLog.create({
            data: {
              userId,
              type: 'HOURS_THRESHOLD',
              threshold: settings.alertHours,
              totalHours,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error checking hours threshold notification:', error);
    }
  }
}
