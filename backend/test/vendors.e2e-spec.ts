import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('VendorsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenAdmin: string;
  let tokenMarketing: string;
  let adminId: string;
  let marketingId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin-ven-e2e@test.local' },
      update: { passwordHash, role: Role.ADMIN },
      create: {
        firstName: 'Admin', lastName: 'VenTest', email: 'admin-ven-e2e@test.local',
        passwordHash, role: Role.ADMIN,
      },
    });
    adminId = admin.id;

    const marketing = await prisma.user.upsert({
      where: { email: 'marketing-ven-e2e@test.local' },
      update: { passwordHash, role: Role.MARKETING_USER },
      create: {
        firstName: 'Marketing', lastName: 'VenTest', email: 'marketing-ven-e2e@test.local',
        passwordHash, role: Role.MARKETING_USER,
      },
    });
    marketingId = marketing.id;

    const resAdmin = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'admin-ven-e2e@test.local', password: 'password123' }).expect(201);
    tokenAdmin = resAdmin.body.data.accessToken;

    const resMarketing = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'marketing-ven-e2e@test.local', password: 'password123' }).expect(201);
    tokenMarketing = resMarketing.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.vendor.deleteMany({ where: { createdById: { in: [adminId, marketingId] } } });
    await app.close();
  });

  let vendorId: string;

  it('/api/vendors (POST) - valid vendor', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vendors')
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .send({
        companyName: 'Test Vendor E2E',
        contactPersonName: 'Contact E2E',
        primaryPhone: '+919999999991',
        locations: [{ city: 'Chennai' }]
      })
      .expect(201);
      
    expect(res.body.success).toBe(true);
    expect(res.body.data.vendorCode).toBeDefined();
    vendorId = res.body.data.id;
  });

  it('/api/vendors (POST) - duplicate phone', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vendors')
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .send({
        companyName: 'Test Vendor E2E 2',
        contactPersonName: 'Contact E2E',
        primaryPhone: '+919999999991',
        locations: [{ city: 'Bangalore' }]
      })
      .expect(400);
  });

  it('/api/vendors (POST) - invalid capabilities', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vendors')
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .send({
        companyName: 'Test Vendor E2E 3',
        contactPersonName: 'Contact E2E',
        primaryPhone: '+919999999992',
      })
      .expect(400); // Because it requires at least one capability
  });

  it('/api/vendors (GET) - list with search', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/vendors?search=Test Vendor E2E')
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.vendors.length).toBeGreaterThan(0);
  });

  it('/api/vendors/:id (GET) - single vendor', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/vendors/${vendorId}`)
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(vendorId);
  });

  it('/api/vendors/:id/status (POST) - change status MARKETING', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/vendors/${vendorId}/status`)
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .send({ status: 'ACTIVE' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ACTIVE');
  });

  it('/api/vendors/:id/status (POST) - change status SUSPENDED forbidden', async () => {
    await request(app.getHttpServer())
      .post(`/api/vendors/${vendorId}/status`)
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .send({ status: 'SUSPENDED' })
      .expect(403);
  });

  it('/api/vendors/:id/status (POST) - change status SUSPENDED admin', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/vendors/${vendorId}/status`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ status: 'SUSPENDED' })
      .expect(201);

    expect(res.body.data.status).toBe('SUSPENDED');
  });

  it('/api/vendors/:id (DELETE) - unauthorized', async () => {
    await request(app.getHttpServer())
      .delete(`/api/vendors/${vendorId}`)
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .expect(403);
  });

  it('/api/vendors/:id (DELETE) - admin authorized', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/api/vendors/${vendorId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);
      
    expect(res.body.data.status).toBe('INACTIVE');
  });
});
