import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSettingsDto } from './dto/create-settings.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

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

    if (!settings) {
      // Cria se não existir, usando valores padrão para propriedades obrigatórias
      const createData: CreateSettingsDto = {
        alertHours: updateSettingsDto.alertHours ?? 160,
        notificationEmail: updateSettingsDto.notificationEmail,
      };
      return this.create(userId, createData);
    }

    return this.prisma.settings.update({
      where: { userId },
      data: updateSettingsDto,
    });
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
