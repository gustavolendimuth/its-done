import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';

// MW-27 — prova que o rate limiting configurado em app.module.ts /
// auth.controller.ts de fato bloqueia com 429 depois do limite da rota.
describe('Rate limiting (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks POST /auth/login with 429 after the 10 req/min limit is exceeded', async () => {
    const email = `rate-limit-login-${uuidv4()}@test.local`;
    const body = { email, password: 'wrong-password' };

    // First 10 requests hit the route's own logic (invalid credentials -> 401).
    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(body)
        .expect(401);
    }

    // 11th request in the same window is throttled, not processed.
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(body)
      .expect(429);
  });
});
