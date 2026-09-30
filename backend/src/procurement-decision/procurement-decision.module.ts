import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProcurementDecisionController } from './controllers/procurement-decision.controller.js';
import { ProcurementSelectionService } from './services/procurement-selection.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ProcurementDecisionController],
  providers: [ProcurementSelectionService],
  exports: [ProcurementSelectionService]
})
export class ProcurementDecisionModule {}
