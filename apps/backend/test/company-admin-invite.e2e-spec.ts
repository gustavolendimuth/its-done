import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Company admin invite (e2e) — MW-20', () => {
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

  async function createActivatedCompany() {
    const company = await prisma.company.create({
      data: {
        company: `Company Invite E2E ${uuidv4()}`,
        email: `contato-${uuidv4()}@company-invite-e2e.test`,
      },
    });
    companyIdsToCleanup.push(company.id);

    const password = `pw-${uuidv4()}`;
    const admin = await prisma.companyAdmin.create({
      data: {
        companyId: company.id,
        email: `admin-${uuidv4()}@company-invite-e2e.test`,
        password: await bcrypt.hash(password, 10),
      },
    });

    const token = jwtService.sign({
      email: admin.email,
      sub: admin.id,
      actorType: 'COMPANY_ADMIN',
      companyId: company.id,
    });

    return { company, admin, token, password };
  }

  it('rejects inviting without authentication', async () => {
    await request(app.getHttpServer())
      .post('/company-admin/auth/invite')
      .send({ email: `invitee-${uuidv4()}@anywhere.test` })
      .expect(401);
  });

  it('an authenticated Administrador can invite an email from any domain, and confirming creates a new CompanyAdmin linked to the same Company, crediting who invited', async () => {
    const { company, admin, token, password } = await createActivatedCompany();
    const inviteeEmail = `invitee-${uuidv4()}@totally-external-domain.test`;

    await request(app.getHttpServer())
      .post('/company-admin/auth/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: inviteeEmail })
      .expect(201);

    const inviteToken = jwtService.sign(
      {
        companyId: company.id,
        email: inviteeEmail,
        invitedById: admin.id,
        type: 'company-admin-invite',
      },
      { expiresIn: '1h' },
    );

    const res = await request(app.getHttpServer())
      .post('/company-admin/auth/invite/confirm')
      .send({ token: inviteToken, password: 'brand-new-password-1' })
      .expect(201);

    expect(res.body.admin.email).toBe(inviteeEmail);
    expect(res.body.admin.companyId).toBe(company.id);

    const created = await prisma.companyAdmin.findUnique({
      where: { email: inviteeEmail },
    });
    expect(created?.invitedById).toBe(admin.id);
    expect(created?.companyId).toBe(company.id);

    // Both Administradores can now log in independently.
    await request(app.getHttpServer())
      .post('/company-admin/auth/login')
      .send({ email: admin.email, password })
      .expect(201);

    await request(app.getHttpServer())
      .post('/company-admin/auth/login')
      .send({ email: inviteeEmail, password: 'brand-new-password-1' })
      .expect(201);
  });

  it('rejects confirming an invite for an email that already has an CompanyAdmin', async () => {
    const { company, admin, token } = await createActivatedCompany();

    await request(app.getHttpServer())
      .post('/company-admin/auth/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: admin.email })
      .expect(409);

    const inviteToken = jwtService.sign(
      {
        companyId: company.id,
        email: admin.email,
        invitedById: admin.id,
        type: 'company-admin-invite',
      },
      { expiresIn: '1h' },
    );

    await request(app.getHttpServer())
      .post('/company-admin/auth/invite/confirm')
      .send({ token: inviteToken, password: 'whatever-password-1' })
      .expect(409);
  });

  it('rejects confirming with a token of the wrong type', async () => {
    const { company, admin } = await createActivatedCompany();

    const wrongTypeToken = jwtService.sign(
      {
        companyId: company.id,
        email: `wrongtype-${uuidv4()}@anywhere.test`,
        invitedById: admin.id,
        type: 'company-activation',
      },
      { expiresIn: '1h' },
    );

    await request(app.getHttpServer())
      .post('/company-admin/auth/invite/confirm')
      .send({ token: wrongTypeToken, password: 'whatever-password-1' })
      .expect(400);
  });
});
