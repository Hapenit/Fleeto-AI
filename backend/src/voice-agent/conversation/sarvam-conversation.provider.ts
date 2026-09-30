import { Injectable, Logger } from '@nestjs/common';
import { ConversationProvider, ConversationContext, ConversationResponse } from './conversation.provider.js';
import { SarvamAIClient } from 'sarvamai';

@Injectable()
export class SarvamConversationProvider implements ConversationProvider {
  private readonly logger = new Logger(SarvamConversationProvider.name);
  private readonly client: SarvamAIClient;

  constructor() {
    // The SDK automatically picks up SARVAM_API_KEY from environment or uses token
    this.client = new SarvamAIClient({});
  }

  async generateResponse(context: ConversationContext): Promise<ConversationResponse> {
    try {
      const prompt = this.buildPrompt(context);
      
      this.logger.log(`Calling Sarvam 105B Conversations for state: ${context.currentState}`);

      const response = await this.client.chat.completions({
        model: 'sarvam-105b-conversations',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: "Generate the JSON response for the next turn." }
        ],
        temperature: 0.1, // Keep it deterministic for JSON structure
      } as any);

      const text = (response as any).choices[0]?.message?.content ?? '';
      
      // Cleanup markdown block if present
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();      
      const parsed = JSON.parse(jsonStr);
      
      return {
        speech: parsed.speech || "மன்னிக்கணும் சார், technical issue இருக்கு.",
        state: parsed.state || context.currentState,
        intent: parsed.intent || "UNKNOWN",
        extraction: parsed.extraction || {},
        nextAction: parsed.nextAction || "",
        endCall: parsed.endCall || false,
      };
    } catch (error) {
      this.logger.error('Failed to generate Sarvam AI response', error);
      throw error;
    }
  }

  private buildPrompt(context: ConversationContext): string {
    return `
You are Fleeto's transport procurement voice assistant.
Your job is to contact transport vendors and collect availability, vehicle confirmation, quotation, delivery capability, and relevant commercial conditions.

Requirement Context:
${JSON.stringify(context.requirementContext, null, 2)}

Vendor Context:
${JSON.stringify(context.vendorContext, null, 2)}

Current Conversation State: ${context.currentState}

Conversation History:
${context.conversationHistory.map(h => `${h.speaker}: ${h.text}`).join('\n')}

Respond with a JSON object ONLY:
{
  "speech": "Your text to speak to the vendor in Tamil/Tanglish/English",
  "state": "The new state of the conversation (INTRODUCTION, LANGUAGE_CONFIRMATION, REQUIREMENT_CONFIRMATION, AVAILABILITY_CHECK, VEHICLE_CONFIRMATION, PRICE_REQUEST, DELIVERY_CONFIRMATION, CONDITIONS_CHECK, FINAL_CONFIRMATION, GOODBYE, ESCALATION)",
  "intent": "The identified intent of the vendor's last response",
  "extraction": {
     "vendorAvailable": boolean | null,
     "vehicleAvailable": boolean | null,
     "quotedAmount": number | null,
     "currency": "INR",
     "pickupConfirmation": boolean | null,
     "deliveryConfirmation": boolean | null,
     "estimatedDeliveryTime": string | null
  },
  "nextAction": "What the system should do next",
  "endCall": boolean
}
`;
  }
}

