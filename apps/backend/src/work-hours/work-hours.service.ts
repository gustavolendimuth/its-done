import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkHourDto } from './dto/create-work-hour.dto';
import { UpdateWorkHourDto } from './dto/update-work-hour.dto';
import { HoursThresholdCheckerService } from './services/hours-threshold-checker.service';

@Injectable()
export class WorkHoursService {
  constructor(
    private prisma: PrismaService,
    private hoursThresholdChecker: HoursThresholdCheckerService,
  ) {}

  async create(userId: string, createWorkHourDto: CreateWorkHourDto) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const workHour = await this.prisma.workHour.create({
      data: {
        date: createWorkHourDto.date,
        hours: createWorkHourDto.hours,
        description: createWorkHourDto.description,
        client: {
          connect: {
            id: createWorkHourDto.clientId,
          },
        },
        project: createWorkHourDto.projectId
          ? {
              connect: {
                id: createWorkHourDto.projectId,
              },
            }
          : undefined,
        user: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        client: true,
        project: true,
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
   * Manually check and send notification if threshold is reached
   * Can be called via API endpoint
   */
  async checkNotificationManually(userId: string) {
    return this.hoursThresholdChecker.checkAndNotify(userId);
  }

  /**
   * Check if any client has reached hours threshold
   * Delegates to HoursThresholdCheckerService
   */
  private async checkAndSendHoursThresholdNotification(userId: string) {
    return this.hoursThresholdChecker.checkAndNotify(userId);
  }
}
