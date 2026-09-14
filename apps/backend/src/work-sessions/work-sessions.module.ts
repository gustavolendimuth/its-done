import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WorkSessionsService } from './work-sessions.service';
import { WorkSessionsController } from './work-sessions.controller';
import { ActionTokenService } from './services/action-token.service';
import { WorkHoursModule } from '../work-hours/work-hours.module';

@Module({
  imports: [JwtModule.register({}), WorkHoursModule],
  controllers: [WorkSessionsController],
  providers: [WorkSessionsService, ActionTokenService],
  exports: [WorkSessionsService, ActionTokenService],
})
export class WorkSessionsModule {}
