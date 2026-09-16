import {
  IsISO8601,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class FinishSessionDto {
  @IsUUID(4, { message: 'Client ID must be a valid UUID' })
  clientId: string;

  @IsOptional()
  @IsUUID(4, { message: 'Project ID must be a valid UUID' })
  projectId?: string;

  @IsOptional()
  @IsUUID(4, { message: 'Task ID must be a valid UUID' })
  taskId?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  // WKT-11 "registrar a sessão num dia diferente" — when omitted, the
  // controller falls back to the session's own startedAt (previous
  // behavior), so a person can backdate an entry they forgot to log on the
  // actual day.
  @IsOptional()
  @IsISO8601()
  date?: string;
}
