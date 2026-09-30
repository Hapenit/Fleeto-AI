import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { QuotationComparisonController } from './quotation-comparison.controller.js';
import { ComparisonEngineService } from './engine/comparison-engine.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [QuotationComparisonController],
  providers: [ComparisonEngineService],
  exports: [ComparisonEngineService]
})
export class QuotationComparisonModule {}
