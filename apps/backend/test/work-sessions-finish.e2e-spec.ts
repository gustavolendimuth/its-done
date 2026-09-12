import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('POST /work-sessions/:id/finish (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userId: string;
  let token: string;
  let clientId: string;
  let otherClientId: string;
  let projectId: string;

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
        email: `work-sessions-finish-e2e-${uuidv4()}@test.local`,
        name: 'WorkSessions Finish E2E',
        password: 'not-used',
      },
    });
    userId = user.id;

    const jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    });
    token = jwtService.sign({ sub: userId });

    const client = await prisma.client.create({
      data: {
        email: 'finish-e2e-client@test.local',
        company: 'Finish E2E Co',
        userId,
      },
    });
    clientId = client.id;

    const otherClient = await prisma.client.create({
      data: {
        email: 'finish-e2e-other-client@test.local',
        company: 'Finish E2E Other Co',
        userId,
      },
    });
    otherClientId = otherClient.id;

    const project = await prisma.project.create({
      data: {
        name: 'Finish E2E Project',
        clientId,
        userId,
        hourlyRate: 100,
      },
    });
    projectId = project.id;
  });

  afterEach(async () => {
    await prisma.workHour.deleteMany({ where: { userId } });
    await prisma.workSession.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    await prisma.workHour.deleteMany({ where: { userId } });
    await prisma.workSession.deleteMany({ where: { userId } });
    await prisma.project.deleteMany({ where: { userId } });
    await prisma.client.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  async function createStoppingSession() {
    const sessionId = uuidv4();
    await prisma.workSession.create({
      data: {
        id: sessionId,
        userId,
        status: 'STOPPING',
        startedAt: new Date(Date.now() - 60 * 60 * 1000),
        currentSegmentStartedAt: null,
        accumulatedSeconds: 3600,
        hours: 1,
      },
    });
    return sessionId;
  }

  it('creates a WorkHour with the right fields and marks the session ENDED', async () => {
    const sessionId = await createStoppingSession();

    const res = await request(app.getHttpServer())
      .post(`/work-sessions/${sessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .send({ clientId, projectId, description: 'Finished via timer' });

    expect(res.status).toBe(201);
    expect(res.body.workHour).toMatchObject({
      clientId,
      projectId,
      description: 'Finished via timer',
      hours: 1,
    });

    const session = await prisma.workSession.findUnique({
      where: { id: sessionId },
    });
    expect(session.status).toBe('ENDED');
  });

  it('rejects the request when clientId and description are missing', async () => {
    const sessionId = await createStoppingSession();

    const res = await request(app.getHttpServer())
      .post(`/work-sessions/${sessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('rejects when projectId does not belong to the selected clientId', async () => {
    const sessionId = await createStoppingSession();

    const res = await request(app.getHttpServer())
      .post(`/work-sessions/${sessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: otherClientId,
        projectId, // belongs to `clientId`, not `otherClientId`
        description: 'Mismatched project',
      });

    expect(res.status).toBe(400);
  });

  it('rejects finishing a session that is not in STOPPING state', async () => {
    const sessionId = uuidv4();
    await prisma.workSession.create({
      data: {
        id: sessionId,
        userId,
        status: 'RUNNING',
        startedAt: new Date(),
        currentSegmentStartedAt: new Date(),
        accumulatedSeconds: 0,
      },
    });

    const res = await request(app.getHttpServer())
      .post(`/work-sessions/${sessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)
      .send({ clientId, description: 'Should not finish' });

    expect(res.status).toBe(400);
  });
});
