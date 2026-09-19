import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Notificação de vínculo + desvinculação/remoção (e2e) — MW-23', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const userIds: string[] = [];
  const companyIds: string[] = [];

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
    const token = jwtService.sign({ sub: user.id });
    return { user, token };
  }

  async function registerCompanyAdmin(company: string) {
    const email = `mw23-admin-${uuidv4()}@test.local`;
    const password = 'super-secret-1';
    const res = await request(app.getHttpServer())
      .post('/company-admin/auth/register')
      .send({ company, email, password })
      .expect(201);

    companyIds.push(res.body.admin.companyId);
    return {
      token: res.body.access_token as string,
      companyId: res.body.admin.companyId as string,
    };
  }

  it('vínculo automático (Convite Pendente honrado no signup) dispara email e InAppNotification pro Collaborator', async () => {
    const admin = await registerCompanyAdmin('Acme Notificação');
    const email = `mw23-signup-${uuidv4()}@test.local`;

    await request(app.getHttpServer())
      .post('/company-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email })
      .expect(201);

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, name: 'MW-23 Signup User', password: 'super-secret-1' })
      .expect(201);
    const userId = registerRes.body.user.id as string;
    userIds.push(userId);

    const collaborator = await prisma.collaborator.findFirst({
      where: { userId, companyId: admin.companyId },
    });
    expect(collaborator).not.toBeNull();

    const notification = await prisma.inAppNotification.findFirst({
      where: { userId, type: 'INFO' },
      orderBy: { createdAt: 'desc' },
    });
    expect(notification).not.toBeNull();
    expect(notification?.title).toContain('Acme Notificação');
    expect(notification?.message).toContain('Acme Notificação');
    expect((notification?.metadata as any)?.companyName).toBe(
      'Acme Notificação',
    );
  });

  it('vínculo idempotente (segundo login) não gera uma segunda notificação de vínculo', async () => {
    const admin = await registerCompanyAdmin('Acme Idempotente');
    const email = `mw23-idempotent-${uuidv4()}@test.local`;
    const password = 'super-secret-1';

    await request(app.getHttpServer())
      .post('/company-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email })
      .expect(201);

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, name: 'MW-23 Idempotent User', password })
      .expect(201);
    const userId = registerRes.body.user.id as string;
    userIds.push(userId);

    const countAfterSignup = await prisma.inAppNotification.count({
      where: { userId },
    });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const countAfterLogin = await prisma.inAppNotification.count({
      where: { userId },
    });

    expect(countAfterLogin).toBe(countAfterSignup);
  });

  it('Collaborator se desvincula: remove só o Collaborator, mantendo WorkHour/Project/Task/Invoice consultáveis, e notifica o próprio usuário', async () => {
    const { user, token } = await createUser('mw23-unlink');

    const createRes = await request(app.getHttpServer())
      .post('/companies')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'company-unlink@test.local', company: 'Company Unlink' })
      .expect(201);
    const companyId = createRes.body.id;
    companyIds.push(companyId);

    const project = await prisma.project.create({
      data: { name: 'Projeto MW-23', companyId: companyId, userId: user.id },
    });
    const task = await prisma.task.create({
      data: { title: 'Tarefa MW-23', companyId: companyId, userId: user.id },
    });
    const workHour = await prisma.workHour.create({
      data: {
        date: new Date(),
        hours: 2,
        userId: user.id,
        companyId: companyId,
        projectId: project.id,
        taskId: task.id,
      },
    });
    const invoice = await prisma.invoice.create({
      data: { companyId: companyId, amount: 100 },
    });

    await request(app.getHttpServer())
      .delete(`/companies/${companyId}/collaborator`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const collaborator = await prisma.collaborator.findUnique({
      where: { userId_companyId: { userId: user.id, companyId } },
    });
    expect(collaborator).toBeNull();

    // The Company record itself is untouched.
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    expect(company).not.toBeNull();

    // WorkHour/Project/Task/Invoice are untouched and still queryable.
    const workHoursRes = await request(app.getHttpServer())
      .get('/work-hours')
      .query({ companyId: companyId })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(workHoursRes.body.map((wh: { id: string }) => wh.id)).toContain(
      workHour.id,
    );

    const persistedProject = await prisma.project.findUnique({
      where: { id: project.id },
    });
    const persistedTask = await prisma.task.findUnique({
      where: { id: task.id },
    });
    const persistedInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
    });
    expect(persistedProject).not.toBeNull();
    expect(persistedTask).not.toBeNull();
    expect(persistedInvoice).not.toBeNull();

    // The Collaborator themself is notified of their own unlink.
    const unlinkNotification = await prisma.inAppNotification.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(unlinkNotification).not.toBeNull();
    expect((unlinkNotification?.metadata as any)?.unlinkedBy).toBe(
      'collaborator',
    );

    // Unlinking again (already gone) 404s.
    await request(app.getHttpServer())
      .delete(`/companies/${companyId}/collaborator`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('rejeita desvinculação sem autenticação', async () => {
    await request(app.getHttpServer())
      .delete(`/companies/${uuidv4()}/collaborator`)
      .expect(401);
  });

  it('Administrador lista Collaborators da própria Company e remove um deles, notificando-o', async () => {
    const admin = await registerCompanyAdmin('Acme Admin Remove');
    const { user } = await createUser('mw23-admin-remove');

    const collaborator = await prisma.collaborator.create({
      data: { userId: user.id, companyId: admin.companyId },
    });

    const listRes = await request(app.getHttpServer())
      .get('/company-admin/collaborators')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);
    expect(listRes.body.map((c: { id: string }) => c.id)).toContain(
      collaborator.id,
    );

    await request(app.getHttpServer())
      .delete(`/company-admin/collaborators/${collaborator.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    const removed = await prisma.collaborator.findUnique({
      where: { id: collaborator.id },
    });
    expect(removed).toBeNull();

    const notification = await prisma.inAppNotification.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(notification).not.toBeNull();
    expect((notification?.metadata as any)?.unlinkedBy).toBe('admin');
  });

  it('Administrador não consegue remover Collaborator de outra Company (404)', async () => {
    const adminA = await registerCompanyAdmin('Acme Dono');
    const adminB = await registerCompanyAdmin('Acme Intrusa');
    const { user } = await createUser('mw23-cross-company');

    const collaborator = await prisma.collaborator.create({
      data: { userId: user.id, companyId: adminA.companyId },
    });

    await request(app.getHttpServer())
      .delete(`/company-admin/collaborators/${collaborator.id}`)
      .set('Authorization', `Bearer ${adminB.token}`)
      .expect(404);

    const stillThere = await prisma.collaborator.findUnique({
      where: { id: collaborator.id },
    });
    expect(stillThere).not.toBeNull();
  });

  it('rejeita listagem/remoção de Collaborators sem autenticação de Administrador', async () => {
    await request(app.getHttpServer())
      .get('/company-admin/collaborators')
      .expect(401);

    await request(app.getHttpServer())
      .delete(`/company-admin/collaborators/${uuidv4()}`)
      .expect(401);
  });
});
