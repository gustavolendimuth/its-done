import { Module } from '@nestjs/common';
import { WorkSessionsService } from './work-sessions.service';
import { WorkSessionsController } from './work-sessions.controller';

@Module({
  controllers: [WorkSessionsController],
  providers: [WorkSessionsService],
  exports: [WorkSessionsService],
})
export class WorkSessionsModule {}
