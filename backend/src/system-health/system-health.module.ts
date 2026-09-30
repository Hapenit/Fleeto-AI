import { Module } from '@nestjs/common';
import { SystemHealthService } from './services/system-health.service.js';
import { SystemHealthController } from './controllers/system-health.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [SystemHealthController],
  providers: [SystemHealthService],
  exports: [SystemHealthService],
})
export class SystemHealthModule {}
