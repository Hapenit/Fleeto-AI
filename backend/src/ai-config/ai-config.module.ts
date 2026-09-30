import { Module } from '@nestjs/common';
import { AiConfigService } from './services/ai-config.service.js';
import { AiConfigController } from './controllers/ai-config.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AiConfigController],
  providers: [AiConfigService],
  exports: [AiConfigService],
})
export class AiConfigModule {}
