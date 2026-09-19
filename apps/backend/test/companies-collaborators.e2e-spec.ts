import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Companies and Collaborators (e2e)', () => {
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
        email: `clients-company-e2e-a-${uuidv4()}@test.local`,
        name: 'Clients Company E2E A',
        password: 'not-used',
      },
    });
    userAId = userA.id;
    tokenA = jwtService.sign({ sub: userAId });

    const userB = await prisma.user.create({
      data: {
        email: `clients-company-e2e-b-${uuidv4()}@test.local`,
        name: 'Clients Company E2E B',
        password: 'not-used',
      },
    });
    userBId = userB.id;
    tokenB = jwtService.sign({ sub: userBId });
  });

  afterAll(async () => {
    await prisma.collaborator.deleteMany({
      where: { userId: { in: [userAId, userBId] } },
    });
    await prisma.company.deleteMany({
      where: {
        collaborators: { some: { userId: { in: [userAId, userBId] } } },
      },
    });
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    await app.close();
  });

  it('creating a Company links the creator as Collaborator and it shows up in their list', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/companies')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ email: 'acme@test.local', company: 'Acme' })
      .expect(201);

    const companyId = createRes.body.id;

    const listRes = await request(app.getHttpServer())
      .get('/companies')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(listRes.body.map((c: { id: string }) => c.id)).toContain(companyId);

    const collaborator = await prisma.collaborator.findFirst({
      where: { userId: userAId, companyId },
    });
    expect(collaborator).not.toBeNull();
  });

  it('a Company is invisible to a user with no Collaborator link to it', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/companies')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ email: 'private@test.local', company: 'Private Co' })
      .expect(201);

    const companyId = createRes.body.id;

    await request(app.getHttpServer())
      .get(`/companies/${companyId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });

  it('a second Collaborator row on the same Company makes it visible to both users (N:N)', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/companies')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ email: 'shared@test.local', company: 'Shared Co' })
      .expect(201);

    const companyId = createRes.body.id;

    await prisma.collaborator.create({
      data: { userId: userBId, companyId },
    });

    const [resA, resB] = await Promise.all([
      request(app.getHttpServer())
        .get(`/companies/${companyId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200),
      request(app.getHttpServer())
        .get(`/companies/${companyId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200),
    ]);

    expect(resA.body.id).toBe(companyId);
    expect(resB.body.id).toBe(companyId);
  });
});
