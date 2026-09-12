import { Controller } from '@nestjs/common';
import { WorkSessionsService } from './work-sessions.service';

@Controller('work-sessions')
export class WorkSessionsController {
  constructor(private readonly workSessionsService: WorkSessionsService) {}
}
