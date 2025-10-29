import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSettingsDto } from './dto/create-settings.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { WorkHoursService } from '../work-hours/work-hours.service';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => WorkHoursService))
    private workHoursService: WorkHoursService,
  ) {}

  async create(userId: string, createSettingsDto: CreateSettingsDto) {
    return this.prisma.settings.create({
      data: {
        ...createSettingsDto,
        userId,
      },
    });
  }

  async findByUserId(userId: string) {
    const settings = await this.prisma.settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Retorna configurações padrão se não existir
      return {
        userId,
        alertHours: 160,
        notificationEmail: null,
      };
    }

    return settings;
  }

  async update(userId: string, updateSettingsDto: UpdateSettingsDto) {
    const settings = await this.prisma.settings.findUnique({
      where: { userId },
    });

    let updatedSettings;

    if (!settings) {
      // Cria se não existir, usando valores padrão para propriedades obrigatórias
      const createData: CreateSettingsDto = {
        alertHours: updateSettingsDto.alertHours ?? 160,
        notificationEmail: updateSettingsDto.notificationEmail,
      };
      updatedSettings = await this.create(userId, createData);
    } else {
      updatedSettings = await this.prisma.settings.update({
        where: { userId },
        data: updateSettingsDto,
      });
    }

    // Check if alertHours was changed and trigger notification check
    if (updateSettingsDto.alertHours !== undefined) {
      // Run notification check in background (don't wait)
      this.workHoursService.checkNotificationManually(userId).catch((error) => {
        console.error('Error checking notification after settings update:', error);
      });
    }

    return updatedSettings;
  }

  async remove(userId: string) {
    const settings = await this.prisma.settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      throw new NotFoundException('Settings not found');
    }

    await this.prisma.settings.delete({
      where: { userId },
    });

    return { message: 'Settings deleted successfully' };
  }
}
