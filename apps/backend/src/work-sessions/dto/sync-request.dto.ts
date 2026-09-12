import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SyncEventDto } from './sync-event.dto';

export class SyncRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncEventDto)
  events: SyncEventDto[];
}
