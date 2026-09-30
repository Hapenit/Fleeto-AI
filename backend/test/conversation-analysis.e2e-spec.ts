import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('ConversationAnalysisController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testCallId: string;
  let testRequirementId: string;
  let testVendorId: string;

  beforeAll(async () => {
    process.env.VOICE_AGENT_MODE = 'SIMULATION'; // Force simulation mode
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    
    const passwordHash = await bcrypt.hash('password123', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: `admin_${Date.now()}@test.com`,
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

    // Create Requirement
    const requirement = await prisma.requirement.create({
      data: {
        requirementNumber: `REQ-${Date.now()}`,
        pickupLocation: 'Chennai',
        deliveryLocation: 'Bangalore',
        createdById: adminUser.id,
      }
    });
    testRequirementId = requirement.id;

    // Create Vendor
    const vendor = await prisma.vendor.create({
      data: {
        vendorCode: `VND-${Date.now()}`,
        companyName: 'Test Vendor',
        contactPersonName: 'Test Person',
        primaryPhone: '+919999999999',
        createdById: adminUser.id,
      }
    });
    testVendorId = vendor.id;

    // Create VoiceCall
    const voiceCall = await prisma.voiceCall.create({
      data: {
        callNumber: `CALL-${Date.now()}`,
        requirementId: testRequirementId,
        vendorId: testVendorId,
        provider: 'mock',
        status: 'COMPLETED',
        phoneNumber: '+919999999999'
      }
    });
    testCallId = voiceCall.id;

    // Add some transcripts
    await prisma.callTranscript.createMany({
      data: [
        { callId: testCallId, speaker: 'AI', text: 'Hello', sequenceNumber: 1 },
        { callId: testCallId, speaker: 'VENDOR', text: 'Yes tell me', sequenceNumber: 2 },
        { callId: testCallId, speaker: 'AI', text: 'How much for Bangalore?', sequenceNumber: 3 },
        { callId: testCallId, speaker: 'VENDOR', text: '78000', sequenceNumber: 4 },
      ]
    });
  });

  afterAll(async () => {
    await prisma.callTranscript.deleteMany({ where: { callId: testCallId }});
    await prisma.voiceCall.deleteMany({ where: { id: testCallId }});
    await prisma.vendor.deleteMany({ where: { id: testVendorId }});
    await prisma.requirement.deleteMany({ where: { id: testRequirementId }});
    await app.close();
  });

  it('/api/calls/:callId/analysis (POST) - Trigger Analysis', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/calls/${testCallId}/analysis`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201);
    
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PROCESSING');

    // Wait a bit for processing to complete
    await new Promise(r => setTimeout(r, 2000));
  });

  it('/api/calls/:callId/analysis (GET) - Get Result', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/calls/${testCallId}/analysis`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data).not.toBeNull();
    expect(res.body.data.status).toBe('COMPLETED');
    expect(res.body.data.quoteAmount).toBe(78000); // From the mock Gemini response
  });
});
