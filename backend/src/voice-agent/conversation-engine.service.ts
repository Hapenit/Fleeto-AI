import { Injectable, Logger, Inject } from '@nestjs/common';
import { CONVERSATION_PROVIDER_TOKEN } from './conversation/conversation.provider.js';
import type { ConversationProvider, ConversationContext } from './conversation/conversation.provider.js';
import { ConversationPolicyService } from './conversation/conversation-policy.service.js';
import { CallSessionService } from './call-session.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ConversationEngineService {
  private readonly logger = new Logger(ConversationEngineService.name);

  constructor(
    @Inject(CONVERSATION_PROVIDER_TOKEN)
    private readonly provider: ConversationProvider,
    private readonly policyService: ConversationPolicyService,
    private readonly sessionService: CallSessionService,
    private readonly prisma: PrismaService
  ) {}

  async processVendorUtterance(callId: string, vendorText: string) {
    this.logger.log(`Processing vendor utterance for call ${callId}: ${vendorText}`);
    
    const call = await this.prisma.voiceCall.findUnique({
      where: { id: callId },
      include: {
        requirement: true,
        vendor: true,
        session: true,
      }
    });

    if (!call || !call.session) {
      throw new Error(`Call or session not found for ${callId}`);
    }

    const transcripts = await this.sessionService.getTranscripts(callId);
    
    // 1. Record vendor text
    const nextSeq = transcripts.length + 1;
    await this.sessionService.addTranscript(callId, 'VENDOR', vendorText, nextSeq);
    await this.sessionService.addEvent(callId, 'VENDOR_SPEECH_DETECTED', { text: vendorText });

    // 2. Build context
    const context: ConversationContext = {
      requirementContext: call.requirement,
      vendorContext: call.vendor,
      conversationHistory: [...transcripts.map(t => ({ speaker: t.speaker, text: t.text })), { speaker: 'VENDOR', text: vendorText }],
      currentState: call.session.currentState,
    };

    // 3. Generate response
    const rawResponse = await this.provider.generateResponse(context);
    
    // 4. Validate through policy
    const safeResponse = this.policyService.validateAction(rawResponse);

    // 5. Update session state
    await this.sessionService.updateSessionState(callId, safeResponse.state, 1);
    
    // 6. Record AI text
    await this.sessionService.addTranscript(callId, 'AI', safeResponse.speech, nextSeq + 1);
    await this.sessionService.addEvent(callId, 'AI_RESPONSE_GENERATED', { speech: safeResponse.speech, state: safeResponse.state, intent: safeResponse.intent });

    // 7. Store any extractions
    if (Object.keys(safeResponse.extraction || {}).length > 0) {
      await this.upsertExtraction(callId, safeResponse.extraction);
    }

    // 8. Handle end call logic if applicable
    if (safeResponse.endCall) {
      await this.prisma.voiceCall.update({
        where: { id: callId },
        data: { status: 'COMPLETING' }
      });
      await this.sessionService.addEvent(callId, 'CALL_COMPLETING');
    }

    return safeResponse;
  }

  async generateGreeting(callId: string) {
    const call = await this.prisma.voiceCall.findUnique({
      where: { id: callId },
      include: { requirement: true, vendor: true, session: true }
    });

    if (!call || !call.session) return null;

    const context: ConversationContext = {
      requirementContext: call.requirement,
      vendorContext: call.vendor,
      conversationHistory: [],
      currentState: 'INTRODUCTION',
    };

    const response = await this.provider.generateResponse(context);
    const safeResponse = this.policyService.validateAction(response);

    await this.sessionService.updateSessionState(callId, safeResponse.state, 1);
    await this.sessionService.addTranscript(callId, 'AI', safeResponse.speech, 1);
    await this.sessionService.addEvent(callId, 'AI_GREETING_STARTED', { speech: safeResponse.speech });

    return safeResponse;
  }

  private async upsertExtraction(callId: string, extractionData: any) {
    const cleanData = {
      vendorAvailable: extractionData.vendorAvailable ?? null,
      vehicleAvailable: extractionData.vehicleAvailable ?? null,
      quotedAmount: extractionData.quotedAmount ?? null,
      currency: extractionData.currency ?? 'INR',
      pickupConfirmation: extractionData.pickupConfirmation ?? null,
      deliveryConfirmation: extractionData.deliveryConfirmation ?? null,
      estimatedDeliveryTime: extractionData.estimatedDeliveryTime ?? null,
    };

    await this.prisma.callExtraction.upsert({
      where: { callId },
      update: cleanData,
      create: { callId, ...cleanData }
    });

    await this.sessionService.addEvent(callId, 'EXTRACTION_UPDATED', cleanData);
  }
}
