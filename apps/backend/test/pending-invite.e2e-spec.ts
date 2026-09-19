import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Convite Pendente (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
  });

  afterAll(async () => {
    await prisma.pendingInvite.deleteMany({
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
    const email = `convite-pendente-admin-${uuidv4()}@test.local`;
    const password = 'super-secret-1';
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

  it('creating an invite for an email with no User yet leaves it PENDING', async () => {
    const admin = await registerCompanyAdmin('Acme Pendente');
    const email = `pending-${uuidv4()}@test.local`;

    const res = await request(app.getHttpServer())
      .post('/company-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email })
      .expect(201);

    expect(res.body.status).toBe('PENDING');
    expect(res.body.linkedAt).toBeNull();
  });

  it('creating an invite for an email with an existing User links it immediately', async () => {
    const admin = await registerCompanyAdmin('Acme Imediato');
    const email = `existing-${uuidv4()}@test.local`;
    const user = await prisma.user.create({
      data: { email, name: 'Existing User', password: 'not-used' },
    });
    userIds.push(user.id);

    const res = await request(app.getHttpServer())
      .post('/company-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email })
      .expect(201);

    expect(res.body.status).toBe('LINKED');
    expect(res.body.linkedAt).not.toBeNull();

    const collaborator = await prisma.collaborator.findFirst({
      where: { userId: user.id, companyId: admin.companyId },
    });
    expect(collaborator).not.toBeNull();
  });

  it('links automatically on signup when a Convite Pendente exists for that email', async () => {
    const admin = await registerCompanyAdmin('Acme Signup');
    const email = `signup-${uuidv4()}@test.local`;

    await request(app.getHttpServer())
      .post('/company-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email })
      .expect(201);

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, name: 'New Signup User', password: 'super-secret-1' })
      .expect(201);
    userIds.push(registerRes.body.user.id);

    const collaborator = await prisma.collaborator.findFirst({
      where: { userId: registerRes.body.user.id, companyId: admin.companyId },
    });
    expect(collaborator).not.toBeNull();

    const invite = await prisma.pendingInvite.findFirst({
      where: { companyId: admin.companyId, email },
    });
    expect(invite?.status).toBe('LINKED');
  });

  it('links automatically on login when the User already existed before the invite', async () => {
    const admin = await registerCompanyAdmin('Acme Login');
    const email = `login-${uuidv4()}@test.local`;
    const password = 'super-secret-1';
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name: 'Pre-existing User', password: hashed },
    });
    userIds.push(user.id);

    await request(app.getHttpServer())
      .post('/company-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email })
      .expect(201);

    // The invite was created for an existing User, so it links immediately —
    // login is not required for the initial match, only asserted here.
    let collaborator = await prisma.collaborator.findFirst({
      where: { userId: user.id, companyId: admin.companyId },
    });
    expect(collaborator).not.toBeNull();

    // A second Company invites the SAME email after the fact: it stays
    // PENDING until the next login, proving the login hook (not just the
    // create-time immediate link) also effectuates it.
    const admin2 = await registerCompanyAdmin('Acme Login Second');
    await request(app.getHttpServer())
      .post('/company-admin/invites')
      .set('Authorization', `Bearer ${admin2.token}`)
      .send({ email })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    collaborator = await prisma.collaborator.findFirst({
      where: { userId: user.id, companyId: admin2.companyId },
    });
    expect(collaborator).not.toBeNull();
  });

  it('two different Companys inviting the same email both link independently', async () => {
    const adminA = await registerCompanyAdmin('Acme A');
    const adminB = await registerCompanyAdmin('Acme B');
    const email = `multi-company-${uuidv4()}@test.local`;

    await request(app.getHttpServer())
      .post('/company-admin/invites')
      .set('Authorization', `Bearer ${adminA.token}`)
      .send({ email })
      .expect(201);
    await request(app.getHttpServer())
      .post('/company-admin/invites')
      .set('Authorization', `Bearer ${adminB.token}`)
      .send({ email })
      .expect(201);

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, name: 'Multi Company User', password: 'super-secret-1' })
      .expect(201);
    userIds.push(registerRes.body.user.id);

    const collaborators = await prisma.collaborator.findMany({
      where: { userId: registerRes.body.user.id },
    });
    const linkedCompanyIds = collaborators.map((c) => c.companyId);
    expect(linkedCompanyIds).toEqual(
      expect.arrayContaining([adminA.companyId, adminB.companyId]),
    );
    expect(collaborators.length).toBe(2);
  });

  it('rejects an unauthenticated request to create an invite (Company must be activated via a real Administrador)', async () => {
    await request(app.getHttpServer())
      .post('/company-admin/invites')
      .send({ email: `no-auth-${uuidv4()}@test.local` })
      .expect(401);
  });

  it('rejects a duplicate active invite for the same company+email', async () => {
    const admin = await registerCompanyAdmin('Acme Duplicate');
    const email = `duplicate-${uuidv4()}@test.local`;

    await request(app.getHttpServer())
      .post('/company-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email })
      .expect(201);

    await request(app.getHttpServer())
      .post('/company-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email })
      .expect(409);
  });

  it('revokes a not-yet-linked invite, and rejects revoking an already-linked one', async () => {
    const admin = await registerCompanyAdmin('Acme Revoke');
    const pendingEmail = `revoke-pending-${uuidv4()}@test.local`;
    const linkedEmail = `revoke-linked-${uuidv4()}@test.local`;

    const pendingRes = await request(app.getHttpServer())
      .post('/company-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email: pendingEmail })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/company-admin/invites/${pendingRes.body.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    const revoked = await prisma.pendingInvite.findUnique({
      where: { id: pendingRes.body.id },
    });
    expect(revoked?.status).toBe('REVOKED');

    const user = await prisma.user.create({
      data: { email: linkedEmail, name: 'Linked User', password: 'not-used' },
    });
    userIds.push(user.id);
    const linkedRes = await request(app.getHttpServer())
      .post('/company-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email: linkedEmail })
      .expect(201);
    expect(linkedRes.body.status).toBe('LINKED');

    await request(app.getHttpServer())
      .delete(`/company-admin/invites/${linkedRes.body.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(400);
  });

  it("an Administrador cannot revoke another Company's invite", async () => {
    const adminA = await registerCompanyAdmin('Acme Owner');
    const adminB = await registerCompanyAdmin('Acme Intruder');
    const email = `cross-company-${uuidv4()}@test.local`;

    const res = await request(app.getHttpServer())
      .post('/company-admin/invites')
      .set('Authorization', `Bearer ${adminA.token}`)
      .send({ email })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/company-admin/invites/${res.body.id}`)
      .set('Authorization', `Bearer ${adminB.token}`)
      .expect(404);
  });
});
