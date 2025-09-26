import { IsString, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;
}
