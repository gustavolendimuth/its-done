import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { COMPANY_ADMIN_ACTOR_TYPE } from '../src/company-admin/company-admin-auth.service';

describe('Domínio Autorizado (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const companyIds: string[] = [];
  const userIds: string[] = [];

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
    await prisma.authorizedDomain.deleteMany({
      where: { companyId: { in: companyIds } },
    });
    await prisma.collaborator.deleteMany({
      where: { companyId: { in: companyIds } },
    });
    await prisma.companyAdmin.deleteMany({
      where: { companyId: { in: companyIds } },
    });
    await prisma.company.deleteMany({ where: { id: { in: companyIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  async function registerCompanyAdmin(company: string) {
    const email = `dominio-admin-${uuidv4()}@test.local`;
    const password = `pw-${uuidv4()}`;
    const res = await request(app.getHttpServer())
      .post('/company-admin/auth/register')
      .send({ company, email, password })
      .expect(201);

    companyIds.push(res.body.admin.companyId);
    return {
      token: res.body.access_token as string,
      companyId: res.body.admin.companyId as string,
      adminEmail: email,
    };
  }

  function signDomainConfirmationToken(domainId: string, companyId: string) {
    return jwtService.sign(
      {
        sub: domainId,
        companyId,
        actorType: COMPANY_ADMIN_ACTOR_TYPE,
        type: 'domain-confirmation',
      },
      { expiresIn: '1h' },
    );
  }

  it('registers a domain as PENDING', async () => {
    const admin = await registerCompanyAdmin('Acme Domain');

    const res = await request(app.getHttpServer())
      .post('/company-admin/domains')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ domain: `acme-${uuidv4()}.com` })
      .expect(201);

    expect(res.body.status).toBe('PENDING');
  });

  it.each([
    ['gmail.com', 'exact match'],
    ['GMAIL.COM', 'uppercase'],
    ['mail.gmail.com', 'subdomain'],
  ])('rejects a public provider domain (%s — %s)', async (domain) => {
    const admin = await registerCompanyAdmin('Acme Blocked');

    await request(app.getHttpServer())
      .post('/company-admin/domains')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ domain })
      .expect(400);
  });

  it('does not reject a domain that merely looks like a public provider', async () => {
    const admin = await registerCompanyAdmin('Acme Notgmail');

    await request(app.getHttpServer())
      .post('/company-admin/domains')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ domain: `notgmail-${uuidv4()}.com` })
      .expect(201);
  });

  it('rejects an unauthenticated request to create a domain', async () => {
    await request(app.getHttpServer())
      .post('/company-admin/domains')
      .send({ domain: 'acme.com' })
      .expect(401);
  });

  it('confirmation flow: request-confirmation keeps it PENDING, confirm with a valid token marks it CONFIRMED', async () => {
    const admin = await registerCompanyAdmin('Acme Confirm');
    const createRes = await request(app.getHttpServer())
      .post('/company-admin/domains')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ domain: `confirm-${uuidv4()}.com` })
      .expect(201);
    const domainId = createRes.body.id;

    await request(app.getHttpServer())
      .post(`/company-admin/domains/${domainId}/confirm`)
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(201);

    const stillPending = await prisma.authorizedDomain.findUnique({
      where: { id: domainId },
    });
    expect(stillPending?.status).toBe('PENDING');

    const token = signDomainConfirmationToken(domainId, admin.companyId);
    await request(app.getHttpServer())
      .post('/company-admin/domains/confirm')
      .send({ token })
      .expect(201);

    const confirmed = await prisma.authorizedDomain.findUnique({
      where: { id: domainId },
    });
    expect(confirmed?.status).toBe('CONFIRMED');
    expect(confirmed?.confirmedAt).not.toBeNull();
  });

  it('rejects confirming with a token for a different Company', async () => {
    const admin = await registerCompanyAdmin('Acme Confirm Owner');
    const otherAdmin = await registerCompanyAdmin('Acme Confirm Other');
    const createRes = await request(app.getHttpServer())
      .post('/company-admin/domains')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ domain: `cross-confirm-${uuidv4()}.com` })
      .expect(201);

    const token = signDomainConfirmationToken(
      createRes.body.id,
      otherAdmin.companyId,
    );
    await request(app.getHttpServer())
      .post('/company-admin/domains/confirm')
      .send({ token })
      .expect(404);
  });

  it('links automatically on signup when the email domain is CONFIRMED', async () => {
    const admin = await registerCompanyAdmin('Acme Auto Link');
    const domain = `autolink-${uuidv4()}.com`;
    const createRes = await request(app.getHttpServer())
      .post('/company-admin/domains')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ domain })
      .expect(201);

    const token = signDomainConfirmationToken(
      createRes.body.id,
      admin.companyId,
    );
    await request(app.getHttpServer())
      .post('/company-admin/domains/confirm')
      .send({ token })
      .expect(201);

    const email = `newhire@${domain}`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, name: 'Auto Linked User', password: 'super-secret-1' })
      .expect(201);
    userIds.push(registerRes.body.user.id);

    const collaborator = await prisma.collaborator.findFirst({
      where: { userId: registerRes.body.user.id, companyId: admin.companyId },
    });
    expect(collaborator).not.toBeNull();
  });

  it('does not link when the domain is still PENDING (not yet confirmed)', async () => {
    const admin = await registerCompanyAdmin('Acme Still Pending');
    const domain = `stillpending-${uuidv4()}.com`;
    await request(app.getHttpServer())
      .post('/company-admin/domains')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ domain })
      .expect(201);

    const email = `newhire@${domain}`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, name: 'Not Yet Linked User', password: 'super-secret-1' })
      .expect(201);
    userIds.push(registerRes.body.user.id);

    const collaborator = await prisma.collaborator.findFirst({
      where: { userId: registerRes.body.user.id, companyId: admin.companyId },
    });
    expect(collaborator).toBeNull();
  });

  it('revokes a domain, and a revoked domain no longer auto-links', async () => {
    const admin = await registerCompanyAdmin('Acme Revoke Domain');
    const domain = `revoke-${uuidv4()}.com`;
    const createRes = await request(app.getHttpServer())
      .post('/company-admin/domains')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ domain })
      .expect(201);

    const token = signDomainConfirmationToken(
      createRes.body.id,
      admin.companyId,
    );
    await request(app.getHttpServer())
      .post('/company-admin/domains/confirm')
      .send({ token })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/company-admin/domains/${createRes.body.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    const revoked = await prisma.authorizedDomain.findUnique({
      where: { id: createRes.body.id },
    });
    expect(revoked?.status).toBe('REVOKED');

    const email = `postrevoke@${domain}`;
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, name: 'Post Revoke User', password: 'super-secret-1' })
      .expect(201);
    userIds.push(registerRes.body.user.id);

    const collaborator = await prisma.collaborator.findFirst({
      where: { userId: registerRes.body.user.id, companyId: admin.companyId },
    });
    expect(collaborator).toBeNull();
  });

  it("an Administrador cannot revoke another Company's domain", async () => {
    const adminA = await registerCompanyAdmin('Acme Domain Owner');
    const adminB = await registerCompanyAdmin('Acme Domain Intruder');
    const createRes = await request(app.getHttpServer())
      .post('/company-admin/domains')
      .set('Authorization', `Bearer ${adminA.token}`)
      .send({ domain: `cross-revoke-${uuidv4()}.com` })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/company-admin/domains/${createRes.body.id}`)
      .set('Authorization', `Bearer ${adminB.token}`)
      .expect(404);
  });
});
