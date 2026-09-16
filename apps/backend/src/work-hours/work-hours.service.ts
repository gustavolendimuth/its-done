import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkHourDto } from './dto/create-work-hour.dto';
import { UpdateWorkHourDto } from './dto/update-work-hour.dto';
import { HoursThresholdCheckerService } from './services/hours-threshold-checker.service';
import { SettingsService } from '../settings/settings.service';
import { roundHoursToIncrement } from './utils/round-hours.util';

const MIN_HOURS = 0.1;

function hmToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

// Valida o par startTime/endTime já mesclado (o que a linha vai efetivamente
// ficar após a operação) - exatamente um dos dois presente, ou endTime não
// estritamente depois de startTime, são erros de validação.
function assertValidTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
) {
  if (!!startTime !== !!endTime) {
    throw new BadRequestException(
      'startTime and endTime must be provided together',
    );
  }
  if (startTime && endTime && hmToMinutes(endTime) <= hmToMinutes(startTime)) {
    throw new BadRequestException('endTime must be after startTime');
  }
}

@Injectable()
export class WorkHoursService {
  constructor(
    private prisma: PrismaService,
    private hoursThresholdChecker: HoursThresholdCheckerService,
    @Inject(forwardRef(() => SettingsService))
    private settingsService: SettingsService,
  ) {}

  private async applyRounding(userId: string, hours: number) {
    const settings = await this.settingsService.findByUserId(userId);
    const rounded = roundHoursToIncrement(
      hours,
      settings.roundingIncrementMinutes ?? 0,
    );

    if (rounded < MIN_HOURS) {
      throw new BadRequestException('Hours must be at least 0.1');
    }

    return rounded;
  }

  async create(userId: string, createWorkHourDto: CreateWorkHourDto) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    assertValidTimeRange(
      createWorkHourDto.startTime,
      createWorkHourDto.endTime,
    );

    if (createWorkHourDto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: createWorkHourDto.projectId },
      });

      if (!project || project.clientId !== createWorkHourDto.clientId) {
        throw new BadRequestException(
          'Project does not belong to the selected client',
        );
      }
    }

    if (createWorkHourDto.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: createWorkHourDto.taskId },
      });

      if (!task || task.clientId !== createWorkHourDto.clientId) {
        throw new BadRequestException(
          'Task does not belong to the selected client',
        );
      }
    }

    const hours = await this.applyRounding(userId, createWorkHourDto.hours);

    const workHour = await this.prisma.workHour.create({
      data: {
        date: createWorkHourDto.date,
        hours,
        startTime: createWorkHourDto.startTime,
        endTime: createWorkHourDto.endTime,
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
        task: createWorkHourDto.taskId
          ? {
              connect: {
                id: createWorkHourDto.taskId,
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
        task: true,
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
        task: true,
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
        task: true,
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
        task: true,
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
      include: {
        invoiceWorkHours: {
          include: {
            invoice: {
              select: { status: true },
            },
          },
        },
      },
    });

    if (!workHour) {
      throw new NotFoundException('Work hour not found');
    }

    const isInvoiced = workHour.invoiceWorkHours.some(
      (invoiceWorkHour) => invoiceWorkHour.invoice.status !== 'CANCELED',
    );

    if (isInvoiced) {
      throw new BadRequestException(
        'Cannot edit a work hour that has already been invoiced',
      );
    }

    assertValidTimeRange(
      updateWorkHourDto.startTime ?? workHour.startTime,
      updateWorkHourDto.endTime ?? workHour.endTime,
    );

    if (updateWorkHourDto.taskId) {
      const task = await this.prisma.task.findUnique({
        where: { id: updateWorkHourDto.taskId },
      });

      const effectiveClientId =
        updateWorkHourDto.clientId ?? workHour.clientId;

      if (!task || task.clientId !== effectiveClientId) {
        throw new BadRequestException(
          'Task does not belong to the selected client',
        );
      }
    }

    const data =
      updateWorkHourDto.hours !== undefined
        ? {
            ...updateWorkHourDto,
            hours: await this.applyRounding(userId, updateWorkHourDto.hours),
          }
        : updateWorkHourDto;

    const updatedWorkHour = await this.prisma.workHour.update({
      where: { id },
      data,
      include: {
        client: true,
        project: true,
        task: true,
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

    // Average per day worked: divide by the number of distinct days that
    // actually have entries, not by the calendar span of the filter. Using the
    // calendar span made the "all time" range (which starts in the year 2000)
    // collapse the average to ~0, and an unbounded query inflate it to the full
    // total. This matches the "per working day" label shown in the UI and the
    // same calculation already used by reports.service.
    const workedDays = new Set(
      workHours.map((wh) => wh.date.toISOString().split('T')[0]),
    ).size;
    const averageHoursPerDay = workedDays > 0 ? totalHours / workedDays : 0;

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
