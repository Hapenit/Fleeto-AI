import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { NegotiationController } from './negotiation.controller.js';
import { NegotiationPolicyService } from './policy/negotiation-policy.service.js';
import { NegotiationEngineService } from './engine/negotiation-engine.service.js';
import { PolicyValidatorService } from './policy/policy-validator.service.js';
import { NEGOTIATION_AI_PROVIDER } from './providers/negotiation-ai-provider.interface.js';
import { GeminiNegotiationProvider } from './providers/gemini-negotiation.provider.js';

@Module({
  imports: [PrismaModule],
  controllers: [NegotiationController],
  providers: [
    NegotiationPolicyService,
    NegotiationEngineService,
    PolicyValidatorService,
    {
      provide: NEGOTIATION_AI_PROVIDER,
      useClass: GeminiNegotiationProvider
    }
  ],
  exports: [NegotiationEngineService]
})
export class NegotiationModule {}
