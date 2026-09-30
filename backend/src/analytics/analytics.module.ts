import { Module } from '@nestjs/common';
import { AnalyticsService } from './services/analytics.service.js';
import { AnalyticsController } from './controllers/analytics.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
