import { Module } from '@nestjs/common';
import { EligibilityService } from './eligibility.service.js';
import { EligibilityController, RequirementEligibilityController } from './eligibility.controller.js';

@Module({
  controllers: [EligibilityController, RequirementEligibilityController],
  providers: [EligibilityService],
  exports: [EligibilityService],
})
export class EligibilityModule {}
