import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { WorkSessionsService } from './work-sessions.service';
import { SyncRequestDto } from './dto/sync-request.dto';
import { SyncEventType } from './dto/sync-event.dto';
import { FinishSessionDto } from './dto/finish-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActionTokenService } from './services/action-token.service';
import { WorkHoursService } from '../work-hours/work-hours.service';

@Controller('work-sessions')
export class WorkSessionsController {
  constructor(
    private readonly workSessionsService: WorkSessionsService,
    private readonly actionTokenService: ActionTokenService,
    private readonly workHoursService: WorkHoursService,
  ) {}

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

  @Post(':id/confirm')
  async confirmByActionToken(
    @Param('id') id: string,
    @Query('actionToken') actionToken?: string,
  ) {
    return this.applyActionTokenEvent(id, actionToken, SyncEventType.CONFIRM);
  }

  @Post(':id/stop')
  async stopByActionToken(
    @Param('id') id: string,
    @Query('actionToken') actionToken?: string,
  ) {
    return this.applyActionTokenEvent(id, actionToken, SyncEventType.STOP);
  }

  private async applyActionTokenEvent(
    sessionId: string,
    actionToken: string | undefined,
    type: SyncEventType,
  ) {
    if (!actionToken) {
      throw new UnauthorizedException('Missing action token');
    }

    const session = await this.workSessionsService.getSessionById(sessionId);
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    const valid = await this.actionTokenService.verify(sessionId, actionToken);
    if (!valid) {
      throw new UnauthorizedException('Invalid or expired action token');
    }

    return this.workSessionsService.applyEvents(session.userId, [
      {
        eventId: randomUUID(),
        sessionId,
        type,
        clientTimestamp: new Date().toISOString(),
      },
    ]);
  }

  @Post(':id/finish')
  @UseGuards(JwtAuthGuard)
  async finish(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: FinishSessionDto,
  ) {
    const session = await this.workSessionsService.getSessionById(id);
    if (!session || session.userId !== req.user.id) {
      throw new NotFoundException('Session not found');
    }
    if (session.status !== 'STOPPING') {
      throw new BadRequestException('Session is not ready to finish');
    }

    const workHour = await this.workHoursService.create(req.user.id, {
      date: dto.date ? new Date(dto.date) : session.startedAt,
      hours: session.hours ?? 0,
      clientId: dto.clientId,
      projectId: dto.projectId,
      description: dto.description,
    });

    await this.workSessionsService.markEnded(id);

    return { workHour };
  }
}
