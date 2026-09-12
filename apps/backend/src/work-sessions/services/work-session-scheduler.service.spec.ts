import { WorkSessionSchedulerService } from './work-session-scheduler.service';
import { ActionTokenService } from './action-token.service';
import { SyncEventType } from '../dto/sync-event.dto';

const prismaMock = {
  workSession: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
} as any;

const pushServiceMock = {
  sendToUser: jest.fn(),
} as any;

const actionTokenServiceMock = {
  issue: jest.fn().mockReturnValue('signed-action-token'),
} as any;

const workSessionsServiceMock = {
  applyEvents: jest.fn(),
} as any;

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'session-1',
    userId: 'user-1',
    status: 'RUNNING',
    startedAt: new Date('2026-01-01T00:00:00.000Z'),
    currentSegmentStartedAt: new Date('2026-01-01T00:00:00.000Z'),
    accumulatedSeconds: 0,
    lastPromptAt: null,
    lastConfirmedAt: null,
    promptNonce: null,
    ...overrides,
  };
}

describe('WorkSessionSchedulerService', () => {
  let service: WorkSessionSchedulerService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    service = new WorkSessionSchedulerService(
      prismaMock,
      workSessionsServiceMock,
      pushServiceMock,
      actionTokenServiceMock as ActionTokenService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sends exactly one push and sets lastPromptAt for a session past the 60min window with no recent prompt', async () => {
    const now = new Date('2026-01-01T01:00:01.000Z'); // 60min + 1s after startedAt
    jest.setSystemTime(now);
    const session = makeSession();
    prismaMock.workSession.findMany.mockResolvedValue([session]);

    await service.tick();

    expect(pushServiceMock.sendToUser).toHaveBeenCalledTimes(1);
    // Full payload match (not objectContaining): WKT-04 AC2 requires BOTH
    // actions ("Sim, continuar" / "Não, encerrar") on every prompt, so the
    // whole actions array — not just the sessionId — is what proves it.
    expect(pushServiceMock.sendToUser).toHaveBeenCalledWith('user-1', {
      title: 'Ainda está trabalhando?',
      body: 'Confirme se deseja continuar a sessão de trabalho.',
      data: { sessionId: 'session-1', actionToken: 'signed-action-token' },
      actions: [
        { action: 'confirm', title: 'Sim, continuar' },
        { action: 'stop', title: 'Não, encerrar' },
      ],
    });
    expect(prismaMock.workSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'session-1' },
        data: expect.objectContaining({ lastPromptAt: now }),
      }),
    );
  });

  it('does not send a duplicate push before the next cycle for an already-prompted session', async () => {
    const now = new Date('2026-01-01T01:05:00.000Z');
    jest.setSystemTime(now);
    const session = makeSession({
      lastPromptAt: new Date('2026-01-01T01:00:01.000Z'), // prompted 5min ago
    });
    prismaMock.workSession.findMany.mockResolvedValue([session]);

    await service.tick();

    expect(pushServiceMock.sendToUser).not.toHaveBeenCalled();
  });

  it('transitions a session past the 15min grace window to PAUSED with correctly frozen time via applyEvents', async () => {
    const now = new Date('2026-01-01T01:15:01.000Z');
    jest.setSystemTime(now);
    const session = makeSession({
      lastPromptAt: new Date('2026-01-01T01:00:00.000Z'), // 15min + 1s ago
    });
    prismaMock.workSession.findMany.mockResolvedValue([session]);

    await service.tick();

    expect(workSessionsServiceMock.applyEvents).toHaveBeenCalledTimes(1);
    const [userId, events] = workSessionsServiceMock.applyEvents.mock.calls[0];
    expect(userId).toBe('user-1');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      sessionId: 'session-1',
      type: SyncEventType.PAUSE,
      clientTimestamp: now.toISOString(),
    });
  });

  it('does nothing for a session not yet due (less than 60min since start)', async () => {
    const now = new Date('2026-01-01T00:30:00.000Z'); // only 30min elapsed
    jest.setSystemTime(now);
    const session = makeSession();
    prismaMock.workSession.findMany.mockResolvedValue([session]);

    await service.tick();

    expect(pushServiceMock.sendToUser).not.toHaveBeenCalled();
    expect(workSessionsServiceMock.applyEvents).not.toHaveBeenCalled();
  });

  it('never considers an already-PAUSED session (excluded from the RUNNING query)', async () => {
    const now = new Date('2026-01-01T02:00:00.000Z');
    jest.setSystemTime(now);
    // The scheduler queries only RUNNING sessions, so a PAUSED one never
    // reaches tick()'s in-memory logic in the first place.
    prismaMock.workSession.findMany.mockResolvedValue([]);

    await service.tick();

    expect(prismaMock.workSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'RUNNING' }),
      }),
    );
    expect(pushServiceMock.sendToUser).not.toHaveBeenCalled();
    expect(workSessionsServiceMock.applyEvents).not.toHaveBeenCalled();
  });
});
