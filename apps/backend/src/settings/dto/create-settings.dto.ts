import { IsEmail, IsIn, IsNumber, IsOptional, Min } from 'class-validator';

export const ALLOWED_ROUNDING_INCREMENTS = [0, 5, 10, 15, 30, 60] as const;

export class CreateSettingsDto {
  @IsNumber()
  @Min(1, { message: 'Alert hours must be at least 1' })
  alertHours: number;

  @IsOptional()
  @IsEmail()
  notificationEmail?: string;

  @IsOptional()
  @IsIn(ALLOWED_ROUNDING_INCREMENTS, {
    message: 'Rounding increment must be one of 0, 5, 10, 15, 30 or 60 minutes',
  })
  roundingIncrementMinutes?: number;
}
