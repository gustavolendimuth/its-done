import { Module, forwardRef } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { WorkHoursModule } from '../work-hours/work-hours.module';

@Module({
  imports: [forwardRef(() => WorkHoursModule)],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
