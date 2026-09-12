import { BadRequestException } from '@nestjs/common';
import { WorkSessionsService } from './work-sessions.service';
import { SyncEventType } from './dto/sync-event.dto';

const prismaMock = {
  workSession: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  workSessionSyncedEvent: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
} as any;

const NOW = new Date('2026-01-15T12:00:00.000Z');
const userId = 'user-1';
const sessionId = 'session-1';

describe('WorkSessionsService.applyEvents() - event transitions', () => {
  let service: WorkSessionsService;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    service = new WorkSessionsService(prismaMock);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('start creates a RUNNING session when none exists locally', async () => {
    const clientTimestamp = '2026-01-15T11:00:00.000Z';
    prismaMock.workSessionSyncedEvent.findUnique.mockResolvedValueOnce(null);
    prismaMock.workSession.findFirst
      .mockResolvedValueOnce(null) // existing-active check inside applyStart
      .mockResolvedValueOnce({ id: sessionId, status: 'RUNNING' }); // final getActiveSession

    const result = await service.applyEvents(userId, [
      {
        eventId: 'e1',
        sessionId,
        type: SyncEventType.START,
        clientTimestamp,
      },
    ]);

    expect(prismaMock.workSession.create).toHaveBeenCalledWith({
      data: {
        id: sessionId,
        userId,
        status: 'RUNNING',
        startedAt: new Date(clientTimestamp),
        currentSegmentStartedAt: new Date(clientTimestamp),
        accumulatedSeconds: 0,
      },
    });
    expect(prismaMock.workSessionSyncedEvent.create).toHaveBeenCalledWith({
      data: { eventId: 'e1', sessionId, type: SyncEventType.START },
    });
    expect(result.session).toEqual({ id: sessionId, status: 'RUNNING' });
  });

  it('confirm on a RUNNING session sets lastConfirmedAt and clears lastPromptAt', async () => {
    const clientTimestamp = '2026-01-15T12:00:00.000Z';
    prismaMock.workSessionSyncedEvent.findUnique.mockResolvedValueOnce(null);
    prismaMock.workSession.findUnique.mockResolvedValueOnce({
      id: sessionId,
      status: 'RUNNING',
      startedAt: new Date('2026-01-15T11:00:00.000Z'),
      currentSegmentStartedAt: new Date('2026-01-15T11:00:00.000Z'),
      accumulatedSeconds: 0,
    });
    prismaMock.workSession.findFirst.mockResolvedValueOnce(null);

    await service.applyEvents(userId, [
      {
        eventId: 'e2',
        sessionId,
        type: SyncEventType.CONFIRM,
        clientTimestamp,
      },
    ]);

    expect(prismaMock.workSession.update).toHaveBeenCalledWith({
      where: { id: sessionId },
      data: {
        lastConfirmedAt: new Date(clientTimestamp),
        lastPromptAt: null,
      },
    });
  });

  it('confirm on a PAUSED session resumes it to RUNNING with a fresh segment', async () => {
    const clientTimestamp = '2026-01-15T12:00:00.000Z';
    prismaMock.workSessionSyncedEvent.findUnique.mockResolvedValueOnce(null);
    prismaMock.workSession.findUnique.mockResolvedValueOnce({
      id: sessionId,
      status: 'PAUSED',
      startedAt: new Date('2026-01-15T10:00:00.000Z'),
      currentSegmentStartedAt: null,
      accumulatedSeconds: 1000,
    });
    prismaMock.workSession.findFirst.mockResolvedValueOnce(null);

    await service.applyEvents(userId, [
      {
        eventId: 'e3',
        sessionId,
        type: SyncEventType.CONFIRM,
        clientTimestamp,
      },
    ]);

    expect(prismaMock.workSession.update).toHaveBeenCalledWith({
      where: { id: sessionId },
      data: {
        lastConfirmedAt: new Date(clientTimestamp),
        lastPromptAt: null,
        status: 'RUNNING',
        currentSegmentStartedAt: new Date(clientTimestamp),
      },
    });
  });

  it('pause freezes accumulatedSeconds and clears currentSegmentStartedAt', async () => {
    const segmentStart = new Date('2026-01-15T11:00:00.000Z'); // 1h before now
    const clientTimestamp = '2026-01-15T11:05:00.000Z'; // 5 min into the segment
    prismaMock.workSessionSyncedEvent.findUnique.mockResolvedValueOnce(null);
    prismaMock.workSession.findUnique.mockResolvedValueOnce({
      id: sessionId,
      status: 'RUNNING',
      startedAt: segmentStart,
      currentSegmentStartedAt: segmentStart,
      accumulatedSeconds: 100,
    });
    prismaMock.workSession.findFirst.mockResolvedValueOnce(null);

    await service.applyEvents(userId, [
      { eventId: 'e4', sessionId, type: SyncEventType.PAUSE, clientTimestamp },
    ]);

    expect(prismaMock.workSession.update).toHaveBeenCalledWith({
      where: { id: sessionId },
      data: {
        accumulatedSeconds: 100 + 5 * 60,
        currentSegmentStartedAt: null,
        status: 'PAUSED',
      },
    });
  });

  it('stop freezes time, sets STOPPING, and computes rounded hours', async () => {
    const segmentStart = new Date('2026-01-15T11:30:00.000Z'); // 30 min before now
    const clientTimestamp = '2026-01-15T12:00:00.000Z';
    prismaMock.workSessionSyncedEvent.findUnique.mockResolvedValueOnce(null);
    prismaMock.workSession.findUnique.mockResolvedValueOnce({
      id: sessionId,
      status: 'RUNNING',
      startedAt: segmentStart,
      currentSegmentStartedAt: segmentStart,
      accumulatedSeconds: 0,
    });
    prismaMock.workSession.findFirst.mockResolvedValueOnce(null);

    await service.applyEvents(userId, [
      { eventId: 'e5', sessionId, type: SyncEventType.STOP, clientTimestamp },
    ]);

    expect(prismaMock.workSession.update).toHaveBeenCalledWith({
      where: { id: sessionId },
      data: {
        accumulatedSeconds: 30 * 60,
        currentSegmentStartedAt: null,
        status: 'STOPPING',
        hours: 0.5,
      },
    });
  });

  it('discard marks the session DISCARDED', async () => {
    prismaMock.workSessionSyncedEvent.findUnique.mockResolvedValueOnce(null);
    prismaMock.workSession.findUnique.mockResolvedValueOnce({
      id: sessionId,
      status: 'RUNNING',
    });
    prismaMock.workSession.findFirst.mockResolvedValueOnce(null);

    await service.applyEvents(userId, [
      {
        eventId: 'e6',
        sessionId,
        type: SyncEventType.DISCARD,
        clientTimestamp: '2026-01-15T12:00:00.000Z',
      },
    ]);

    expect(prismaMock.workSession.update).toHaveBeenCalledWith({
      where: { id: sessionId },
      data: { status: 'DISCARDED' },
    });
  });

  it('clamps a future clientTimestamp to the server now on pause', async () => {
    const segmentStart = new Date('2026-01-15T11:00:00.000Z'); // 1h before now
    const futureTimestamp = '2026-01-15T13:00:00.000Z'; // 1h after now
    prismaMock.workSessionSyncedEvent.findUnique.mockResolvedValueOnce(null);
    prismaMock.workSession.findUnique.mockResolvedValueOnce({
      id: sessionId,
      status: 'RUNNING',
      startedAt: segmentStart,
      currentSegmentStartedAt: segmentStart,
      accumulatedSeconds: 0,
    });
    prismaMock.workSession.findFirst.mockResolvedValueOnce(null);

    await service.applyEvents(userId, [
      {
        eventId: 'e7',
        sessionId,
        type: SyncEventType.PAUSE,
        clientTimestamp: futureTimestamp,
      },
    ]);

    // Clamped to NOW (12:00), not the future 13:00 -> elapsed = 1h = 3600s
    expect(prismaMock.workSession.update).toHaveBeenCalledWith({
      where: { id: sessionId },
      data: {
        accumulatedSeconds: 3600,
        currentSegmentStartedAt: null,
        status: 'PAUSED',
      },
    });
  });

  it('rejects a start event with clientTimestamp more than 7 days in the past', async () => {
    const tooOld = new Date(
      NOW.getTime() - 8 * 24 * 60 * 60 * 1000,
    ).toISOString();
    prismaMock.workSessionSyncedEvent.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.applyEvents(userId, [
        {
          eventId: 'e8',
          sessionId,
          type: SyncEventType.START,
          clientTimestamp: tooOld,
        },
      ]),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.workSession.create).not.toHaveBeenCalled();
  });

  it('replaying an already-applied eventId is a no-op', async () => {
    // First application: goes through normally.
    prismaMock.workSessionSyncedEvent.findUnique.mockResolvedValueOnce(null);
    prismaMock.workSession.findUnique.mockResolvedValueOnce({
      id: sessionId,
      status: 'RUNNING',
    });
    prismaMock.workSession.findFirst.mockResolvedValueOnce(null);

    const event = {
      eventId: 'dup-1',
      sessionId,
      type: SyncEventType.DISCARD,
      clientTimestamp: '2026-01-15T12:00:00.000Z',
    };
    await service.applyEvents(userId, [event]);
    expect(prismaMock.workSession.update).toHaveBeenCalledTimes(1);

    // Second application of the SAME eventId: ledger already has it -> no-op.
    prismaMock.workSessionSyncedEvent.findUnique.mockResolvedValueOnce({
      eventId: 'dup-1',
    });
    prismaMock.workSession.findFirst.mockResolvedValueOnce(null);

    await service.applyEvents(userId, [event]);

    expect(prismaMock.workSession.update).toHaveBeenCalledTimes(1); // unchanged
    expect(prismaMock.workSessionSyncedEvent.create).toHaveBeenCalledTimes(1); // unchanged
  });

  it('rounds 67 minutes down to 1 hour (60min) on stop', async () => {
    const segmentStart = new Date('2026-01-15T10:53:00.000Z'); // 67 min before now
    prismaMock.workSessionSyncedEvent.findUnique.mockResolvedValueOnce(null);
    prismaMock.workSession.findUnique.mockResolvedValueOnce({
      id: sessionId,
      status: 'RUNNING',
      startedAt: segmentStart,
      currentSegmentStartedAt: segmentStart,
      accumulatedSeconds: 0,
    });
    prismaMock.workSession.findFirst.mockResolvedValueOnce(null);

    await service.applyEvents(userId, [
      {
        eventId: 'e9',
        sessionId,
        type: SyncEventType.STOP,
        clientTimestamp: NOW.toISOString(),
      },
    ]);

    expect(prismaMock.workSession.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ hours: 1 }) }),
    );
  });

  it('rounds 68 minutes up to 1.25 hours (75min) on stop', async () => {
    const segmentStart = new Date('2026-01-15T10:52:00.000Z'); // 68 min before now
    prismaMock.workSessionSyncedEvent.findUnique.mockResolvedValueOnce(null);
    prismaMock.workSession.findUnique.mockResolvedValueOnce({
      id: sessionId,
      status: 'RUNNING',
      startedAt: segmentStart,
      currentSegmentStartedAt: segmentStart,
      accumulatedSeconds: 0,
    });
    prismaMock.workSession.findFirst.mockResolvedValueOnce(null);

    await service.applyEvents(userId, [
      {
        eventId: 'e10',
        sessionId,
        type: SyncEventType.STOP,
        clientTimestamp: NOW.toISOString(),
      },
    ]);

    expect(prismaMock.workSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hours: 1.25 }),
      }),
    );
  });
});
