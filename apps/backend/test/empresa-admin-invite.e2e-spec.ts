import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Empresa admin invite (e2e) — MW-20', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  const empresaIdsToCleanup: string[] = [];

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
    await prisma.empresaAdmin.deleteMany({
      where: { empresaId: { in: empresaIdsToCleanup } },
    });
    await prisma.empresa.deleteMany({
      where: { id: { in: empresaIdsToCleanup } },
    });
    await app.close();
  });

  async function createActivatedEmpresa() {
    const empresa = await prisma.empresa.create({
      data: {
        company: `Empresa Invite E2E ${uuidv4()}`,
        email: `contato-${uuidv4()}@empresa-invite-e2e.test`,
      },
    });
    empresaIdsToCleanup.push(empresa.id);

    const password = 'super-secret-1';
    const admin = await prisma.empresaAdmin.create({
      data: {
        empresaId: empresa.id,
        email: `admin-${uuidv4()}@empresa-invite-e2e.test`,
        password: await bcrypt.hash(password, 10),
      },
    });

    const token = jwtService.sign({
      email: admin.email,
      sub: admin.id,
      actorType: 'EMPRESA_ADMIN',
      empresaId: empresa.id,
    });

    return { empresa, admin, token };
  }

  it('rejects inviting without authentication', async () => {
    await request(app.getHttpServer())
      .post('/empresa-admin/auth/invite')
      .send({ email: `invitee-${uuidv4()}@anywhere.test` })
      .expect(401);
  });

  it('an authenticated Administrador can invite an email from any domain, and confirming creates a new EmpresaAdmin linked to the same Empresa, crediting who invited', async () => {
    const { empresa, admin, token } = await createActivatedEmpresa();
    const inviteeEmail = `invitee-${uuidv4()}@totally-external-domain.test`;

    await request(app.getHttpServer())
      .post('/empresa-admin/auth/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: inviteeEmail })
      .expect(201);

    const inviteToken = jwtService.sign(
      {
        empresaId: empresa.id,
        email: inviteeEmail,
        invitedById: admin.id,
        type: 'empresa-admin-invite',
      },
      { expiresIn: '1h' },
    );

    const res = await request(app.getHttpServer())
      .post('/empresa-admin/auth/invite/confirm')
      .send({ token: inviteToken, password: 'brand-new-password-1' })
      .expect(201);

    expect(res.body.admin.email).toBe(inviteeEmail);
    expect(res.body.admin.empresaId).toBe(empresa.id);

    const created = await prisma.empresaAdmin.findUnique({
      where: { email: inviteeEmail },
    });
    expect(created?.invitedById).toBe(admin.id);
    expect(created?.empresaId).toBe(empresa.id);

    // Both Administradores can now log in independently.
    await request(app.getHttpServer())
      .post('/empresa-admin/auth/login')
      .send({ email: admin.email, password: 'super-secret-1' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/empresa-admin/auth/login')
      .send({ email: inviteeEmail, password: 'brand-new-password-1' })
      .expect(201);
  });

  it('rejects confirming an invite for an email that already has an EmpresaAdmin', async () => {
    const { empresa, admin, token } = await createActivatedEmpresa();

    await request(app.getHttpServer())
      .post('/empresa-admin/auth/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: admin.email })
      .expect(409);

    const inviteToken = jwtService.sign(
      {
        empresaId: empresa.id,
        email: admin.email,
        invitedById: admin.id,
        type: 'empresa-admin-invite',
      },
      { expiresIn: '1h' },
    );

    await request(app.getHttpServer())
      .post('/empresa-admin/auth/invite/confirm')
      .send({ token: inviteToken, password: 'whatever-password-1' })
      .expect(409);
  });

  it('rejects confirming with a token of the wrong type', async () => {
    const { empresa, admin } = await createActivatedEmpresa();

    const wrongTypeToken = jwtService.sign(
      {
        empresaId: empresa.id,
        email: `wrongtype-${uuidv4()}@anywhere.test`,
        invitedById: admin.id,
        type: 'empresa-activation',
      },
      { expiresIn: '1h' },
    );

    await request(app.getHttpServer())
      .post('/empresa-admin/auth/invite/confirm')
      .send({ token: wrongTypeToken, password: 'whatever-password-1' })
      .expect(400);
  });
});
