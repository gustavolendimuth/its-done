import { IsEnum, IsISO8601, IsString, IsNotEmpty } from 'class-validator';

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
}
