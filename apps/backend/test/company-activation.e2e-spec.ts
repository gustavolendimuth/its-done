import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Company activation (e2e) — MW-19', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  const companyIdsToCleanup: string[] = [];

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
    await prisma.companyAdmin.deleteMany({
      where: { companyId: { in: companyIdsToCleanup } },
    });
    await prisma.company.deleteMany({
      where: { id: { in: companyIdsToCleanup } },
    });
    await app.close();
  });

  async function createCompany(overrides: Partial<{ email: string }> = {}) {
    const company = await prisma.company.create({
      data: {
        company: `Company E2E ${uuidv4()}`,
        email: overrides.email ?? `contato-${uuidv4()}@company-e2e.test`,
      },
    });
    companyIdsToCleanup.push(company.id);
    return company;
  }

  it('rejects a request whose email does not match the contact email and has no domain', async () => {
    const company = await createCompany();

    await request(app.getHttpServer())
      .post(`/company-admin/auth/activate/${company.id}/request`)
      .send({ email: `random-${uuidv4()}@nowhere.test` })
      .expect(400);
  });

  it('rejects activating with a public email provider domain', async () => {
    const company = await createCompany();

    await request(app.getHttpServer())
      .post(`/company-admin/auth/activate/${company.id}/request`)
      .send({ email: `someone-${uuidv4()}@gmail.com`, domain: 'gmail.com' })
      .expect(400);
  });

  it('rejects a domain request whose email does not belong to the declared domain', async () => {
    const company = await createCompany();

    await request(app.getHttpServer())
      .post(`/company-admin/auth/activate/${company.id}/request`)
      .send({
        email: `someone-${uuidv4()}@other-domain.test`,
        domain: 'declared-domain.test',
      })
      .expect(400);
  });

  it('accepts the request when the email matches the Company contact email, and confirming creates the first CompanyAdmin', async () => {
    const company = await createCompany();

    await request(app.getHttpServer())
      .post(`/company-admin/auth/activate/${company.id}/request`)
      .send({ email: company.email })
      .expect(201);

    const activationToken = jwtService.sign(
      {
        companyId: company.id,
        email: company.email,
        type: 'company-activation',
      },
      { expiresIn: '1h' },
    );

    const res = await request(app.getHttpServer())
      .post('/company-admin/auth/activate/confirm')
      .send({ token: activationToken, password: 'super-secret-1' })
      .expect(201);

    expect(res.body.access_token).toBeDefined();
    expect(res.body.admin.email).toBe(company.email);
    expect(res.body.admin.companyId).toBe(company.id);

    const admins = await prisma.companyAdmin.findMany({
      where: { companyId: company.id },
    });
    expect(admins).toHaveLength(1);
    expect(admins[0].invitedById).toBeNull();
  });

  it('accepts the request when a declared domain owns the email, without matching the Company contact email', async () => {
    const domain = `domain-${uuidv4().slice(0, 8)}.test`;
    const company = await createCompany({
      email: `contact@completely-different-domain.test`,
    });
    const loginEmail = `admin@${domain}`;

    await request(app.getHttpServer())
      .post(`/company-admin/auth/activate/${company.id}/request`)
      .send({ email: loginEmail, domain })
      .expect(201);

    const activationToken = jwtService.sign(
      { companyId: company.id, email: loginEmail, type: 'company-activation' },
      { expiresIn: '1h' },
    );

    const res = await request(app.getHttpServer())
      .post('/company-admin/auth/activate/confirm')
      .send({ token: activationToken, password: 'super-secret-1' })
      .expect(201);

    expect(res.body.admin.email).toBe(loginEmail);
  });

  it('rejects confirmation with a token of the wrong type', async () => {
    const company = await createCompany();

    const wrongTypeToken = jwtService.sign(
      { companyId: company.id, email: company.email, type: 'password-reset' },
      { expiresIn: '1h' },
    );

    await request(app.getHttpServer())
      .post('/company-admin/auth/activate/confirm')
      .send({ token: wrongTypeToken, password: 'super-secret-1' })
      .expect(400);
  });

  it('rejects activating an Company that already has a non-revoked CompanyAdmin', async () => {
    const company = await createCompany();

    await request(app.getHttpServer())
      .post(`/company-admin/auth/activate/${company.id}/request`)
      .send({ email: company.email })
      .expect(201);

    const firstToken = jwtService.sign(
      {
        companyId: company.id,
        email: company.email,
        type: 'company-activation',
      },
      { expiresIn: '1h' },
    );

    await request(app.getHttpServer())
      .post('/company-admin/auth/activate/confirm')
      .send({ token: firstToken, password: 'super-secret-1' })
      .expect(201);

    // Requesting activation again for the same (now activated) Company is rejected.
    await request(app.getHttpServer())
      .post(`/company-admin/auth/activate/${company.id}/request`)
      .send({ email: company.email })
      .expect(409);

    // Even a freshly minted valid-looking token cannot bypass the already-activated check.
    const secondToken = jwtService.sign(
      {
        companyId: company.id,
        email: `another-${uuidv4()}@${company.email.split('@')[1]}`,
        type: 'company-activation',
      },
      { expiresIn: '1h' },
    );
    await request(app.getHttpServer())
      .post('/company-admin/auth/activate/confirm')
      .send({ token: secondToken, password: 'super-secret-1' })
      .expect(409);
  });

  it('returns 404 for a non-existent Company', async () => {
    await request(app.getHttpServer())
      .post(`/company-admin/auth/activate/${uuidv4()}/request`)
      .send({ email: `x-${uuidv4()}@nowhere.test` })
      .expect(404);
  });
});
