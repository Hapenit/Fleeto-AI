export interface NegotiationContext {
  requirement: {
    pickupLocation: string;
    deliveryLocation: string;
    cargoType: string;
    cargoWeight: number;
    vehicleType: string;
    pickupDate: string;
  };

  vendor: {
    preferredLanguage: string;
  };

  currentQuote: {
    amount: number;
    currency: string;
  };

  policy: {
    targetPrice: number;
    maximumAuthorizedPrice: number;
    maxAttempts: number;
  };

  analysis: {
    objections: any[];
    conditions: any[];
    negotiationSignals: any[];
  };

  conversation: {
    recentTranscript: any[];
  };
}

export interface NegotiationProposal {
  action: 'ASK_FOR_BETTER_PRICE' | 'MAKE_COUNTER_OFFER' | 'ACCEPT_VENDOR_PRICE' | 'ASK_CLARIFICATION' | 'STOP_NEGOTIATION' | 'ESCALATE';
  proposedAmount: number | null;
  currency: string | null;
  speech: string;
  reason: string;
  requiresApproval: boolean;
  evidenceSequenceNumbers: number[];
  confidence: number;
}

export const NEGOTIATION_AI_PROVIDER = 'NEGOTIATION_AI_PROVIDER';

export interface NegotiationAIProvider {
  generateProposal(context: NegotiationContext): Promise<NegotiationProposal>;
}
