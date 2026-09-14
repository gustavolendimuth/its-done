import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { ActionTokenService } from './../src/work-sessions/services/action-token.service';

describe('WorkSessions confirm/stop via action token (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let actionTokenService: ActionTokenService;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);
    actionTokenService = moduleFixture.get(ActionTokenService);

    const user = await prisma.user.create({
      data: {
        email: `work-sessions-action-token-e2e-${uuidv4()}@test.local`,
        name: 'WorkSessions ActionToken E2E',
        password: 'not-used',
      },
    });
    userId = user.id;
  });

  afterEach(async () => {
    await prisma.workSession.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    await prisma.workSession.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  async function createRunningSession(promptNonce: string | null = null) {
    const sessionId = uuidv4();
    const startedAt = new Date(Date.now() - 65 * 60 * 1000); // 65 min ago
    await prisma.workSession.create({
      data: {
        id: sessionId,
        userId,
        status: 'RUNNING',
        startedAt,
        currentSegmentStartedAt: startedAt,
        accumulatedSeconds: 0,
        promptNonce,
      },
    });
    return sessionId;
  }

  it('confirm with a valid action token resets lastPromptAt without interrupting the session', async () => {
    const nonce = 'nonce-1';
    const sessionId = await createRunningSession(nonce);
    const token = actionTokenService.issue(sessionId, nonce);

    const res = await request(app.getHttpServer())
      .post(`/work-sessions/${sessionId}/confirm`)
      .query({ actionToken: token });

    expect(res.status).toBe(201);
    expect(res.body.session).toMatchObject({
      id: sessionId,
      status: 'RUNNING',
      lastPromptAt: null,
    });
  });

  it('stop with a valid action token freezes the session into STOPPING', async () => {
    const nonce = 'nonce-2';
    const sessionId = await createRunningSession(nonce);
    const token = actionTokenService.issue(sessionId, nonce);

    const res = await request(app.getHttpServer())
      .post(`/work-sessions/${sessionId}/stop`)
      .query({ actionToken: token });

    expect(res.status).toBe(201);
    expect(res.body.session).toMatchObject({
      id: sessionId,
      status: 'STOPPING',
    });
    expect(res.body.session.hours).toBeGreaterThan(0);
  });

  it('rejects an invalid action token with no side effect', async () => {
    const nonce = 'nonce-3';
    const sessionId = await createRunningSession(nonce);

    const res = await request(app.getHttpServer())
      .post(`/work-sessions/${sessionId}/stop`)
      .query({ actionToken: 'not-a-real-token' });

    expect(res.status).toBe(401);

    const session = await prisma.workSession.findUnique({
      where: { id: sessionId },
    });
    expect(session.status).toBe('RUNNING'); // unchanged
  });

  it('reusing the same valid token for confirm a second time (double "Sim, continuar") is a no-op, no visible error', async () => {
    const nonce = 'nonce-4b';
    const sessionId = await createRunningSession(nonce);
    const token = actionTokenService.issue(sessionId, nonce);

    const first = await request(app.getHttpServer())
      .post(`/work-sessions/${sessionId}/confirm`)
      .query({ actionToken: token });
    expect(first.status).toBe(201);
    expect(first.body.session).toMatchObject({
      id: sessionId,
      status: 'RUNNING',
      lastPromptAt: null,
    });

    const second = await request(app.getHttpServer())
      .post(`/work-sessions/${sessionId}/confirm`)
      .query({ actionToken: token });

    // Same edge case as the stop-double-click test below: the second
    // confirmation (e.g. a real double click, or clicking the notification
    // on two devices) must be a no-op with no visible error, per spec.md's
    // "trata a segunda confirmação como no-op, sem erro visível ao usuário".
    expect(second.status).toBe(201);
    expect(second.body.session).toMatchObject({
      id: sessionId,
      status: 'RUNNING',
      lastPromptAt: null,
    });
  });

  it('reusing the same valid token for stop a second time is a no-op (state already STOPPING)', async () => {
    const nonce = 'nonce-4';
    const sessionId = await createRunningSession(nonce);
    const token = actionTokenService.issue(sessionId, nonce);

    const first = await request(app.getHttpServer())
      .post(`/work-sessions/${sessionId}/stop`)
      .query({ actionToken: token });
    expect(first.status).toBe(201);
    const hoursAfterFirst = first.body.session.hours;

    const second = await request(app.getHttpServer())
      .post(`/work-sessions/${sessionId}/stop`)
      .query({ actionToken: token });

    expect(second.status).toBe(201); // no visible error, per spec's double-click edge case
    expect(second.body.session).toMatchObject({
      id: sessionId,
      status: 'STOPPING',
      hours: hoursAfterFirst, // unchanged: second stop is a no-op
    });
  });
});
