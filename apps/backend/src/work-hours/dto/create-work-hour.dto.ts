import {
  IsDate,
  IsNumber,
  IsString,
  IsUUID,
  IsNotEmpty,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateWorkHourDto {
  @IsDate()
  @Transform(({ value }) => new Date(value))
  date: Date;

  @IsOptional()
  @IsString()
  @MinLength(3, {
    message: 'Description must be at least 3 characters long',
  })
  @MaxLength(500, {
    message: 'Description must not exceed 500 characters',
  })
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
