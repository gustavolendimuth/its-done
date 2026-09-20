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

  describe('Company name is required and non-blank', () => {
    it('POST /companies rejects a name made only of spaces with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ company: '   ', email: 'a@b.test' })
        .expect(400);

      expect(res.body.message).toContain('Company is required');
    });

    it('POST /companies stores the trimmed name', async () => {
      const res = await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ company: '  Padded Co  ', email: 'padded@test.local' })
        .expect(201);

      expect(res.body.company).toBe('Padded Co');
      const row = await prisma.company.findUnique({
        where: { id: res.body.id },
      });
      expect(row?.company).toBe('Padded Co');
    });

    it('PATCH /companies/:id rejects null and blank names with 400 and keeps the stored name', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ company: 'Keep Me', email: 'keep@test.local' })
        .expect(201);
      const companyId = createRes.body.id;

      for (const bad of [null, '   ', '']) {
        const res = await request(app.getHttpServer())
          .patch(`/companies/${companyId}`)
          .set('Authorization', `Bearer ${tokenA}`)
          .send({ company: bad })
          .expect(400);
        expect(res.body.message).toContain('Company is required');
      }

      const row = await prisma.company.findUnique({ where: { id: companyId } });
      expect(row?.company).toBe('Keep Me');
    });

    it('PATCH /companies/:id without the company key still updates other fields', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ company: 'Partial Co', email: 'partial@test.local' })
        .expect(201);
      const companyId = createRes.body.id;

      const res = await request(app.getHttpServer())
        .patch(`/companies/${companyId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ phone: '555' })
        .expect(200);

      expect(res.body.company).toBe('Partial Co');
      expect(res.body.phone).toBe('555');
    });
  });
});
