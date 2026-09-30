import { Injectable, Logger } from '@nestjs/common';
import { ConversationResponse } from './conversation.provider.js';

@Injectable()
export class ConversationPolicyService {
  private readonly logger = new Logger(ConversationPolicyService.name);

  validateAction(response: ConversationResponse): ConversationResponse {
    // Prevent the LLM from making unauthorized decisions
    
    // Example: The LLM should not book the vendor
    if (response.nextAction === 'BOOK_VENDOR' || response.intent === 'VENDOR_BOOKED') {
      this.logger.warn('LLM attempted unauthorized action: BOOK_VENDOR. Replacing with safe fallback.');
      return {
        ...response,
        speech: "இந்த விஷயத்தை Fleeto team confirm பண்ணி சொல்லுவாங்க சார். நான் update பண்ணிக்கிறேன்.",
        nextAction: 'ESCALATION',
        endCall: true,
      };
    }

    // Ensure quoted amount is positive if present
    if (response.extraction?.quotedAmount !== undefined && response.extraction.quotedAmount !== null) {
      if (response.extraction.quotedAmount <= 0) {
        this.logger.warn('LLM provided invalid quote amount. Setting to null.');
        response.extraction.quotedAmount = null;
      }
    }

    // Default: allow action
    return response;
  }
}
