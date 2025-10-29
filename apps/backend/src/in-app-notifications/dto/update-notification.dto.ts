import { IsBoolean, IsOptional } from 'class-validator';
import { CreateInAppNotificationDto } from './create-notification.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateInAppNotificationDto extends PartialType(
  CreateInAppNotificationDto,
) {
  @IsBoolean()
  @IsOptional()
  read?: boolean;
}
