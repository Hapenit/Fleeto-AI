import { ConversationAnalysisInput, ConversationAnalysisResult } from '../types/index.js';

export const AI_ANALYSIS_PROVIDER_TOKEN = 'AI_ANALYSIS_PROVIDER_TOKEN';

export interface AIAnalysisProvider {
  analyzeConversation(input: ConversationAnalysisInput): Promise<ConversationAnalysisResult>;
}
