import { ConversationAnalysisOutput } from '../schemas/conversation-analysis.schema.js';

export interface ConversationAnalysisInput {
  callId: string;
  requirement: any;
  vendor: any;
  extraction: any;
  transcripts: {
    sequenceNumber: number;
    speaker: string;
    text: string;
    startTime: number | null;
    endTime: number | null;
  }[];
}

export interface ConversationAnalysisResult extends ConversationAnalysisOutput {
  provider: string;
  model: string;
  promptVersion: string;
}
