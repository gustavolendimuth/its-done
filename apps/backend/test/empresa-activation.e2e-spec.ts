import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Empresa activation (e2e) — MW-19', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  const empresaIdsToCleanup: string[] = [];

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
    await prisma.empresaAdmin.deleteMany({
      where: { empresaId: { in: empresaIdsToCleanup } },
    });
    await prisma.empresa.deleteMany({
      where: { id: { in: empresaIdsToCleanup } },
    });
    await app.close();
  });

  async function createEmpresa(overrides: Partial<{ email: string }> = {}) {
    const empresa = await prisma.empresa.create({
      data: {
        company: `Empresa E2E ${uuidv4()}`,
        email: overrides.email ?? `contato-${uuidv4()}@empresa-e2e.test`,
      },
    });
    empresaIdsToCleanup.push(empresa.id);
    return empresa;
  }

  it('rejects a request whose email does not match the contact email and has no domain', async () => {
    const empresa = await createEmpresa();

    await request(app.getHttpServer())
      .post(`/empresa-admin/auth/activate/${empresa.id}/request`)
      .send({ email: `random-${uuidv4()}@nowhere.test` })
      .expect(400);
  });

  it('rejects activating with a public email provider domain', async () => {
    const empresa = await createEmpresa();

    await request(app.getHttpServer())
      .post(`/empresa-admin/auth/activate/${empresa.id}/request`)
      .send({ email: `someone-${uuidv4()}@gmail.com`, domain: 'gmail.com' })
      .expect(400);
  });

  it('rejects a domain request whose email does not belong to the declared domain', async () => {
    const empresa = await createEmpresa();

    await request(app.getHttpServer())
      .post(`/empresa-admin/auth/activate/${empresa.id}/request`)
      .send({
        email: `someone-${uuidv4()}@other-domain.test`,
        domain: 'declared-domain.test',
      })
      .expect(400);
  });

  it('accepts the request when the email matches the Empresa contact email, and confirming creates the first EmpresaAdmin', async () => {
    const empresa = await createEmpresa();

    await request(app.getHttpServer())
      .post(`/empresa-admin/auth/activate/${empresa.id}/request`)
      .send({ email: empresa.email })
      .expect(201);

    const activationToken = jwtService.sign(
      { empresaId: empresa.id, email: empresa.email, type: 'empresa-activation' },
      { expiresIn: '1h' },
    );

    const res = await request(app.getHttpServer())
      .post('/empresa-admin/auth/activate/confirm')
      .send({ token: activationToken, password: 'super-secret-1' })
      .expect(201);

    expect(res.body.access_token).toBeDefined();
    expect(res.body.admin.email).toBe(empresa.email);
    expect(res.body.admin.empresaId).toBe(empresa.id);

    const admins = await prisma.empresaAdmin.findMany({
      where: { empresaId: empresa.id },
    });
    expect(admins).toHaveLength(1);
    expect(admins[0].invitedById).toBeNull();
  });

  it('accepts the request when a declared domain owns the email, without matching the Empresa contact email', async () => {
    const domain = `domain-${uuidv4().slice(0, 8)}.test`;
    const empresa = await createEmpresa({
      email: `contact@completely-different-domain.test`,
    });
    const loginEmail = `admin@${domain}`;

    await request(app.getHttpServer())
      .post(`/empresa-admin/auth/activate/${empresa.id}/request`)
      .send({ email: loginEmail, domain })
      .expect(201);

    const activationToken = jwtService.sign(
      { empresaId: empresa.id, email: loginEmail, type: 'empresa-activation' },
      { expiresIn: '1h' },
    );

    const res = await request(app.getHttpServer())
      .post('/empresa-admin/auth/activate/confirm')
      .send({ token: activationToken, password: 'super-secret-1' })
      .expect(201);

    expect(res.body.admin.email).toBe(loginEmail);
  });

  it('rejects confirmation with a token of the wrong type', async () => {
    const empresa = await createEmpresa();

    const wrongTypeToken = jwtService.sign(
      { empresaId: empresa.id, email: empresa.email, type: 'password-reset' },
      { expiresIn: '1h' },
    );

    await request(app.getHttpServer())
      .post('/empresa-admin/auth/activate/confirm')
      .send({ token: wrongTypeToken, password: 'super-secret-1' })
      .expect(400);
  });

  it('rejects activating an Empresa that already has a non-revoked EmpresaAdmin', async () => {
    const empresa = await createEmpresa();

    await request(app.getHttpServer())
      .post(`/empresa-admin/auth/activate/${empresa.id}/request`)
      .send({ email: empresa.email })
      .expect(201);

    const firstToken = jwtService.sign(
      { empresaId: empresa.id, email: empresa.email, type: 'empresa-activation' },
      { expiresIn: '1h' },
    );

    await request(app.getHttpServer())
      .post('/empresa-admin/auth/activate/confirm')
      .send({ token: firstToken, password: 'super-secret-1' })
      .expect(201);

    // Requesting activation again for the same (now activated) Empresa is rejected.
    await request(app.getHttpServer())
      .post(`/empresa-admin/auth/activate/${empresa.id}/request`)
      .send({ email: empresa.email })
      .expect(409);

    // Even a freshly minted valid-looking token cannot bypass the already-activated check.
    const secondToken = jwtService.sign(
      {
        empresaId: empresa.id,
        email: `another-${uuidv4()}@${empresa.email.split('@')[1]}`,
        type: 'empresa-activation',
      },
      { expiresIn: '1h' },
    );
    await request(app.getHttpServer())
      .post('/empresa-admin/auth/activate/confirm')
      .send({ token: secondToken, password: 'super-secret-1' })
      .expect(409);
  });

  it('returns 404 for a non-existent Empresa', async () => {
    await request(app.getHttpServer())
      .post(`/empresa-admin/auth/activate/${uuidv4()}/request`)
      .send({ email: `x-${uuidv4()}@nowhere.test` })
      .expect(404);
  });
});
