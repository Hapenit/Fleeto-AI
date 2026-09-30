import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { QuotationsController } from './quotations.controller.js';
import { QuotationsService } from './quotations.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [QuotationsController],
  providers: [QuotationsService],
  exports: [QuotationsService]
})
export class QuotationsModule {}
