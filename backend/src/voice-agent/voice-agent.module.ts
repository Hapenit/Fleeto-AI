import { Module } from '@nestjs/common';
import { VoiceAgentController } from './voice-agent.controller.js';
import { VoiceAgentService } from './voice-agent.service.js';
import { CallOrchestratorService } from './call-orchestrator.service.js';
import { CallSessionService } from './call-session.service.js';
import { ConversationEngineService } from './conversation-engine.service.js';
import { ConversationPolicyService } from './conversation/conversation-policy.service.js';
import { TELEPHONY_PROVIDER_TOKEN } from './telephony/telephony.provider.js';
import { ExotelProvider } from './telephony/exotel.provider.js';
import { SPEECH_TO_TEXT_PROVIDER_TOKEN } from './speech/speech-to-text.provider.js';
import { SarvamSTTProvider } from './speech/sarvam-stt.provider.js';
import { TEXT_TO_SPEECH_PROVIDER_TOKEN } from './speech/text-to-speech.provider.js';
import { SarvamTTSProvider } from './speech/sarvam-tts.provider.js';
import { CONVERSATION_PROVIDER_TOKEN } from './conversation/conversation.provider.js';
import { SarvamConversationProvider } from './conversation/sarvam-conversation.provider.js';
import { LiveVoiceModule } from '../live-voice/live-voice.module.js';

@Module({
  imports: [LiveVoiceModule],
  controllers: [VoiceAgentController],
  providers: [
    VoiceAgentService,
    CallOrchestratorService,
    CallSessionService,
    ConversationEngineService,
    ConversationPolicyService,
    {
      provide: TELEPHONY_PROVIDER_TOKEN,
      useClass: ExotelProvider,
    },
    {
      provide: SPEECH_TO_TEXT_PROVIDER_TOKEN,
      useClass: SarvamSTTProvider,
    },
    {
      provide: TEXT_TO_SPEECH_PROVIDER_TOKEN,
      useClass: SarvamTTSProvider,
    },
    {
      provide: CONVERSATION_PROVIDER_TOKEN,
      useClass: SarvamConversationProvider,
    },
  ],
  exports: [VoiceAgentService]
})
export class VoiceAgentModule {}
