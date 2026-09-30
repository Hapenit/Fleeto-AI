import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { Role, VendorStatus } from '@prisma/client';
import { CallOrchestratorService } from './../src/voice-agent/call-orchestrator.service.js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('VoiceAgentController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenMarketing: string;
  let requirementId: string;
  let vendorId: string;
  let callId: string;

  beforeAll(async () => {
    process.env.VOICE_AGENT_MODE = 'SIMULATION';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    
    const passwordHash = await bcrypt.hash('password123', 10);

    const marketing = await prisma.user.upsert({
      where: { email: 'marketing-voice-e2e@test.local' },
      update: { passwordHash, role: Role.MARKETING_USER },
      create: {
        firstName: 'Marketing', lastName: 'VoiceTest', email: 'marketing-voice-e2e@test.local',
        passwordHash, role: Role.MARKETING_USER,
      },
    });

    const resMarketing = await request(app.getHttpServer()).post('/api/auth/login').send({ email: 'marketing-voice-e2e@test.local', password: 'password123' }).expect(201);
    tokenMarketing = resMarketing.body.data.accessToken;

    const req = await prisma.requirement.create({
      data: {
        requirementNumber: 'REQ-VOICE-001',
        customerName: 'Test',
        pickupLocation: 'Chennai',
        deliveryLocation: 'Bangalore',
        cargoType: 'INDUSTRIAL',
        cargoWeight: 20,
        cargoWeightUnit: 'TON',
        vehicleType: 'TRAILER',
        createdById: marketing.id,
      }
    });
    requirementId = req.id;

    const vendor = await prisma.vendor.create({
      data: {
        vendorCode: 'VEN-VOICE-001',
        companyName: 'Voice Vendor',
        contactPersonName: 'Contact',
        primaryPhone: '+919999999911',
        status: VendorStatus.ACTIVE,
        createdById: marketing.id,
      }
    });
    vendorId = vendor.id;
  });

  afterAll(async () => {
    await prisma.callEvent.deleteMany();
    await prisma.callTranscript.deleteMany();
    await prisma.callExtraction.deleteMany();
    await prisma.callOutcome.deleteMany();
    await prisma.callSession.deleteMany();
    await prisma.voiceCall.deleteMany();
    await prisma.vendor.deleteMany({ where: { vendorCode: 'VEN-VOICE-001' } });
    await prisma.requirement.deleteMany({ where: { requirementNumber: 'REQ-VOICE-001' } });
    await app.close();
  });

  it('/api/voice-calls (POST) - create call', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/voice-calls')
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .send({ requirementId, vendorId })
      .expect(201);
      
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('QUEUED');
    callId = res.body.data.id;
  });

  it('/api/voice-calls/:id/initiate (POST) - initiate call', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/voice-calls/${callId}/initiate`)
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .expect(201);

    expect(res.body.success).toBe(true);
    // Should transition from QUEUED -> INITIATING -> RINGING
    expect(res.body.data.providerCallId).toBeDefined();
    
    // We should simulate connected
    await app.get(CallOrchestratorService).handleCallConnected(callId);
    
    const dbCall = await prisma.voiceCall.findUnique({ where: { id: callId } });
    expect(dbCall?.status).toBe('CONVERSATION');
  });

  it('/api/voice-calls/:id/simulate-speech (POST) - handle vendor utterance', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/voice-calls/${callId}/simulate-speech`)
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .send({ text: 'Yes, trailer available.' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.state).toBeDefined();
    expect(res.body.data.speech).toBeDefined();

    const transcripts = await prisma.callTranscript.findMany({ where: { callId } });
    expect(transcripts.length).toBeGreaterThan(0);
    
    // Continue conversation until endCall is true
    const res2 = await request(app.getHttpServer())
      .post(`/api/voice-calls/${callId}/simulate-speech`)
      .set('Authorization', `Bearer ${tokenMarketing}`)
      .send({ text: '78,000 rupees.' })
      .expect(201);
      
    expect(res2.body.data.endCall).toBe(true);
    
    // Orchestrator completes call
    await app.get(CallOrchestratorService).handleCallCompleted(callId, 'COMPLETED');
    
    const outcome = await prisma.callOutcome.findUnique({ where: { callId } });
    expect(outcome).toBeDefined();
    expect(outcome?.outcome).toBe('QUOTE_RECEIVED');
    
    const extraction = await prisma.callExtraction.findUnique({ where: { callId } });
    expect(extraction?.quotedAmount).toBe(78000);
  });
});
