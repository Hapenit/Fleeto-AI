import { Module } from '@nestjs/common';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { RequirementsModule } from '../requirements/requirements.module.js';

@Module({
  imports: [RequirementsModule],
  controllers: [AiController],
  providers: [AiService, GeminiProvider],
  exports: [AiService]
})
export class AiModule {}
