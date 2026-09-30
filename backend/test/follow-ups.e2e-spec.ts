import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { CanActivate } from '@nestjs/common';
import { FollowUpType, FollowUpReason } from '@prisma/client';

describe('FollowUpsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUserId = 'test-user-id';
  let testVendorId: string;
  let testReqId: string;
  let testFollowUpId: string;

  beforeAll(async () => {
    const mockAuthGuard: CanActivate = {
      canActivate: (context) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId: testUserId };
        return true;
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Create test user
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: 'followup.test@example.com',
        passwordHash: 'hash',
        firstName: 'FollowUp',
        lastName: 'TestUser',
        role: 'MARKETING_USER',
      },
    });

    // Create test vendor
    const vendor = await prisma.vendor.create({
      data: {
        companyName: 'FollowUp Vendor',
        contactPersonName: 'Test Contact',
        primaryPhone: '+919999999999',
        vendorCode: 'V-FUP',
        status: 'ACTIVE',
        createdById: user.id,
      }
    });
    testVendorId = vendor.id;

    // Create test requirement
    const req = await prisma.requirement.create({
      data: {
        requirementNumber: 'REQ-FUP',
        status: 'READY',
        createdById: user.id,
      }
    });
    testReqId = req.id;
  });

  afterAll(async () => {
    await prisma.followUpAudit.deleteMany({ where: { userId: testUserId } });
    await prisma.followUpAttempt.deleteMany();
    await prisma.followUp.deleteMany({ where: { createdById: testUserId } });
    await prisma.requirement.deleteMany({ where: { id: testReqId } });
    await prisma.vendor.deleteMany({ where: { id: testVendorId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await app.close();
  });

  it('/api/follow-ups (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/follow-ups')
      .send({
        requirementId: testReqId,
        vendorId: testVendorId,
        type: FollowUpType.CALLBACK,
        reason: FollowUpReason.VENDOR_REQUESTED_CALLBACK,
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        notes: 'Test callback',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('SCHEDULED');
    testFollowUpId = res.body.id;
  });

  it('/api/follow-ups (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/follow-ups')
      .expect(200);

    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it('/api/follow-ups/:id (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/follow-ups/${testFollowUpId}`)
      .expect(200);

    expect(res.body.id).toBe(testFollowUpId);
    expect(res.body.vendor.id).toBe(testVendorId);
  });

  it('/api/follow-ups/:id/reschedule (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/follow-ups/${testFollowUpId}/reschedule`)
      .send({
        scheduledAt: new Date(Date.now() + 7200000).toISOString(),
        reason: 'Vendor changed mind',
      })
      .expect(201);

    expect(res.body.status).toBe('SCHEDULED');
  });

  it('/api/follow-ups/:id/retry (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/follow-ups/${testFollowUpId}/retry`)
      .send()
      .expect(201);

    expect(res.body.status).toBe('READY');
  });

  it('/api/follow-ups/:id/complete (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/follow-ups/${testFollowUpId}/complete`)
      .send({ notes: 'Done manually' })
      .expect(201);

    expect(res.body.status).toBe('COMPLETED');
  });
});
