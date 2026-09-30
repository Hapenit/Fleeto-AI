import { Module } from '@nestjs/common';
import { RequirementsController } from './requirements.controller.js';
import { RequirementsService } from './requirements.service.js';
import { RequirementValidationService } from './requirement-validation.service.js';
import { RequirementStatusService } from './requirement-status.service.js';
import { RequirementNumberService } from './requirement-number.service.js';

@Module({
  controllers: [RequirementsController],
  providers: [
    RequirementsService,
    RequirementValidationService,
    RequirementStatusService,
    RequirementNumberService,
  ],
  exports: [RequirementsService, RequirementValidationService, RequirementStatusService],
})
export class RequirementsModule {}
