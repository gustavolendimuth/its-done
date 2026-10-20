import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Desativação de Company (e2e) — MW-26', () => {
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
    await prisma.workHour.deleteMany({
      where: { companyId: { in: companyIds } },
    });
    await prisma.task.deleteMany({ where: { companyId: { in: companyIds } } });
    await prisma.project.deleteMany({
      where: { companyId: { in: companyIds } },
    });
    await prisma.invoice.deleteMany({
      where: { companyId: { in: companyIds } },
    });
    await prisma.inAppNotification.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.authorizedDomain.deleteMany({
      where: { companyId: { in: companyIds } },
    });
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

  async function createUser(prefix: string) {
    const email = `${prefix}-${uuidv4()}@test.local`;
    const user = await prisma.user.create({
      data: { email, name: `${prefix} User`, password: 'not-used' },
    });
    userIds.push(user.id);
    return user;
  }

  async function registerCompanyAdmin(company: string) {
    const email = `mw26-admin-${uuidv4()}@test.local`;
    const password = `pw-${uuidv4()}`;
    const res = await request(app.getHttpServer())
      .post('/company-admin/auth/register')
      .send({ company, email, password })
      .expect(201);

    companyIds.push(res.body.admin.companyId);
    return {
      token: res.body.access_token as string,
      companyId: res.body.admin.companyId as string,
      id: res.body.admin.id as string,
      email,
    };
  }

  // Mirrors company-admin-invite.e2e-spec.ts: creates a second CompanyAdmin
  // for an already-activated Company directly via Prisma, then signs a JWT
  // for it — equivalent to what the Convite de Administrador flow produces,
  // without going through email delivery.
  async function createSecondAdmin(companyId: string) {
    const admin = await prisma.companyAdmin.create({
      data: {
        companyId,
        email: `mw26-second-admin-${uuidv4()}@test.local`,
        password: await bcrypt.hash('super-secret-1', 10),
      },
    });

    const token = jwtService.sign({
      email: admin.email,
      sub: admin.id,
      actorType: 'COMPANY_ADMIN',
      companyId,
    });

    return { admin, token };
  }

  it('rejeita desativação sem autenticação', async () => {
    await request(app.getHttpServer())
      .post('/company-admin/auth/deactivate')
      .expect(401);
  });

  it('desativação revoga todos os CompanyAdmin, PendingInvite PENDING e AuthorizedDomain PENDING/CONFIRMED da Company', async () => {
    const admin = await registerCompanyAdmin('Acme Desativação');

    await request(app.getHttpServer())
      .post('/company-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email: `mw26-invite-pending-${uuidv4()}@test.local` })
      .expect(201);

    // A Convite Pendente that already turned into a Collaborator (LINKED)
    // must stay untouched — deactivation only revokes still-PENDING ones.
    // Seeded directly via Prisma (not through the invite HTTP flow) so this
    // test only exercises MW-26's own logic, not MW-23's linking-on-invite
    // behaviour.
    const linkedInviteEmail = `mw26-linked-invite-${uuidv4()}@test.local`;
    const linkedInvite = await prisma.pendingInvite.create({
      data: {
        companyId: admin.companyId,
        email: linkedInviteEmail,
        status: 'LINKED',
        linkedAt: new Date(),
        createdByCompanyAdminId: admin.id,
      },
    });

    const domainRes = await request(app.getHttpServer())
      .post('/company-admin/domains')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ domain: `mw26-desativacao-${uuidv4().slice(0, 8)}.test` })
      .expect(201);
    const domainId = domainRes.body.id as string;

    await request(app.getHttpServer())
      .post('/company-admin/auth/deactivate')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(201);

    const remainingAdmins = await prisma.companyAdmin.count({
      where: { companyId: admin.companyId },
    });
    expect(remainingAdmins).toBe(0);

    const pendingInvite = await prisma.pendingInvite.findFirst({
      where: {
        companyId: admin.companyId,
        email: { not: linkedInviteEmail },
      },
    });
    expect(pendingInvite?.status).toBe('REVOKED');

    const stillLinkedInvite = await prisma.pendingInvite.findUnique({
      where: { id: linkedInvite.id },
    });
    expect(stillLinkedInvite?.status).toBe('LINKED');

    const domain = await prisma.authorizedDomain.findUnique({
      where: { id: domainId },
    });
    expect(domain?.status).toBe('REVOKED');
  });

  it('o token do Administrador que desativou deixa de autenticar em rotas protegidas', async () => {
    const admin = await registerCompanyAdmin('Acme Token Morto');

    await request(app.getHttpServer())
      .post('/company-admin/auth/deactivate')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(201);

    await request(app.getHttpServer())
      .get('/company-admin/auth/profile')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(401);
  });

  it('vínculos Collaborator sobrevivem, WorkHour/Project/Task/Invoice permanecem intactos, e cada Collaborator vinculado é notificado (in-app)', async () => {
    const admin = await registerCompanyAdmin('Acme Sobrevivência');
    const collaboratorUser = await createUser('mw26-collaborator');

    const collaborator = await prisma.collaborator.create({
      data: { userId: collaboratorUser.id, companyId: admin.companyId },
    });

    const project = await prisma.project.create({
      data: {
        name: 'Projeto MW-26',
        companyId: admin.companyId,
        userId: collaboratorUser.id,
      },
    });
    const task = await prisma.task.create({
      data: {
        title: 'Tarefa MW-26',
        companyId: admin.companyId,
        userId: collaboratorUser.id,
      },
    });
    const workHour = await prisma.workHour.create({
      data: {
        date: new Date(),
        hours: 3,
        userId: collaboratorUser.id,
        companyId: admin.companyId,
        projectId: project.id,
        taskId: task.id,
      },
    });
    const invoice = await prisma.invoice.create({
      data: { companyId: admin.companyId, amount: 150 },
    });

    await request(app.getHttpServer())
      .post('/company-admin/auth/deactivate')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(201);

    const stillCollaborator = await prisma.collaborator.findUnique({
      where: { id: collaborator.id },
    });
    expect(stillCollaborator).not.toBeNull();

    const company = await prisma.company.findUnique({
      where: { id: admin.companyId },
    });
    expect(company).not.toBeNull();

    const persistedProject = await prisma.project.findUnique({
      where: { id: project.id },
    });
    const persistedTask = await prisma.task.findUnique({
      where: { id: task.id },
    });
    const persistedWorkHour = await prisma.workHour.findUnique({
      where: { id: workHour.id },
    });
    const persistedInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
    });
    expect(persistedProject).not.toBeNull();
    expect(persistedTask).not.toBeNull();
    expect(persistedWorkHour).not.toBeNull();
    expect(persistedInvoice).not.toBeNull();

    const notification = await prisma.inAppNotification.findFirst({
      where: { userId: collaboratorUser.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(notification).not.toBeNull();
    expect(notification?.title).toContain('Acme Sobrevivência');
    expect((notification?.metadata as any)?.companyName).toBe(
      'Acme Sobrevivência',
    );
  });

  it('reativação pelo fluxo normal de Ativação volta a funcionar depois da desativação', async () => {
    const admin = await registerCompanyAdmin('Acme Reativação');

    await request(app.getHttpServer())
      .post('/company-admin/auth/deactivate')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/company-admin/auth/activate/${admin.companyId}/request`)
      .send({ email: admin.email })
      .expect(201);

    const activationToken = jwtService.sign(
      {
        companyId: admin.companyId,
        email: admin.email,
        type: 'company-activation',
      },
      { expiresIn: '1h' },
    );

    const res = await request(app.getHttpServer())
      .post('/company-admin/auth/activate/confirm')
      .send({ token: activationToken, password: 'super-secret-2' })
      .expect(201);

    expect(res.body.access_token).toBeDefined();
    expect(res.body.admin.companyId).toBe(admin.companyId);

    const admins = await prisma.companyAdmin.findMany({
      where: { companyId: admin.companyId },
    });
    expect(admins).toHaveLength(1);
  });

  it('um segundo Administrador da mesma Company também consegue desativar sozinho, sem aprovação cruzada', async () => {
    const admin = await registerCompanyAdmin('Acme Dois Admins');
    const { token: secondToken } = await createSecondAdmin(admin.companyId);

    const adminsBefore = await prisma.companyAdmin.count({
      where: { companyId: admin.companyId },
    });
    expect(adminsBefore).toBe(2);

    await request(app.getHttpServer())
      .post('/company-admin/auth/deactivate')
      .set('Authorization', `Bearer ${secondToken}`)
      .expect(201);

    const adminsAfter = await prisma.companyAdmin.count({
      where: { companyId: admin.companyId },
    });
    expect(adminsAfter).toBe(0);
  });
});
