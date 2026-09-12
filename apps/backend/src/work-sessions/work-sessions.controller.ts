import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WorkSessionsService } from './work-sessions.service';
import { SyncRequestDto } from './dto/sync-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('work-sessions')
export class WorkSessionsController {
  constructor(private readonly workSessionsService: WorkSessionsService) {}

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  async sync(@Request() req, @Body() dto: SyncRequestDto) {
    try {
      return await this.workSessionsService.applyEvents(
        req.user.id,
        dto.events,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Lost a concurrent single-active-session race against the DB's
        // partial unique index; the losing event was never written to the
        // sync ledger, so the client's outbox retries it on the next sync.
        const session = await this.workSessionsService.getActiveSession(
          req.user.id,
        );
        return { session };
      }
      throw error;
    }
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  async active(@Request() req) {
    const session = await this.workSessionsService.getActiveSession(
      req.user.id,
    );
    return { session };
  }
}
