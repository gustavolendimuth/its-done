import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { InAppNotificationType } from '@prisma/client';

export class CreateInAppNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(InAppNotificationType)
  @IsOptional()
  type?: InAppNotificationType;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
