import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

const HH_MM_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
const HH_MM_MESSAGE = 'must be in HH:mm format';

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
  @Matches(HH_MM_REGEX, { message: `startTime ${HH_MM_MESSAGE}` })
  startTime?: string;

  @IsOptional()
  @Matches(HH_MM_REGEX, { message: `endTime ${HH_MM_MESSAGE}` })
  endTime?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID(4, { message: 'Task ID must be a valid UUID' })
  taskId?: string;
}
