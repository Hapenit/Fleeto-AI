import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { CanActivate } from '@nestjs/common';

describe('Admin / Module 16 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testUserId = 'test-admin-id';

  beforeAll(async () => {
    const mockAuthGuard: CanActivate = {
      canActivate: (context) => {
        const req = context.switchToHttp().getRequest();
        req.user = { userId: testUserId, role: 'ADMIN' };
        return true;
      },
    };

    const mockRolesGuard: CanActivate = {
      canActivate: (context) => {
        const req = context.switchToHttp().getRequest();
        return req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Setup initial data if needed
    await prisma.aIProviderConfig.create({
      data: {
        id: 'test-provider',
        provider: 'GEMINI',
        displayName: 'Google Gemini',
        enabled: true,
      }
    });

    await prisma.voiceConfig.create({
      data: {
        id: 'test-voice',
        language: 'EN',
        sttProvider: 'TEST_STT',
        ttsProvider: 'TEST_TTS',
      }
    });
  });

  afterAll(async () => {
    await prisma.aIProviderConfig.deleteMany({ where: { id: 'test-provider' } });
    await prisma.voiceConfig.deleteMany({ where: { id: 'test-voice' } });
    await app.close();
  });

  it('/api/admin/ai/providers (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/ai/providers')
      .expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].provider).toBe('GEMINI');
  });

  it('/api/admin/config/voice (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/config/voice')
      .expect(200);
    expect(res.body.sttProvider).toBe('TEST_STT');
  });

  it('/api/admin/analytics/dashboard (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/analytics/dashboard')
      .expect(200);
    expect(res.body).toHaveProperty('requirementsToday');
    expect(res.body).toHaveProperty('callsCompleted');
  });

  it('/api/admin/system-health (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/system-health')
      .expect(200);
    expect(res.body.PostgreSQL).toBe('HEALTHY');
    expect(res.body.Gemini).toBe('HEALTHY');
  });
});
