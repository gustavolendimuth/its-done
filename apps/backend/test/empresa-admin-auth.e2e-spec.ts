import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('EmpresaAdmin auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  const email = `empresa-admin-e2e-${uuidv4()}@test.local`;
  const password = 'super-secret-1';

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
    jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    });
  });

  afterAll(async () => {
    const admin = await prisma.empresaAdmin.findUnique({ where: { email } });
    if (admin) {
      await prisma.empresaAdmin.deleteMany({ where: { empresaId: admin.empresaId } });
      await prisma.empresa.delete({ where: { id: admin.empresaId } });
    }
    await app.close();
  });

  it('registers a new Empresa + first EmpresaAdmin together', async () => {
    const res = await request(app.getHttpServer())
      .post('/empresa-admin/auth/register')
      .send({ company: 'Acme Empresa', email, password })
      .expect(201);

    expect(res.body.access_token).toBeDefined();
    expect(res.body.admin.email).toBe(email);
    expect(res.body.admin.empresaId).toBeDefined();

    const empresa = await prisma.empresa.findUnique({
      where: { id: res.body.admin.empresaId },
    });
    expect(empresa?.company).toBe('Acme Empresa');
  });

  it('rejects duplicate registration for the same email', async () => {
    await request(app.getHttpServer())
      .post('/empresa-admin/auth/register')
      .send({ company: 'Other Co', email, password })
      .expect(409);
  });

  it('logs in with correct credentials and rejects wrong password', async () => {
    const ok = await request(app.getHttpServer())
      .post('/empresa-admin/auth/login')
      .send({ email, password })
      .expect(201);
    expect(ok.body.access_token).toBeDefined();

    await request(app.getHttpServer())
      .post('/empresa-admin/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);
  });

  it('accepts its own token on the profile route and rejects a User token', async () => {
    const login = await request(app.getHttpServer())
      .post('/empresa-admin/auth/login')
      .send({ email, password })
      .expect(201);

    await request(app.getHttpServer())
      .get('/empresa-admin/auth/profile')
      .set('Authorization', `Bearer ${login.body.access_token}`)
      .expect(200);

    // A plain User-shaped JWT (no actorType/empresaId claim) must be rejected
    const userLikeToken = jwtService.sign({ email, sub: uuidv4() });
    await request(app.getHttpServer())
      .get('/empresa-admin/auth/profile')
      .set('Authorization', `Bearer ${userLikeToken}`)
      .expect(401);
  });

  it('a User JWT is rejected on Empresa routes and an EmpresaAdmin JWT is rejected on User routes', async () => {
    const user = await prisma.user.create({
      data: {
        email: `empresa-admin-e2e-crosscheck-${uuidv4()}@test.local`,
        name: 'Cross Check',
        password: 'not-used',
      },
    });
    const userToken = jwtService.sign({ email: user.email, sub: user.id });

    await request(app.getHttpServer())
      .get('/empresa-admin/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(401);

    const adminLogin = await request(app.getHttpServer())
      .post('/empresa-admin/auth/login')
      .send({ email, password })
      .expect(201);

    // The existing User JwtStrategy throws NotFoundException (404) for a
    // sub with no matching User row — a pre-existing behavior, not changed
    // here. Either way, access is denied: req.user is never populated.
    await request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${adminLogin.body.access_token}`)
      .expect(404);

    await prisma.user.delete({ where: { id: user.id } });
  });

  it('forgot-password + reset-password changes the EmpresaAdmin password', async () => {
    await request(app.getHttpServer())
      .post('/empresa-admin/auth/forgot-password')
      .send({ email })
      .expect(201);

    const admin = await prisma.empresaAdmin.findUnique({ where: { email } });
    const resetToken = jwtService.sign(
      {
        email,
        sub: admin!.id,
        actorType: 'EMPRESA_ADMIN',
        type: 'password-reset',
      },
      { expiresIn: '1h' },
    );

    await request(app.getHttpServer())
      .post('/empresa-admin/auth/reset-password')
      .send({ token: resetToken, newPassword: 'brand-new-password-1' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/empresa-admin/auth/login')
      .send({ email, password: 'brand-new-password-1' })
      .expect(201);
  });
});
