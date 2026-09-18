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
  const empresaIds: string[] = [];

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
      where: { clientId: { in: empresaIds } },
    });
    await prisma.task.deleteMany({ where: { clientId: { in: empresaIds } } });
    await prisma.project.deleteMany({
      where: { clientId: { in: empresaIds } },
    });
    await prisma.invoice.deleteMany({
      where: { clientId: { in: empresaIds } },
    });
    await prisma.inAppNotification.deleteMany({
      where: { userId: { in: userIds } },
    });
    await prisma.convitePendente.deleteMany({
      where: { empresaId: { in: empresaIds } },
    });
    await prisma.colaborador.deleteMany({
      where: { empresaId: { in: empresaIds } },
    });
    await prisma.empresaAdmin.deleteMany({
      where: { empresaId: { in: empresaIds } },
    });
    await prisma.empresa.deleteMany({ where: { id: { in: empresaIds } } });
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

  async function registerEmpresaAdmin(company: string) {
    const email = `mw23-admin-${uuidv4()}@test.local`;
    const password = 'super-secret-1';
    const res = await request(app.getHttpServer())
      .post('/empresa-admin/auth/register')
      .send({ company, email, password })
      .expect(201);

    empresaIds.push(res.body.admin.empresaId);
    return {
      token: res.body.access_token as string,
      empresaId: res.body.admin.empresaId as string,
    };
  }

  it('vínculo automático (Convite Pendente honrado no signup) dispara email e InAppNotification pro Colaborador', async () => {
    const admin = await registerEmpresaAdmin('Acme Notificação');
    const email = `mw23-signup-${uuidv4()}@test.local`;

    await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email })
      .expect(201);

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, name: 'MW-23 Signup User', password: 'super-secret-1' })
      .expect(201);
    const userId = registerRes.body.user.id as string;
    userIds.push(userId);

    const colaborador = await prisma.colaborador.findFirst({
      where: { userId, empresaId: admin.empresaId },
    });
    expect(colaborador).not.toBeNull();

    const notification = await prisma.inAppNotification.findFirst({
      where: { userId, type: 'INFO' },
      orderBy: { createdAt: 'desc' },
    });
    expect(notification).not.toBeNull();
    expect(notification?.title).toContain('Acme Notificação');
    expect(notification?.message).toContain('Acme Notificação');
    expect((notification?.metadata as any)?.empresaName).toBe(
      'Acme Notificação',
    );
  });

  it('vínculo idempotente (segundo login) não gera uma segunda notificação de vínculo', async () => {
    const admin = await registerEmpresaAdmin('Acme Idempotente');
    const email = `mw23-idempotent-${uuidv4()}@test.local`;
    const password = 'super-secret-1';

    await request(app.getHttpServer())
      .post('/empresa-admin/invites')
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

  it('Colaborador se desvincula: remove só o Colaborador, mantendo WorkHour/Project/Task/Invoice consultáveis, e notifica o próprio usuário', async () => {
    const { user, token } = await createUser('mw23-unlink');

    const createRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'empresa-unlink@test.local', company: 'Empresa Unlink' })
      .expect(201);
    const empresaId = createRes.body.id;
    empresaIds.push(empresaId);

    const project = await prisma.project.create({
      data: { name: 'Projeto MW-23', clientId: empresaId, userId: user.id },
    });
    const task = await prisma.task.create({
      data: { title: 'Tarefa MW-23', clientId: empresaId, userId: user.id },
    });
    const workHour = await prisma.workHour.create({
      data: {
        date: new Date(),
        hours: 2,
        userId: user.id,
        clientId: empresaId,
        projectId: project.id,
        taskId: task.id,
      },
    });
    const invoice = await prisma.invoice.create({
      data: { clientId: empresaId, amount: 100 },
    });

    await request(app.getHttpServer())
      .delete(`/clients/${empresaId}/colaborador`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const colaborador = await prisma.colaborador.findUnique({
      where: { userId_empresaId: { userId: user.id, empresaId } },
    });
    expect(colaborador).toBeNull();

    // The Empresa record itself is untouched.
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
    });
    expect(empresa).not.toBeNull();

    // WorkHour/Project/Task/Invoice are untouched and still queryable.
    const workHoursRes = await request(app.getHttpServer())
      .get('/work-hours')
      .query({ clientId: empresaId })
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

    // The Colaborador themself is notified of their own unlink.
    const unlinkNotification = await prisma.inAppNotification.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(unlinkNotification).not.toBeNull();
    expect((unlinkNotification?.metadata as any)?.unlinkedBy).toBe(
      'colaborador',
    );

    // Unlinking again (already gone) 404s.
    await request(app.getHttpServer())
      .delete(`/clients/${empresaId}/colaborador`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('rejeita desvinculação sem autenticação', async () => {
    await request(app.getHttpServer())
      .delete(`/clients/${uuidv4()}/colaborador`)
      .expect(401);
  });

  it('Administrador lista Colaboradores da própria Empresa e remove um deles, notificando-o', async () => {
    const admin = await registerEmpresaAdmin('Acme Admin Remove');
    const { user } = await createUser('mw23-admin-remove');

    const colaborador = await prisma.colaborador.create({
      data: { userId: user.id, empresaId: admin.empresaId },
    });

    const listRes = await request(app.getHttpServer())
      .get('/empresa-admin/colaboradores')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);
    expect(listRes.body.map((c: { id: string }) => c.id)).toContain(
      colaborador.id,
    );

    await request(app.getHttpServer())
      .delete(`/empresa-admin/colaboradores/${colaborador.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    const removed = await prisma.colaborador.findUnique({
      where: { id: colaborador.id },
    });
    expect(removed).toBeNull();

    const notification = await prisma.inAppNotification.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(notification).not.toBeNull();
    expect((notification?.metadata as any)?.unlinkedBy).toBe('admin');
  });

  it('Administrador não consegue remover Colaborador de outra Empresa (404)', async () => {
    const adminA = await registerEmpresaAdmin('Acme Dono');
    const adminB = await registerEmpresaAdmin('Acme Intrusa');
    const { user } = await createUser('mw23-cross-empresa');

    const colaborador = await prisma.colaborador.create({
      data: { userId: user.id, empresaId: adminA.empresaId },
    });

    await request(app.getHttpServer())
      .delete(`/empresa-admin/colaboradores/${colaborador.id}`)
      .set('Authorization', `Bearer ${adminB.token}`)
      .expect(404);

    const stillThere = await prisma.colaborador.findUnique({
      where: { id: colaborador.id },
    });
    expect(stillThere).not.toBeNull();
  });

  it('rejeita listagem/remoção de Colaboradores sem autenticação de Administrador', async () => {
    await request(app.getHttpServer())
      .get('/empresa-admin/colaboradores')
      .expect(401);

    await request(app.getHttpServer())
      .delete(`/empresa-admin/colaboradores/${uuidv4()}`)
      .expect(401);
  });
});
