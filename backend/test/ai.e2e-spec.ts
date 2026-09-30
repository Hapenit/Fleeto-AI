import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { GeminiProvider } from './../src/ai/providers/gemini.provider.js';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('AiController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let geminiProvider: GeminiProvider;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
    geminiProvider = app.get<GeminiProvider>(GeminiProvider);
    
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'ai-e2e@test.local' },
      update: { passwordHash },
      create: {
        firstName: 'AI-E2E',
        lastName: 'Test',
        email: 'ai-e2e@test.local',
        passwordHash,
        role: Role.MARKETING_USER,
      },
    });
    userId = user.id;

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'ai-e2e@test.local', password: 'password123' })
      .expect(201);
      
    token = res.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.aIRequirementExtraction.deleteMany({ where: { createdById: userId } });
    await prisma.requirement.deleteMany({ where: { createdById: userId } });
    await app.close();
  });

  it('/api/ai/requirements/extract (POST) - basic extraction', async () => {
    // Mock Gemini Provider
    vi.spyOn(geminiProvider, 'extractRequirement').mockResolvedValue({
      extractedData: {
        cargoWeight: 18,
        cargoWeightUnit: 'TON',
        pickupLocation: 'Chennai',
        deliveryLocation: 'Bangalore'
      },
      missingFields: [],
      ambiguities: [],
      confidence: 0.95,
      summary: '18 ton machine from Chennai to Bangalore'
    });

    const res = await request(app.getHttpServer())
      .post('/api/ai/requirements/extract')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inputText: '18 ton machine from Chennai to Bangalore'
      })
      .expect(201);
      
    expect(res.body.success).toBe(true);
    expect(res.body.data.extractedData.cargoWeight).toBe(18);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  it('/api/ai/requirements/extract (POST) - missing data', async () => {
    vi.spyOn(geminiProvider, 'extractRequirement').mockResolvedValue({
      extractedData: {
        cargoWeight: 20,
        cargoWeightUnit: 'TON',
        pickupLocation: 'Chennai',
        deliveryLocation: 'Bangalore'
      },
      missingFields: ['vehicleType', 'pickupDate'],
      ambiguities: [],
      confidence: 0.8,
      summary: 'Move 20 tons from Chennai to Bangalore'
    });

    const res = await request(app.getHttpServer())
      .post('/api/ai/requirements/extract')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inputText: 'Move 20 tons from Chennai to Bangalore'
      })
      .expect(201);
      
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('NEEDS_CLARIFICATION');
    expect(res.body.data.missingFields).toContain('vehicleType');
  });

  it('/api/ai/requirements/extractions/:id/apply (POST) - apply extraction', async () => {
    vi.spyOn(geminiProvider, 'extractRequirement').mockResolvedValue({
      extractedData: {
        cargoWeight: 18,
        cargoWeightUnit: 'TON'
      },
      missingFields: [],
      ambiguities: [],
      confidence: 0.9,
      summary: 'Summary'
    });

    const extRes = await request(app.getHttpServer())
      .post('/api/ai/requirements/extract')
      .set('Authorization', `Bearer ${token}`)
      .send({ inputText: 'test test test test test' }); // Must be >10 chars as per Zod
      
    const extractionId = extRes.body.data.id;

    const res = await request(app.getHttpServer())
      .post(`/api/ai/requirements/extractions/${extractionId}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        acceptedFields: {
          cargoWeight: 18,
          cargoWeightUnit: 'TON'
        }
      })
      .expect(201);
      
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('APPLIED');
    expect(res.body.data.requirementId).toBeDefined();
  });
});
