import { Module } from '@nestjs/common';
import { SystemConfigService } from './services/system-config.service.js';
import { SystemConfigController } from './controllers/system-config.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
