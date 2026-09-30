import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

describe('RequirementsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    
    // Seed user and login to get token
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'e2e@test.local' },
      update: { passwordHash },
      create: {
        firstName: 'E2E',
        lastName: 'Test',
        email: 'e2e@test.local',
        passwordHash,
        role: Role.MARKETING_USER,
      },
    });
    userId = user.id;

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'e2e@test.local', password: 'password123' })
      .expect(201);
      
    token = res.body.data.accessToken;
  });

  afterAll(async () => {
    // Cleanup created requirements by this user
    await prisma.requirement.deleteMany({ where: { createdById: userId } });
    await app.close();
  });

  it('/api/requirements (POST) - create new draft requirement', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/requirements')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Test Co',
        pickupLocation: 'City A',
        deliveryLocation: 'City B',
        cargoType: 'Boxes',
      })
      .expect(201);
      
    expect(res.body.success).toBe(true);
    expect(res.body.data.requirementNumber).toBeDefined();
    expect(res.body.data.status).toBe('DRAFT');
  });

  it('/api/requirements (GET) - fetch requirements', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/requirements')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
      
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
