import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Dashboard da Empresa (e2e) — MW-24', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
  });

  afterAll(async () => {
    await prisma.invoice.deleteMany({
      where: { clientId: { in: empresaIds } },
    });
    await prisma.workHour.deleteMany({
      where: { clientId: { in: empresaIds } },
    });
    await prisma.project.deleteMany({
      where: { clientId: { in: empresaIds } },
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

  async function registerEmpresaAdmin(company: string) {
    const email = `mw24-admin-${uuidv4()}@test.local`;
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

  async function createUser(prefix: string) {
    const email = `${prefix}-${uuidv4()}@test.local`;
    const user = await prisma.user.create({
      data: { email, name: `${prefix} User`, password: 'not-used' },
    });
    userIds.push(user.id);
    return user;
  }

  // Middle of the current month, so it always lands inside the service's
  // default "current month" period without depending on when the test runs.
  const withinCurrentMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 15, 12, 0, 0);
  };

  it('rejeita as três rotas sem autenticação de Administrador', async () => {
    await request(app.getHttpServer())
      .get('/empresa-admin/dashboard/overview')
      .expect(401);
    await request(app.getHttpServer())
      .get('/empresa-admin/dashboard/colaboradores')
      .expect(401);
    await request(app.getHttpServer())
      .get('/empresa-admin/dashboard/export')
      .expect(401);
  });

  it('overview agrega colaboradores ativos, horas, faturado e convites pendentes no período', async () => {
    const admin = await registerEmpresaAdmin('Acme Dashboard');
    const userA = await createUser('mw24-a');
    const userB = await createUser('mw24-b');

    await prisma.colaborador.create({
      data: { userId: userA.id, empresaId: admin.empresaId, origin: 'CONVITE' },
    });
    await prisma.colaborador.create({
      data: { userId: userB.id, empresaId: admin.empresaId, origin: 'DOMINIO' },
    });

    const project = await prisma.project.create({
      data: {
        name: 'Projeto A',
        clientId: admin.empresaId,
        userId: userA.id,
        hourlyRate: 100,
      },
    });

    const workDate = withinCurrentMonth();
    const workHourA = await prisma.workHour.create({
      data: {
        date: workDate,
        hours: 2,
        userId: userA.id,
        clientId: admin.empresaId,
        projectId: project.id,
      },
    });
    await prisma.workHour.create({
      data: {
        date: workDate,
        hours: 3,
        userId: userB.id,
        clientId: admin.empresaId,
      },
    });

    // Only userA has an invoice — userB contributes hours but no faturado.
    await prisma.invoice.create({
      data: {
        clientId: admin.empresaId,
        amount: 200,
        status: 'PENDING',
        invoiceWorkHours: { create: [{ workHourId: workHourA.id }] },
      },
    });

    await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email: `mw24-pending-${uuidv4()}@test.local` })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/empresa-admin/dashboard/overview')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    expect(res.body.colaboradoresAtivos).toBe(2);
    expect(res.body.horasPeriodo).toBe(5);
    // "Faturado" soma Invoice.amount, não horas * taxa — só userA tem
    // invoice (200); userB não faturou nada ainda.
    expect(res.body.totalFaturado).toBe(200);
    expect(res.body.convitesPendentes).toBe(1);
  });

  it('total faturado ignora invoices canceladas e conta só as emitidas dentro do período', async () => {
    const admin = await registerEmpresaAdmin('Acme Faturado Canceladas');
    const user = await createUser('mw24-canceled');

    await prisma.colaborador.create({
      data: { userId: user.id, empresaId: admin.empresaId },
    });

    const workHour = await prisma.workHour.create({
      data: {
        date: withinCurrentMonth(),
        hours: 1,
        userId: user.id,
        clientId: admin.empresaId,
      },
    });

    await prisma.invoice.create({
      data: {
        clientId: admin.empresaId,
        amount: 999,
        status: 'CANCELED',
        invoiceWorkHours: { create: [{ workHourId: workHour.id }] },
      },
    });
    await prisma.invoice.create({
      data: {
        clientId: admin.empresaId,
        amount: 50,
        status: 'PAID',
        invoiceWorkHours: { create: [{ workHourId: workHour.id }] },
      },
    });

    const res = await request(app.getHttpServer())
      .get('/empresa-admin/dashboard/overview')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    // 999 (CANCELED) fica de fora; só o PAID de 50 entra na soma.
    expect(res.body.totalFaturado).toBe(50);
  });

  it('a tabela de colaboradores lista horas/projetos/faturado por Colaborador, com o tipo de vínculo', async () => {
    const admin = await registerEmpresaAdmin('Acme Tabela');
    const user = await createUser('mw24-table');

    await prisma.colaborador.create({
      data: { userId: user.id, empresaId: admin.empresaId, origin: 'CONVITE' },
    });

    const projectA = await prisma.project.create({
      data: {
        name: 'Projeto A',
        clientId: admin.empresaId,
        userId: user.id,
        hourlyRate: 50,
      },
    });
    const projectB = await prisma.project.create({
      data: {
        name: 'Projeto B',
        clientId: admin.empresaId,
        userId: user.id,
        hourlyRate: 20,
      },
    });

    const workDate = withinCurrentMonth();
    const workHourA = await prisma.workHour.create({
      data: {
        date: workDate,
        hours: 1,
        userId: user.id,
        clientId: admin.empresaId,
        projectId: projectA.id,
      },
    });
    const workHourB = await prisma.workHour.create({
      data: {
        date: workDate,
        hours: 4,
        userId: user.id,
        clientId: admin.empresaId,
        projectId: projectB.id,
      },
    });

    await prisma.invoice.create({
      data: {
        clientId: admin.empresaId,
        amount: 130,
        status: 'PENDING',
        invoiceWorkHours: {
          create: [
            { workHourId: workHourA.id },
            { workHourId: workHourB.id },
          ],
        },
      },
    });

    const res = await request(app.getHttpServer())
      .get('/empresa-admin/dashboard/colaboradores')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    const row = res.body[0];
    expect(row.name).toBe(user.name);
    expect(row.email).toBe(user.email);
    expect(row.origin).toBe('CONVITE');
    expect(row.horas).toBe(5);
    expect(row.projetos).toBe(2);
    expect(row.faturado).toBe(130); // soma de Invoice.amount, não horas * taxa
  });

  it('uma Empresa não vê os Colaboradores/horas de outra Empresa', async () => {
    const adminA = await registerEmpresaAdmin('Acme Isolada A');
    const adminB = await registerEmpresaAdmin('Acme Isolada B');
    const userA = await createUser('mw24-isolate-a');

    await prisma.colaborador.create({
      data: { userId: userA.id, empresaId: adminA.empresaId },
    });
    await prisma.workHour.create({
      data: {
        date: withinCurrentMonth(),
        hours: 10,
        userId: userA.id,
        clientId: adminA.empresaId,
      },
    });

    const resB = await request(app.getHttpServer())
      .get('/empresa-admin/dashboard/overview')
      .set('Authorization', `Bearer ${adminB.token}`)
      .expect(200);

    expect(resB.body.colaboradoresAtivos).toBe(0);
    expect(resB.body.horasPeriodo).toBe(0);

    const tableB = await request(app.getHttpServer())
      .get('/empresa-admin/dashboard/colaboradores')
      .set('Authorization', `Bearer ${adminB.token}`)
      .expect(200);
    expect(tableB.body).toEqual([]);
  });

  it('exporta CSV com header e uma linha por Colaborador', async () => {
    const admin = await registerEmpresaAdmin('Acme Export');
    const user = await createUser('mw24-export');

    await prisma.colaborador.create({
      data: { userId: user.id, empresaId: admin.empresaId, origin: 'DOMINIO' },
    });
    await prisma.workHour.create({
      data: {
        date: withinCurrentMonth(),
        hours: 2,
        userId: user.id,
        clientId: admin.empresaId,
      },
    });

    const res = await request(app.getHttpServer())
      .get('/empresa-admin/dashboard/export')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    expect(res.headers['content-type']).toContain('text/csv');
    const lines = (res.text as string).trim().split('\n');
    expect(lines[0]).toBe('Colaborador,Email,Vinculo,Horas,Projetos,Faturado');
    expect(lines[1]).toContain(user.name);
    expect(lines[1]).toContain(user.email);
    expect(lines[1]).toContain('Domínio');
  });

  it('aceita from/to explícitos, ignorando horas fora do período', async () => {
    const admin = await registerEmpresaAdmin('Acme Periodo');
    const user = await createUser('mw24-periodo');

    await prisma.colaborador.create({
      data: { userId: user.id, empresaId: admin.empresaId },
    });

    await prisma.workHour.create({
      data: {
        date: new Date('2020-01-15'),
        hours: 7,
        userId: user.id,
        clientId: admin.empresaId,
      },
    });
    await prisma.workHour.create({
      data: {
        date: new Date('2020-02-15'),
        hours: 99,
        userId: user.id,
        clientId: admin.empresaId,
      },
    });

    const res = await request(app.getHttpServer())
      .get('/empresa-admin/dashboard/overview')
      .query({ from: '2020-01-01', to: '2020-01-31' })
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    expect(res.body.horasPeriodo).toBe(7);
  });

  it('a origem do vínculo (Convite Pendente) aparece na tabela de colaboradores', async () => {
    const admin = await registerEmpresaAdmin('Acme Origem Convite');
    const email = `mw24-origin-convite-${uuidv4()}@test.local`;
    const user = await prisma.user.create({
      data: { email, name: 'Origem Convite', password: 'not-used' },
    });
    userIds.push(user.id);

    await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/empresa-admin/dashboard/colaboradores')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].origin).toBe('CONVITE');
  });
});
