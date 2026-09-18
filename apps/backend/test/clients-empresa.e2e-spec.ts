import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Clients (Empresa/Colaborador) (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let userAId: string;
  let userBId: string;
  let tokenA: string;
  let tokenB: string;

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

    const userA = await prisma.user.create({
      data: {
        email: `clients-empresa-e2e-a-${uuidv4()}@test.local`,
        name: 'Clients Empresa E2E A',
        password: 'not-used',
      },
    });
    userAId = userA.id;
    tokenA = jwtService.sign({ sub: userAId });

    const userB = await prisma.user.create({
      data: {
        email: `clients-empresa-e2e-b-${uuidv4()}@test.local`,
        name: 'Clients Empresa E2E B',
        password: 'not-used',
      },
    });
    userBId = userB.id;
    tokenB = jwtService.sign({ sub: userBId });
  });

  afterAll(async () => {
    await prisma.colaborador.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.empresa.deleteMany({
      where: {
        colaboradores: { some: { userId: { in: [userAId, userBId] } } },
      },
    });
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    await app.close();
  });

  it('creating a client links the creator as Colaborador and it shows up in their list', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ email: 'acme@test.local', company: 'Acme' })
      .expect(201);

    const empresaId = createRes.body.id;

    const listRes = await request(app.getHttpServer())
      .get('/clients')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(listRes.body.map((c: { id: string }) => c.id)).toContain(
      empresaId,
    );

    const colaborador = await prisma.colaborador.findFirst({
      where: { userId: userAId, empresaId },
    });
    expect(colaborador).not.toBeNull();
  });

  it('a client is invisible to a user with no Colaborador link to it', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ email: 'private@test.local', company: 'Private Co' })
      .expect(201);

    const empresaId = createRes.body.id;

    await request(app.getHttpServer())
      .get(`/clients/${empresaId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  it('a second Colaborador row on the same Empresa makes it visible to both users (N:N)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ email: 'shared@test.local', company: 'Shared Co' })
      .expect(201);

    const empresaId = createRes.body.id;

    await prisma.colaborador.create({
      data: { userId: userBId, empresaId },
    });

    const [resA, resB] = await Promise.all([
      request(app.getHttpServer())
        .get(`/clients/${empresaId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200),
      request(app.getHttpServer())
        .get(`/clients/${empresaId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200),
    ]);

    expect(resA.body.id).toBe(empresaId);
    expect(resB.body.id).toBe(empresaId);
  });
});
