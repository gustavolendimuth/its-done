import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('GET /work-sessions/active (e2e)', () => {
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
        email: `work-sessions-active-e2e-${uuidv4()}@test.local`,
        name: 'WorkSessions Active E2E',
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
    await prisma.workSession.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    await prisma.workSession.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  it('returns null when the user has no active session', async () => {
    const res = await request(app.getHttpServer())
      .get('/work-sessions/active')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.session).toBeNull();
  });

  it('returns the active session when one exists', async () => {
    const sessionId = uuidv4();
    const startedAt = new Date();
    await prisma.workSession.create({
      data: {
        id: sessionId,
        userId,
        status: 'RUNNING',
        startedAt,
        currentSegmentStartedAt: startedAt,
        accumulatedSeconds: 0,
      },
    });

    const res = await request(app.getHttpServer())
      .get('/work-sessions/active')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.session).toMatchObject({
      id: sessionId,
      userId,
      status: 'RUNNING',
    });
  });
});
