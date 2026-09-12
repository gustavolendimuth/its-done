import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('WorkSessions sync (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let token: string;

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

    const user = await prisma.user.create({
      data: {
        email: `work-sessions-sync-e2e-${uuidv4()}@test.local`,
        name: 'WorkSessions Sync E2E',
        password: 'not-used',
      },
    });
    userId = user.id;

    const jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    });
    token = jwtService.sign({ sub: userId });
  });

  afterEach(async () => {
    await prisma.workSessionSyncedEvent.deleteMany({});
    await prisma.workSession.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    await prisma.workSession.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  it('applies a start event and returns the authoritative RUNNING session', async () => {
    const sessionId = uuidv4();

    const res = await request(app.getHttpServer())
      .post('/work-sessions/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        events: [
          {
            eventId: uuidv4(),
            sessionId,
            type: 'start',
            clientTimestamp: new Date().toISOString(),
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.session).toMatchObject({
      id: sessionId,
      userId,
      status: 'RUNNING',
    });
  });

  it('applies a start then a stop, returning STOPPING with computed hours', async () => {
    const sessionId = uuidv4();
    const startedAt = new Date(Date.now() - 30 * 60 * 1000); // 30 min ago

    await request(app.getHttpServer())
      .post('/work-sessions/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        events: [
          {
            eventId: uuidv4(),
            sessionId,
            type: 'start',
            clientTimestamp: startedAt.toISOString(),
          },
        ],
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/work-sessions/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        events: [
          {
            eventId: uuidv4(),
            sessionId,
            type: 'stop',
            clientTimestamp: new Date().toISOString(),
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.session).toMatchObject({
      id: sessionId,
      status: 'STOPPING',
      hours: 0.5,
    });
  });

  it('surfaces a discarded session in the response when a conflicting earlier session wins', async () => {
    const laterSessionId = uuidv4();
    const earlierSessionId = uuidv4();
    const laterStartedAt = new Date(Date.now() - 5 * 60 * 1000); // 5 min ago
    const earlierStartedAt = new Date(Date.now() - 15 * 60 * 1000); // 15 min ago (earlier)

    await request(app.getHttpServer())
      .post('/work-sessions/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        events: [
          {
            eventId: uuidv4(),
            sessionId: laterSessionId,
            type: 'start',
            clientTimestamp: laterStartedAt.toISOString(),
          },
        ],
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/work-sessions/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        events: [
          {
            eventId: uuidv4(),
            sessionId: earlierSessionId,
            type: 'start',
            clientTimestamp: earlierStartedAt.toISOString(),
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.discarded).toMatchObject({ sessionId: laterSessionId });
    expect(res.body.session).toMatchObject({
      id: earlierSessionId,
      status: 'RUNNING',
    });
  });

  it('applies a discard event, marking the session DISCARDED and creating no WorkHour (WKT-06 AC5)', async () => {
    const sessionId = uuidv4();

    await request(app.getHttpServer())
      .post('/work-sessions/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        events: [
          {
            eventId: uuidv4(),
            sessionId,
            type: 'start',
            clientTimestamp: new Date().toISOString(),
          },
        ],
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/work-sessions/sync')
      .set('Authorization', `Bearer ${token}`)
      .send({
        events: [
          {
            eventId: uuidv4(),
            sessionId,
            type: 'discard',
            clientTimestamp: new Date().toISOString(),
          },
        ],
      });

    expect(res.status).toBe(201);

    const session = await prisma.workSession.findUnique({
      where: { id: sessionId },
    });
    expect(session.status).toBe('DISCARDED');

    const workHours = await prisma.workHour.findMany({ where: { userId } });
    expect(workHours).toHaveLength(0);
  });

  it('a concurrent start race only leaves one active session persisted', async () => {
    const sessionA = uuidv4();
    const sessionB = uuidv4();
    const now = new Date().toISOString();

    await Promise.all([
      request(app.getHttpServer())
        .post('/work-sessions/sync')
        .set('Authorization', `Bearer ${token}`)
        .send({
          events: [
            {
              eventId: uuidv4(),
              sessionId: sessionA,
              type: 'start',
              clientTimestamp: now,
            },
          ],
        }),
      request(app.getHttpServer())
        .post('/work-sessions/sync')
        .set('Authorization', `Bearer ${token}`)
        .send({
          events: [
            {
              eventId: uuidv4(),
              sessionId: sessionB,
              type: 'start',
              clientTimestamp: now,
            },
          ],
        }),
    ]);

    const activeSessions = await prisma.workSession.findMany({
      where: {
        userId,
        status: { in: ['RUNNING', 'PAUSED', 'STOPPING'] },
      },
    });

    expect(activeSessions.length).toBe(1);
  });

  it('rejects an unauthenticated sync request with 401', async () => {
    await request(app.getHttpServer())
      .post('/work-sessions/sync')
      .send({ events: [] })
      .expect(401);
  });
});
