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
    const email = `convite-pendente-admin-${uuidv4()}@test.local`;
    const password = 'super-secret-1';
    const res = await request(app.getHttpServer())
      .post('/empresa-admin/auth/register')
      .send({ company, email, password })
      .expect(201);

    empresaIds.push(res.body.admin.empresaId);
    return {
      token: res.body.access_token as string,
      empresaId: res.body.admin.empresaId as string,
      adminEmail: email,
    };
  }

  it('creating an invite for an email with no User yet leaves it PENDING', async () => {
    const admin = await registerEmpresaAdmin('Acme Pendente');
    const email = `pending-${uuidv4()}@test.local`;

    const res = await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email })
      .expect(201);

    expect(res.body.status).toBe('PENDING');
    expect(res.body.linkedAt).toBeNull();
  });

  it('creating an invite for an email with an existing User links it immediately', async () => {
    const admin = await registerEmpresaAdmin('Acme Imediato');
    const email = `existing-${uuidv4()}@test.local`;
    const user = await prisma.user.create({
      data: { email, name: 'Existing User', password: 'not-used' },
    });
    userIds.push(user.id);

    const res = await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email })
      .expect(201);

    expect(res.body.status).toBe('LINKED');
    expect(res.body.linkedAt).not.toBeNull();

    const colaborador = await prisma.colaborador.findFirst({
      where: { userId: user.id, empresaId: admin.empresaId },
    });
    expect(colaborador).not.toBeNull();
  });

  it('links automatically on signup when a Convite Pendente exists for that email', async () => {
    const admin = await registerEmpresaAdmin('Acme Signup');
    const email = `signup-${uuidv4()}@test.local`;

    await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email })
      .expect(201);

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, name: 'New Signup User', password: 'super-secret-1' })
      .expect(201);
    userIds.push(registerRes.body.user.id);

    const colaborador = await prisma.colaborador.findFirst({
      where: { userId: registerRes.body.user.id, empresaId: admin.empresaId },
    });
    expect(colaborador).not.toBeNull();

    const invite = await prisma.convitePendente.findFirst({
      where: { empresaId: admin.empresaId, email },
    });
    expect(invite?.status).toBe('LINKED');
  });

  it('links automatically on login when the User already existed before the invite', async () => {
    const admin = await registerEmpresaAdmin('Acme Login');
    const email = `login-${uuidv4()}@test.local`;
    const password = 'super-secret-1';
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name: 'Pre-existing User', password: hashed },
    });
    userIds.push(user.id);

    await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email })
      .expect(201);

    // The invite was created for an existing User, so it links immediately —
    // login is not required for the initial match, only asserted here.
    let colaborador = await prisma.colaborador.findFirst({
      where: { userId: user.id, empresaId: admin.empresaId },
    });
    expect(colaborador).not.toBeNull();

    // A second Empresa invites the SAME email after the fact: it stays
    // PENDING until the next login, proving the login hook (not just the
    // create-time immediate link) also effectuates it.
    const admin2 = await registerEmpresaAdmin('Acme Login Second');
    await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .set('Authorization', `Bearer ${admin2.token}`)
      .send({ email })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    colaborador = await prisma.colaborador.findFirst({
      where: { userId: user.id, empresaId: admin2.empresaId },
    });
    expect(colaborador).not.toBeNull();
  });

  it('two different Empresas inviting the same email both link independently', async () => {
    const adminA = await registerEmpresaAdmin('Acme A');
    const adminB = await registerEmpresaAdmin('Acme B');
    const email = `multi-empresa-${uuidv4()}@test.local`;

    await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .set('Authorization', `Bearer ${adminA.token}`)
      .send({ email })
      .expect(201);
    await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .set('Authorization', `Bearer ${adminB.token}`)
      .send({ email })
      .expect(201);

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, name: 'Multi Empresa User', password: 'super-secret-1' })
      .expect(201);
    userIds.push(registerRes.body.user.id);

    const colaboradores = await prisma.colaborador.findMany({
      where: { userId: registerRes.body.user.id },
    });
    const linkedEmpresaIds = colaboradores.map((c) => c.empresaId);
    expect(linkedEmpresaIds).toEqual(
      expect.arrayContaining([adminA.empresaId, adminB.empresaId]),
    );
    expect(colaboradores.length).toBe(2);
  });

  it('rejects an unauthenticated request to create an invite (Empresa must be activated via a real Administrador)', async () => {
    await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .send({ email: `no-auth-${uuidv4()}@test.local` })
      .expect(401);
  });

  it('rejects a duplicate active invite for the same empresa+email', async () => {
    const admin = await registerEmpresaAdmin('Acme Duplicate');
    const email = `duplicate-${uuidv4()}@test.local`;

    await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email })
      .expect(201);

    await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email })
      .expect(409);
  });

  it('revokes a not-yet-linked invite, and rejects revoking an already-linked one', async () => {
    const admin = await registerEmpresaAdmin('Acme Revoke');
    const pendingEmail = `revoke-pending-${uuidv4()}@test.local`;
    const linkedEmail = `revoke-linked-${uuidv4()}@test.local`;

    const pendingRes = await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email: pendingEmail })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/empresa-admin/invites/${pendingRes.body.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    const revoked = await prisma.convitePendente.findUnique({
      where: { id: pendingRes.body.id },
    });
    expect(revoked?.status).toBe('REVOKED');

    const user = await prisma.user.create({
      data: { email: linkedEmail, name: 'Linked User', password: 'not-used' },
    });
    userIds.push(user.id);
    const linkedRes = await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ email: linkedEmail })
      .expect(201);
    expect(linkedRes.body.status).toBe('LINKED');

    await request(app.getHttpServer())
      .delete(`/empresa-admin/invites/${linkedRes.body.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(400);
  });

  it('an Administrador cannot revoke another Empresa\'s invite', async () => {
    const adminA = await registerEmpresaAdmin('Acme Owner');
    const adminB = await registerEmpresaAdmin('Acme Intruder');
    const email = `cross-empresa-${uuidv4()}@test.local`;

    const res = await request(app.getHttpServer())
      .post('/empresa-admin/invites')
      .set('Authorization', `Bearer ${adminA.token}`)
      .send({ email })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/empresa-admin/invites/${res.body.id}`)
      .set('Authorization', `Bearer ${adminB.token}`)
      .expect(404);
  });
});
