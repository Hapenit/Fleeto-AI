import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('CallHistoryController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let adminUserId: string;
  let testRequirementId: string;
  let testVendorId: string;
  let testCallId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const passwordHash = await bcrypt.hash('password123', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: `admin_callhist_${Date.now()}@test.com`,
        passwordHash,
        firstName: 'Admin',
        lastName: 'HistTest',
        role: 'ADMIN',
      }
    });
    adminUserId = adminUser.id;

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(201);
    authToken = loginRes.body.data.accessToken;

    const req = await prisma.requirement.create({
      data: {
        requirementNumber: `REQ-HIST-${Date.now()}`,
        pickupCity: 'Chennai',
        deliveryCity: 'Bangalore',
        createdById: adminUserId,
      }
    });
    testRequirementId = req.id;

    const vendor = await prisma.vendor.create({
      data: {
        vendorCode: `VND-HIST-${Date.now()}`,
        companyName: 'Vendor Hist',
        contactPersonName: 'Test',
        primaryPhone: '+919999988899',
        createdById: adminUserId
      }
    });
    testVendorId = vendor.id;

    const call = await prisma.voiceCall.create({
      data: {
        callNumber: `CALL-HIST-${Date.now()}`,
        requirementId: testRequirementId,
        vendorId: testVendorId,
        provider: 'EXOTEL',
        providerCallId: `exotel_${Date.now()}`,
        status: 'COMPLETED',
        phoneNumber: '+919999988899',
        startedAt: new Date(),
        connectedAt: new Date(),
        endedAt: new Date(),
        durationSeconds: 120,
      }
    });
    testCallId = call.id;

    await prisma.callRecording.create({
      data: {
        callId: testCallId,
        storageProvider: 'SUPABASE',
        storageKey: `calls/2026/09/29/${testCallId}/recording.wav`,
        originalFileName: 'recording.wav',
        mimeType: 'audio/wav',
        fileSizeBytes: 2048000,
        durationSeconds: 120,
        status: 'AVAILABLE',
      }
    });

    await prisma.callOutcome.create({
      data: {
        callId: testCallId,
        outcome: 'QUOTE_RECEIVED',
        summary: 'Received a quote of 78000',
      }
    });

    await prisma.callTranscript.create({
      data: {
        callId: testCallId,
        sequenceNumber: 1,
        speaker: 'AI',
        text: 'Hello, this is Fleeto.',
        language: 'EN',
      }
    });
  });

  afterAll(async () => {
    await prisma.callRecordingAccessLog.deleteMany({ where: { recording: { callId: testCallId } } });
    await prisma.callRecording.deleteMany({ where: { callId: testCallId } });
    await prisma.callTranscript.deleteMany({ where: { callId: testCallId } });
    await prisma.callOutcome.deleteMany({ where: { callId: testCallId } });
    await prisma.voiceCall.deleteMany({ where: { id: testCallId } });
    await prisma.vendor.deleteMany({ where: { id: testVendorId } });
    await prisma.requirement.deleteMany({ where: { id: testRequirementId } });
    await prisma.user.deleteMany({ where: { id: adminUserId } });
    await app.close();
  });

  it('/api/calls (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/calls?status=COMPLETED`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeInstanceOf(Array);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.items[0].recording).toBeDefined();
  });

  it('/api/calls/:id (GET) - get call details', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/calls/${testCallId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.call.id).toBe(testCallId);
    expect(res.body.data.vendor.id).toBe(testVendorId);
    expect(res.body.data.outcome.outcome).toBe('QUOTE_RECEIVED');
    expect(res.body.data.recording.status).toBe('AVAILABLE');
  });

  it('/api/calls/:id/transcript (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/calls/${testCallId}/transcript`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeInstanceOf(Array);
    expect(res.body.data.items.length).toBe(1);
  });

  it('/api/calls/:id/recording/access (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/calls/${testCallId}/recording/access`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toBeDefined();
    expect(res.body.data.expiresAt).toBeDefined();

    // Verify audit log
    const audit = await prisma.callRecordingAccessLog.findFirst({
      where: { recording: { callId: testCallId } }
    });
    expect(audit).toBeDefined();
    expect(audit?.action).toBe('PLAY');
  });

  it('/api/call-recordings/webhooks/provider (POST) - handle webhook', async () => {
    const providerCallId = `exotel_webhook_${Date.now()}`;
    const newCall = await prisma.voiceCall.create({
      data: {
        callNumber: `CALL-WEBHOOK-${Date.now()}`,
        requirementId: testRequirementId,
        vendorId: testVendorId,
        provider: 'EXOTEL',
        providerCallId,
        status: 'COMPLETED',
        phoneNumber: '+919999988899',
      }
    });

    const res = await request(app.getHttpServer())
      .post(`/api/call-recordings/webhooks/provider`)
      .send({
        providerCallId,
        durationSeconds: 150,
      })
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.recordingId).toBeDefined();

    // Cleanup
    await prisma.callRecording.delete({ where: { id: res.body.data.recordingId } });
    await prisma.voiceCall.delete({ where: { id: newCall.id } });
  });
});
