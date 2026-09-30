import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class SystemHealthService {
  private readonly logger = new Logger(SystemHealthService.name);

  constructor(private prisma: PrismaService) {}

  async isDatabaseAvailable(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      this.logger.warn('Database readiness check failed');
      return false;
    }
  }

  async checkHealth() {
    const databaseAvailable = await this.isDatabaseAvailable();

    return {
      PostgreSQL: databaseAvailable ? 'HEALTHY' : 'UNAVAILABLE',
      Gemini: process.env.GEMINI_API_KEY || process.env.CONVERSATION_AI_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
      SarvamSTT: process.env.SARVAM_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
      SarvamTTS: process.env.SARVAM_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
      Exotel: (process.env.EXOTEL_SID && process.env.EXOTEL_API_KEY && process.env.EXOTEL_API_TOKEN) ? 'CONFIGURED' : 'NOT_CONFIGURED',
      WebSocket: 'AVAILABLE',
    };
  }
}
