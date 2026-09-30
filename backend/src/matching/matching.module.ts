import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service.js';
import { MatchingController, RequirementMatchingController, OutreachController, AdminMatchingConfigurationController } from './matching.controller.js';

@Module({
  controllers: [MatchingController, RequirementMatchingController, OutreachController, AdminMatchingConfigurationController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
