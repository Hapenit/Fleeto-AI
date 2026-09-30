import { AIExtractionResult } from '../dto/ai.dto.js';

export interface RequirementExtractionInput {
  text: string;
  currentDate: string;
  timezone: string;
}

export interface IAIProvider {
  getProviderName(): string;
  getModelName(): string;
  getPromptVersion(): string;
  extractRequirement(input: RequirementExtractionInput): Promise<AIExtractionResult>;
}
