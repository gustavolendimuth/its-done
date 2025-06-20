import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateWorkHourDto {
  @IsOptional()
  @IsDate()
  date?: Date;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  hours?: number;

  @IsOptional()
  @IsUUID()
  clientId?: string;
}
