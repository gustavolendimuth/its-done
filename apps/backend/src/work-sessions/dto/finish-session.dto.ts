import { IsOptional, IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class FinishSessionDto {
  @IsUUID(4, { message: 'Client ID must be a valid UUID' })
  clientId: string;

  @IsOptional()
  @IsUUID(4, { message: 'Project ID must be a valid UUID' })
  projectId?: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
