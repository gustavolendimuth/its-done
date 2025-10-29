import { Module, forwardRef } from '@nestjs/common';
import { WorkHoursService } from './work-hours.service';
import { WorkHoursController } from './work-hours.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { InAppNotificationsModule } from '../in-app-notifications/in-app-notifications.module';
import { HoursThresholdCheckerService } from './services/hours-threshold-checker.service';
import { DraftInvoiceService } from './services/draft-invoice.service';

@Module({
  imports: [
    NotificationsModule,
    InAppNotificationsModule,
  ],
  controllers: [WorkHoursController],
  providers: [
    WorkHoursService,
    HoursThresholdCheckerService,
    DraftInvoiceService,
  ],
  exports: [WorkHoursService],
})
export class WorkHoursModule {}
