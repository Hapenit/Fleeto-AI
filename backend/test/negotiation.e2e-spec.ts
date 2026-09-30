import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('NegotiationController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testRequirementId: string;
  let testCallId: string;
  let testVendorId: string;

  beforeAll(async () => {
    process.env.VOICE_AGENT_MODE = 'SIMULATION'; // Use simulation for predictable answers

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const passwordHash = await bcrypt.hash('password123', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: `admin_negotiation_${Date.now()}@test.com`,
        passwordHash,
        firstName: 'Admin',
        lastName: 'Test',
        role: 'ADMIN',
      }
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: 'password123' })
      .expect(201);
    authToken = loginRes.body.data.accessToken;

    const req = await prisma.requirement.create({
      data: {
        requirementNumber: `REQ-${Date.now()}`,
        pickupCity: 'Chennai',
        deliveryCity: 'Bangalore',
        createdById: adminUser.id,
        status: 'DRAFT'
      }
    });
    testRequirementId = req.id;

    const vendor = await prisma.vendor.create({
      data: {
        vendorCode: `VND-${Date.now()}`,
        companyName: 'Test Transporters',
        contactPersonName: 'Test Contact',
        primaryPhone: '+919999999999',
        createdById: adminUser.id
      }
    });
    testVendorId = vendor.id;

    const call = await prisma.voiceCall.create({
      data: {
        callNumber: `CALL-NEG-${Date.now()}`,
        requirementId: testRequirementId,
        vendorId: testVendorId,
        provider: 'mock',
        status: 'COMPLETED',
        phoneNumber: vendor.primaryPhone
      }
    });
    testCallId = call.id;

    // Simulate analysis result with initial vendor quote > targetPrice but <= maximum
    await prisma.conversationAnalysis.create({
      data: {
        callId: testCallId,
        requirementId: testRequirementId,
        vendorId: testVendorId,
        status: 'COMPLETED',
        analysisVersion: '1.0.0',
        provider: 'gemini',
        model: 'gemini',
        quoteAmount: 78000
      }
    });
  });

  afterAll(async () => {
    await prisma.negotiationSession.deleteMany({ where: { callId: testCallId } });
    await prisma.negotiationPolicy.deleteMany({ where: { requirementId: testRequirementId } });
    await prisma.conversationAnalysis.deleteMany({ where: { callId: testCallId } });
    await prisma.voiceCall.deleteMany({ where: { id: testCallId } });
    await prisma.vendor.deleteMany({ where: { id: testVendorId } });
    await prisma.requirement.deleteMany({ where: { id: testRequirementId } });
    await app.close();
  });

  it('/api/requirements/:requirementId/negotiation-policy (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/requirements/${testRequirementId}/negotiation-policy`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        enabled: true,
        mode: 'AI_AUTONOMOUS',
        targetPrice: 75000,
        maximumAuthorizedPrice: 80000,
        maxAttempts: 3
      })
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.targetPrice).toBe(75000);
  });

  it('/api/calls/:callId/negotiation (POST)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/calls/${testCallId}/negotiation`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ASSESSING');

    // Wait for async processing
    await new Promise(r => setTimeout(r, 2000));
  });

  it('/api/calls/:callId/negotiation (GET) - Verify Counter Offer', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/calls/${testCallId}/negotiation`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    
    // In Simulation mode, vendor amount (78000) <= max (80000) and > target (75000).
    // The mock returns ACCEPT_VENDOR_PRICE and sets status to PRICE_AGREED
    expect(res.body.data.status).toBe('PRICE_AGREED');
    expect(res.body.data.finalNegotiatedPrice).toBe(78000);
    expect(res.body.data.attempts.length).toBeGreaterThan(0);
  });
});
