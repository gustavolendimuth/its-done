import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('POST /push/subscriptions (e2e)', () => {
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
        email: `push-subscriptions-e2e-${uuidv4()}@test.local`,
        name: 'Push Subscriptions E2E',
        password: 'not-used',
      },
    });
    userId = user.id;

    const jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    });
    token = jwtService.sign({ sub: userId });
  });

  afterAll(async () => {
    await prisma.pushSubscription.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  it('creates a new subscription for the logged-in user', async () => {
    const endpoint = `https://push.example.com/${uuidv4()}`;

    const res = await request(app.getHttpServer())
      .post('/push/subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send({ endpoint, p256dh: 'p256dh-value', auth: 'auth-value' });

    expect(res.status).toBe(201);

    const stored = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });
    expect(stored).toMatchObject({
      userId,
      endpoint,
      p256dh: 'p256dh-value',
      auth: 'auth-value',
    });
  });

  it('updates the existing subscription when the same endpoint is resent', async () => {
    const endpoint = `https://push.example.com/${uuidv4()}`;

    await request(app.getHttpServer())
      .post('/push/subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send({ endpoint, p256dh: 'old-p256dh', auth: 'old-auth' });

    const res = await request(app.getHttpServer())
      .post('/push/subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send({ endpoint, p256dh: 'new-p256dh', auth: 'new-auth' });

    expect(res.status).toBe(201);

    const matching = await prisma.pushSubscription.findMany({
      where: { endpoint },
    });
    expect(matching).toHaveLength(1);
    expect(matching[0]).toMatchObject({
      p256dh: 'new-p256dh',
      auth: 'new-auth',
    });
  });
});
