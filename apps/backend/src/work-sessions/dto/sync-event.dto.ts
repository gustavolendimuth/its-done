import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export enum SyncEventType {
  START = 'start',
  CONFIRM = 'confirm',
  PAUSE = 'pause',
  STOP = 'stop',
  DISCARD = 'discard',
}

export class SyncEventDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsEnum(SyncEventType)
  type: SyncEventType;

  @IsISO8601()
  clientTimestamp: string;

  // Only meaningful on a `start` event — WKT-10 "preencher detalhes antes de
  // iniciar". Ignored by every other event type.
  @IsOptional()
  @IsUUID(4, { message: 'Client ID must be a valid UUID' })
  clientId?: string;

  @IsOptional()
  @IsUUID(4, { message: 'Project ID must be a valid UUID' })
  projectId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
