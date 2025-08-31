import {
  IsDate,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateWorkHourDto {
  @IsDate()
  @Transform(({ value }) => new Date(value))
  date: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Hours must be a number with at most 2 decimal places' },
  )
  @Min(0.1, { message: 'Hours must be at least 0.1' })
  @Max(24, { message: 'Hours cannot exceed 24 hours per day' })
  hours: number;

  @IsUUID(4, { message: 'Client ID must be a valid UUID' })
  clientId: string;

  @IsOptional()
  @IsUUID(4, { message: 'Project ID must be a valid UUID' })
  projectId?: string;
}
