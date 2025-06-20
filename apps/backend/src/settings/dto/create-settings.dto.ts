import { IsEmail, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateSettingsDto {
  @IsNumber()
  @Min(1, { message: 'Alert hours must be at least 1' })
  alertHours: number;

  @IsOptional()
  @IsEmail()
  notificationEmail?: string;
}
