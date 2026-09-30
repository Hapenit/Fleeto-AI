import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SystemHealthService } from './system-health.service.js';

describe('SystemHealthService', () => {
  let service: SystemHealthService;
  const queryRaw = vi.fn();

  beforeEach(async () => {
    queryRaw.mockReset().mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemHealthService,
        { provide: PrismaService, useValue: { $queryRaw: queryRaw } },
      ],
    }).compile();

    service = module.get(SystemHealthService);
  });

  it('reports database availability and does not label mocked providers healthy', async () => {
    const health = await service.checkHealth();

    expect(health).toEqual({
      PostgreSQL: 'HEALTHY',
      Gemini: process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
      SarvamSTT: 'NOT_CONFIGURED',
      SarvamTTS: 'NOT_CONFIGURED',
      Exotel: 'NOT_CONFIGURED',
      WebSocket: 'AVAILABLE',
    });
  });

  it('reports database unavailability when the readiness query fails', async () => {
    queryRaw.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(service.isDatabaseAvailable()).resolves.toBe(false);
  });
});
