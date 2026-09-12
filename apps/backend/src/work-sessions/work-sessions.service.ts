import { BadRequestException, Injectable } from '@nestjs/common';
import { WorkSession, WorkSessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SyncEventDto, SyncEventType } from './dto/sync-event.dto';

const ACTIVE_STATUSES: WorkSessionStatus[] = [
  WorkSessionStatus.RUNNING,
  WorkSessionStatus.PAUSED,
  WorkSessionStatus.STOPPING,
];

// Cross-referenced with WorkSessionSchedulerService (T13) and
// work-timer-engine.ts (T15): the 7-day rejection window for `start`.
const MAX_START_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface DiscardedInfo {
  sessionId: string;
  reason: string;
}

export interface ApplyEventsResult {
  session: WorkSession | null;
  discarded?: DiscardedInfo;
}

function clamp(ts: Date, lower: Date, upper: Date): Date {
  if (ts.getTime() < lower.getTime()) return lower;
  if (ts.getTime() > upper.getTime()) return upper;
  return ts;
}

// Rounds a duration to the nearest 15-minute increment (ties round up),
// per spec.md's "Cálculo das horas" rule.
function roundHoursToQuarter(totalSeconds: number): number {
  const minutes = totalSeconds / 60;
  const roundedMinutes = Math.round(minutes / 15) * 15;
  return roundedMinutes / 60;
}

@Injectable()
export class WorkSessionsService {
  constructor(private prisma: PrismaService) {}

  async getActiveSession(userId: string): Promise<WorkSession | null> {
    return this.prisma.workSession.findFirst({
      where: { userId, status: { in: ACTIVE_STATUSES } },
    });
  }

  async applyEvents(
    userId: string,
    events: SyncEventDto[],
  ): Promise<ApplyEventsResult> {
    let discarded: DiscardedInfo | undefined;

    for (const event of events) {
      const alreadyApplied =
        await this.prisma.workSessionSyncedEvent.findUnique({
          where: { eventId: event.eventId },
        });
      if (alreadyApplied) {
        continue;
      }

      const outcome = await this.applyOneEvent(userId, event);
      if (outcome && outcome.discarded) {
        discarded = outcome.discarded;
      }

      await this.prisma.workSessionSyncedEvent.create({
        data: {
          eventId: event.eventId,
          sessionId: event.sessionId,
          type: event.type,
        },
      });
    }

    const session = await this.getActiveSession(userId);
    return { session, discarded };
  }

  private async applyOneEvent(
    userId: string,
    event: SyncEventDto,
  ): Promise<{ discarded?: DiscardedInfo } | void> {
    const clientTimestamp = new Date(event.clientTimestamp);

    switch (event.type) {
      case SyncEventType.START:
        return this.applyStart(userId, event.sessionId, clientTimestamp);
      case SyncEventType.CONFIRM:
        return this.applyConfirm(event.sessionId, clientTimestamp);
      case SyncEventType.PAUSE:
        return this.applyPause(event.sessionId, clientTimestamp);
      case SyncEventType.STOP:
        return this.applyStop(event.sessionId, clientTimestamp);
      case SyncEventType.DISCARD:
        return this.applyDiscard(event.sessionId);
      default:
        return;
    }
  }

  private async applyStart(
    userId: string,
    sessionId: string,
    clientTimestamp: Date,
  ): Promise<{ discarded?: DiscardedInfo } | void> {
    const now = new Date();

    const age = now.getTime() - clientTimestamp.getTime();
    if (age > MAX_START_AGE_MS) {
      throw new BadRequestException(
        'startedAt is too far in the past (more than 7 days)',
      );
    }

    const startedAt = clientTimestamp > now ? now : clientTimestamp;

    const existing = await this.getActiveSession(userId);
    if (!existing) {
      await this.prisma.workSession.create({
        data: {
          id: sessionId,
          userId,
          status: WorkSessionStatus.RUNNING,
          startedAt,
          currentSegmentStartedAt: startedAt,
          accumulatedSeconds: 0,
        },
      });
      return;
    }

    // Conflict resolution between competing active sessions for the same
    // user is implemented in a follow-up task (single-active-session rule).
    return;
  }

  private async applyConfirm(sessionId: string, clientTimestamp: Date) {
    const session = await this.prisma.workSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || !ACTIVE_STATUSES.includes(session.status)) {
      return;
    }

    const now = new Date();
    const lowerBound = session.currentSegmentStartedAt ?? session.startedAt;
    const ts = clamp(clientTimestamp, lowerBound, now);

    const data: {
      lastConfirmedAt: Date;
      lastPromptAt: null;
      status?: WorkSessionStatus;
      currentSegmentStartedAt?: Date;
    } = {
      lastConfirmedAt: ts,
      lastPromptAt: null,
    };

    if (session.status === WorkSessionStatus.PAUSED) {
      data.status = WorkSessionStatus.RUNNING;
      data.currentSegmentStartedAt = ts;
    }

    await this.prisma.workSession.update({ where: { id: sessionId }, data });
  }

  private async applyPause(sessionId: string, clientTimestamp: Date) {
    const session = await this.prisma.workSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.status !== WorkSessionStatus.RUNNING) {
      return;
    }

    const now = new Date();
    const lowerBound = session.currentSegmentStartedAt ?? session.startedAt;
    const ts = clamp(clientTimestamp, lowerBound, now);
    const segmentSeconds = Math.round(
      (ts.getTime() - lowerBound.getTime()) / 1000,
    );

    await this.prisma.workSession.update({
      where: { id: sessionId },
      data: {
        accumulatedSeconds: session.accumulatedSeconds + segmentSeconds,
        currentSegmentStartedAt: null,
        status: WorkSessionStatus.PAUSED,
      },
    });
  }

  private async applyStop(sessionId: string, clientTimestamp: Date) {
    const session = await this.prisma.workSession.findUnique({
      where: { id: sessionId },
    });
    const stoppableStatuses: WorkSessionStatus[] = [
      WorkSessionStatus.RUNNING,
      WorkSessionStatus.PAUSED,
    ];
    if (!session || !stoppableStatuses.includes(session.status)) {
      return;
    }

    const now = new Date();
    let accumulatedSeconds = session.accumulatedSeconds;

    if (session.status === WorkSessionStatus.RUNNING) {
      const lowerBound = session.currentSegmentStartedAt ?? session.startedAt;
      const ts = clamp(clientTimestamp, lowerBound, now);
      accumulatedSeconds += Math.round(
        (ts.getTime() - lowerBound.getTime()) / 1000,
      );
    }

    const hours = roundHoursToQuarter(accumulatedSeconds);

    await this.prisma.workSession.update({
      where: { id: sessionId },
      data: {
        accumulatedSeconds,
        currentSegmentStartedAt: null,
        status: WorkSessionStatus.STOPPING,
        hours,
      },
    });
  }

  private async applyDiscard(sessionId: string) {
    const session = await this.prisma.workSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || !ACTIVE_STATUSES.includes(session.status)) {
      return;
    }

    await this.prisma.workSession.update({
      where: { id: sessionId },
      data: { status: WorkSessionStatus.DISCARDED },
    });
  }
}
