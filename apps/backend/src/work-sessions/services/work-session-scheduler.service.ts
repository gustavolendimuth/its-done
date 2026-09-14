import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { WorkSession, WorkSessionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkSessionsService } from '../work-sessions.service';
import { PushService } from '../../push/push.service';
import { ActionTokenService } from './action-token.service';
import { SyncEventType } from '../dto/sync-event.dto';

// Cross-referenced with work-timer-engine.ts (frontend, T15): a local-first
// device replicates this exact 60min/15min rule with its own clock so the
// prompt/auto-pause behavior is identical online or fully offline.
const HOURLY_PROMPT_INTERVAL_MS = 60 * 60 * 1000;
const AUTO_PAUSE_GRACE_MS = 15 * 60 * 1000;

@Injectable()
export class WorkSessionSchedulerService {
  constructor(
    private prisma: PrismaService,
    private workSessionsService: WorkSessionsService,
    private pushService: PushService,
    private actionTokenService: ActionTokenService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async tick(): Promise<void> {
    const now = new Date();

    const runningSessions = await this.prisma.workSession.findMany({
      where: { status: WorkSessionStatus.RUNNING },
    });

    for (const session of runningSessions) {
      const referenceTime = session.lastConfirmedAt ?? session.startedAt;
      const dueForPrompt =
        now.getTime() - referenceTime.getTime() >= HOURLY_PROMPT_INTERVAL_MS &&
        (!session.lastPromptAt ||
          session.lastPromptAt.getTime() < referenceTime.getTime());

      if (dueForPrompt) {
        await this.sendPrompt(session, now);
        continue;
      }

      const dueForAutoPause =
        session.lastPromptAt !== null &&
        now.getTime() - session.lastPromptAt.getTime() >= AUTO_PAUSE_GRACE_MS;

      if (dueForAutoPause) {
        await this.autoPause(session, now);
      }
    }
  }

  private async sendPrompt(session: WorkSession, now: Date): Promise<void> {
    const nonce = randomUUID();

    await this.prisma.workSession.update({
      where: { id: session.id },
      data: { promptNonce: nonce, lastPromptAt: now },
    });

    const actionToken = this.actionTokenService.issue(session.id, nonce);

    await this.pushService.sendToUser(session.userId, {
      title: 'Ainda está trabalhando?',
      body: 'Confirme se deseja continuar a sessão de trabalho.',
      data: { sessionId: session.id, actionToken },
      actions: [
        { action: 'confirm', title: 'Sim, continuar' },
        { action: 'stop', title: 'Não, encerrar' },
      ],
    });
  }

  private async autoPause(session: WorkSession, now: Date): Promise<void> {
    // Reuses applyEvents' `pause` transition (same freeze math already
    // covered by work-sessions.service.spec.ts) instead of duplicating it.
    await this.workSessionsService.applyEvents(session.userId, [
      {
        eventId: randomUUID(),
        sessionId: session.id,
        type: SyncEventType.PAUSE,
        clientTimestamp: now.toISOString(),
      },
    ]);
  }
}
