import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { IAIProvider, RequirementExtractionInput } from './ai-provider.interface.js';
import { AIExtractionResult } from '../dto/ai.dto.js';

@Injectable()
export class GeminiProvider implements IAIProvider {
  private ai: GoogleGenAI;
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  private readonly promptVersion = 'requirement-extraction-v1';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not configured.');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  getProviderName(): string {
    return 'Gemini';
  }

  getModelName(): string {
    return this.modelName;
  }

  getPromptVersion(): string {
    return this.promptVersion;
  }

  async extractRequirement(input: RequirementExtractionInput): Promise<AIExtractionResult> {
    const systemInstruction = `
You are an AI transportation requirement extraction assistant.

Your job is to convert natural-language transportation requirements into structured procurement data.

Rules:
1. Extract only information explicitly stated or strongly implied.
2. Never invent missing information.
3. Do not guess vehicle type.
4. Do not guess cargo weight.
5. Do not guess budget.
6. Do not guess dates when the date is ambiguous.
7. Identify ambiguous information.
8. Identify missing mandatory information.
9. Normalize units (e.g. TON, KG, GRAM).
10. Normalize currency (e.g. INR).
11. Return valid structured JSON only.
12. Do not make vendor recommendations.
13. Do not make procurement decisions.
14. Do not calculate vendor pricing.
15. Preserve important customer notes.
16. Use the current application date when resolving relative dates, but include the resolved date explicitly in YYYY-MM-DD format.
17. If a relative date is ambiguous, mark it as ambiguous instead of guessing.

Current Context:
Date: ${input.currentDate}
Timezone: ${input.timezone}
`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        extractedData: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING },
            customerCompany: { type: Type.STRING },
            pickupLocation: { type: Type.STRING },
            deliveryLocation: { type: Type.STRING },
            pickupDate: { type: Type.STRING, description: 'YYYY-MM-DD format' },
            deliveryDeadline: { type: Type.STRING, description: 'YYYY-MM-DD format' },
            cargoType: { type: Type.STRING },
            cargoWeight: { type: Type.NUMBER },
            cargoWeightUnit: { type: Type.STRING, enum: ['KG', 'TON', 'GRAM'] },
            cargoQuantity: { type: Type.INTEGER },
            cargoQuantityUnit: { type: Type.STRING, enum: ['UNIT', 'PALLET', 'BOX', 'CONTAINER', 'LOAD', 'OTHER'] },
            vehicleType: { type: Type.STRING },
            specialHandlingRequired: { type: Type.BOOLEAN },
            specialHandlingDetails: { type: Type.STRING },
            loadingRequired: { type: Type.BOOLEAN },
            unloadingRequired: { type: Type.BOOLEAN },
            budget: { type: Type.NUMBER },
            budgetCurrency: { type: Type.STRING, enum: ['INR'] },
            additionalNotes: { type: Type.STRING },
          },
        },
        missingFields: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of mandatory fields (like vehicleType, pickupDate, pickupLocation, deliveryLocation, cargoWeight) that are missing.'
        },
        ambiguities: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of ambiguities found in the text.'
        },
        confidence: {
          type: Type.NUMBER,
          description: 'Confidence score between 0.0 and 1.0'
        },
        summary: {
          type: Type.STRING,
          description: 'Concise human-readable summary of the requirement.'
        }
      },
      required: ['extractedData', 'missingFields', 'ambiguities', 'confidence', 'summary']
    };

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: input.text,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.1,
        }
      });

      const text = response?.text?.trim();
      if (!text) {
        throw new Error('Empty response from AI model');
      }

      return JSON.parse(text) as AIExtractionResult;
    } catch (error) {
      this.logger.error('Failed to extract requirement with Gemini', error);
      throw new InternalServerErrorException('AI processing failed.');
    }
  }
}
