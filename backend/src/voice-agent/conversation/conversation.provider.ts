export const CONVERSATION_PROVIDER_TOKEN = 'ConversationProvider';

export interface ConversationContext {
  requirementContext: any;
  vendorContext: any;
  conversationHistory: { speaker: string; text: string }[];
  currentState: string;
}

export interface ConversationResponse {
  speech: string;
  state: string;
  intent: string;
  extraction: Record<string, any>;
  nextAction: string;
  endCall: boolean;
}

export interface ConversationProvider {
  generateResponse(context: ConversationContext): Promise<ConversationResponse>;
}
