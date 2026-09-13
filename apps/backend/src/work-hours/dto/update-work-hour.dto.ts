import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateWorkHourDto {
  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : value))
  date?: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Hours must be a number with at most 2 decimal places' },
  )
  @Min(0.1, { message: 'Hours must be at least 0.1' })
  @Max(24, { message: 'Hours cannot exceed 24 hours per day' })
  hours?: number;

  @IsOptional()
  @IsUUID()
  clientId?: string;
}
