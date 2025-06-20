import { Module } from '@nestjs/common';
import { WorkHoursService } from './work-hours.service';
import { WorkHoursController } from './work-hours.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [WorkHoursController],
  providers: [WorkHoursService],
  exports: [WorkHoursService],
})
export class WorkHoursModule {}
