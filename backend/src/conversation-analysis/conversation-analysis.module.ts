import { Module } from '@nestjs/common';
import { ConversationAnalysisController } from './conversation-analysis.controller.js';
import { ConversationAnalysisService } from './conversation-analysis.service.js';
import { EvidenceValidatorService } from './analysis/evidence-validator.service.js';
import { GeminiAnalysisProvider } from './providers/gemini-analysis.provider.js';
import { AI_ANALYSIS_PROVIDER_TOKEN } from './providers/ai-analysis-provider.interface.js';

@Module({
  controllers: [ConversationAnalysisController],
  providers: [
    ConversationAnalysisService,
    EvidenceValidatorService,
    {
      provide: AI_ANALYSIS_PROVIDER_TOKEN,
      useClass: GeminiAnalysisProvider
    }
  ],
  exports: [ConversationAnalysisService]
})
export class ConversationAnalysisModule {}
