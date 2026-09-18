import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Desativação de Empresa (e2e) — MW-26', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const empresaIds: string[] = [];
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
    await prisma.dominioAutorizado.deleteMany({
      where: { empresaId: { in: empresaIds } },
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
    return user;
  }

  async function registerEmpresaAdmin(company: string) {
    const email = `mw26-admin-${uuidv4()}@test.local`;
    const password = 'super-secret-1';
    const res = await request(app.getHttpServer())
      .post('/empresa-admin/auth/register')
      .send({ company, email, password })
      .expect(201);

    empresaIds.push(res.body.admin.empresaId);
    return {
      token: res.body.access_token as string,
      empresaId: res.body.admin.empresaId as string,
      id: res.body.admin.id as string,
      email,
    };
  }

  // Mirrors empresa-admin-invite.e2e-spec.ts: creates a second EmpresaAdmin
  // for an already-activated Empresa directly via Prisma, then signs a JWT
  // for it — equivalent to what the Convite de Administrador flow produces,
  // without going through email delivery.
  async function createSecondAdmin(empresaId: string) {
    const admin = await prisma.empresaAdmin.create({
      data: {
        empresaId,
        email: `mw26-second-admin-${uuidv4()}@test.local`,
        password: await bcrypt.hash('super-secret-1', 10),
      },
    });

    const token = jwtService.sign({
      email: admin.email,
      sub: admin.id,
      actorType: 'EMPRESA_ADMIN',
      empresaId,
    });

    return { admin, token };
  }

  it('rejeita desativação sem autenticação', async () => {
    await request(app.getHttpServer())
      .post('/empresa-admin/auth/deactivate')
      .expect(401);
  });

  it('desativação revoga todos os EmpresaAdmin, ConvitePendente PENDING e DominioAutorizado PENDING/CONFIRMED da Empresa', async () => {
    const admin = await registerEmpresaAdmin('Acme Desativação');

    await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email: `mw26-invite-pending-${uuidv4()}@test.local` })
      .expect(201);

    // A Convite Pendente that already turned into a Colaborador (LINKED)
    // must stay untouched — deactivation only revokes still-PENDING ones.
    // Seeded directly via Prisma (not through the invite HTTP flow) so this
    // test only exercises MW-26's own logic, not MW-23's linking-on-invite
    // behaviour.
    const linkedInviteEmail = `mw26-linked-invite-${uuidv4()}@test.local`;
    const linkedInvite = await prisma.convitePendente.create({
      data: {
        empresaId: admin.empresaId,
        email: linkedInviteEmail,
        status: 'LINKED',
        linkedAt: new Date(),
        createdByEmpresaAdminId: admin.id,
      },
    });

    const domainRes = await request(app.getHttpServer())
      .post('/empresa-admin/domains')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ domain: `mw26-desativacao-${uuidv4().slice(0, 8)}.test` })
      .expect(201);
    const domainId = domainRes.body.id as string;

    await request(app.getHttpServer())
      .post('/empresa-admin/auth/deactivate')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(201);

    const remainingAdmins = await prisma.empresaAdmin.count({
      where: { empresaId: admin.empresaId },
    });
    expect(remainingAdmins).toBe(0);

    const pendingInvite = await prisma.convitePendente.findFirst({
      where: {
        empresaId: admin.empresaId,
        email: { not: linkedInviteEmail },
      },
    });
    expect(pendingInvite?.status).toBe('REVOKED');

    const stillLinkedInvite = await prisma.convitePendente.findUnique({
      where: { id: linkedInvite.id },
    });
    expect(stillLinkedInvite?.status).toBe('LINKED');

    const domain = await prisma.dominioAutorizado.findUnique({
      where: { id: domainId },
    });
    expect(domain?.status).toBe('REVOKED');
  });

  it('o token do Administrador que desativou deixa de autenticar em rotas protegidas', async () => {
    const admin = await registerEmpresaAdmin('Acme Token Morto');

    await request(app.getHttpServer())
      .post('/empresa-admin/auth/deactivate')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(201);

    await request(app.getHttpServer())
      .get('/empresa-admin/auth/profile')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(401);
  });

  it('vínculos Colaborador sobrevivem, WorkHour/Project/Task/Invoice permanecem intactos, e cada Colaborador vinculado é notificado (in-app)', async () => {
    const admin = await registerEmpresaAdmin('Acme Sobrevivência');
    const colaboradorUser = await createUser('mw26-colaborador');

    const colaborador = await prisma.colaborador.create({
      data: { userId: colaboradorUser.id, empresaId: admin.empresaId },
    });

    const project = await prisma.project.create({
      data: {
        name: 'Projeto MW-26',
        clientId: admin.empresaId,
        userId: colaboradorUser.id,
      },
    });
    const task = await prisma.task.create({
      data: {
        title: 'Tarefa MW-26',
        clientId: admin.empresaId,
        userId: colaboradorUser.id,
      },
    });
    const workHour = await prisma.workHour.create({
      data: {
        date: new Date(),
        hours: 3,
        userId: colaboradorUser.id,
        clientId: admin.empresaId,
        projectId: project.id,
        taskId: task.id,
      },
    });
    const invoice = await prisma.invoice.create({
      data: { clientId: admin.empresaId, amount: 150 },
    });

    await request(app.getHttpServer())
      .post('/empresa-admin/auth/deactivate')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(201);

    const stillColaborador = await prisma.colaborador.findUnique({
      where: { id: colaborador.id },
    });
    expect(stillColaborador).not.toBeNull();

    const empresa = await prisma.empresa.findUnique({
      where: { id: admin.empresaId },
    });
    expect(empresa).not.toBeNull();

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
      where: { userId: colaboradorUser.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(notification).not.toBeNull();
    expect(notification?.title).toContain('Acme Sobrevivência');
    expect((notification?.metadata as any)?.empresaName).toBe(
      'Acme Sobrevivência',
    );
  });

  it('reativação pelo fluxo normal de Ativação volta a funcionar depois da desativação', async () => {
    const admin = await registerEmpresaAdmin('Acme Reativação');

    await request(app.getHttpServer())
      .post('/empresa-admin/auth/deactivate')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/empresa-admin/auth/activate/${admin.empresaId}/request`)
      .send({ email: admin.email })
      .expect(201);

    const activationToken = jwtService.sign(
      {
        empresaId: admin.empresaId,
        email: admin.email,
        type: 'empresa-activation',
      },
      { expiresIn: '1h' },
    );

    const res = await request(app.getHttpServer())
      .post('/empresa-admin/auth/activate/confirm')
      .send({ token: activationToken, password: 'super-secret-2' })
      .expect(201);

    expect(res.body.access_token).toBeDefined();
    expect(res.body.admin.empresaId).toBe(admin.empresaId);

    const admins = await prisma.empresaAdmin.findMany({
      where: { empresaId: admin.empresaId },
    });
    expect(admins).toHaveLength(1);
  });

  it('um segundo Administrador da mesma Empresa também consegue desativar sozinho, sem aprovação cruzada', async () => {
    const admin = await registerEmpresaAdmin('Acme Dois Admins');
    const { token: secondToken } = await createSecondAdmin(admin.empresaId);

    const adminsBefore = await prisma.empresaAdmin.count({
      where: { empresaId: admin.empresaId },
    });
    expect(adminsBefore).toBe(2);

    await request(app.getHttpServer())
      .post('/empresa-admin/auth/deactivate')
      .set('Authorization', `Bearer ${secondToken}`)
      .expect(201);

    const adminsAfter = await prisma.empresaAdmin.count({
      where: { empresaId: admin.empresaId },
    });
    expect(adminsAfter).toBe(0);
  });
});
