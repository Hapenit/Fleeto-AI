import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { AIAnalysisProvider } from './ai-analysis-provider.interface.js';
import { ConversationAnalysisInput, ConversationAnalysisResult } from '../types/index.js';
import { ConversationAnalysisSchema } from '../schemas/conversation-analysis.schema.js';

@Injectable()
export class GeminiAnalysisProvider implements AIAnalysisProvider {
  private ai: GoogleGenAI | null = null;
  private readonly logger = new Logger(GeminiAnalysisProvider.name);
  private readonly modelName = process.env.AI_ANALYSIS_MODEL || 'gemini-2.5-flash';
  private readonly promptVersion = 'conversation-analysis-v1';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.CONVERSATION_AI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      this.logger.warn('No Gemini API Key found for Analysis');
    }
  }

  // Create GenAI schema representation from our Zod schema conceptually
  private getResponseSchema(): Schema {
    return {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        vendorInterest: { type: Type.STRING, enum: ["INTERESTED", "MAYBE_INTERESTED", "NOT_INTERESTED", "UNAVAILABLE", "CALLBACK_REQUESTED", "UNKNOWN"] },
        availabilityStatus: { type: Type.STRING, enum: ["AVAILABLE", "NOT_AVAILABLE", "PARTIALLY_AVAILABLE", "CALLBACK_REQUIRED", "UNKNOWN"] },
        quote: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER, nullable: true },
            currency: { type: Type.STRING, nullable: true },
            status: { type: Type.STRING }
          },
          required: ["status"]
        },
        objections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              description: { type: Type.STRING },
              evidenceSequenceNumbers: { type: Type.ARRAY, items: { type: Type.INTEGER } }
            },
            required: ["type", "description", "evidenceSequenceNumbers"]
          }
        },
        conditions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              evidenceSequenceNumbers: { type: Type.ARRAY, items: { type: Type.INTEGER } }
            },
            required: ["description", "evidenceSequenceNumbers"]
          }
        },
        unansweredQuestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              evidenceSequenceNumbers: { type: Type.ARRAY, items: { type: Type.INTEGER } }
            },
            required: ["question", "evidenceSequenceNumbers"]
          }
        },
        negotiationSignals: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              description: { type: Type.STRING },
              explicit: { type: Type.BOOLEAN },
              evidenceSequenceNumbers: { type: Type.ARRAY, items: { type: Type.INTEGER } }
            },
            required: ["type", "description", "explicit", "evidenceSequenceNumbers"]
          }
        },
        risks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              description: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ["INFO", "LOW", "MEDIUM", "HIGH"] },
              evidenceSequenceNumbers: { type: Type.ARRAY, items: { type: Type.INTEGER } }
            },
            required: ["type", "description", "severity", "evidenceSequenceNumbers"]
          }
        },
        confidence: { type: Type.NUMBER }
      },
      required: [
        "summary", "vendorInterest", "availabilityStatus", "quote",
        "objections", "conditions", "unansweredQuestions", "negotiationSignals", "risks", "confidence"
      ]
    };
  }

  async analyzeConversation(input: ConversationAnalysisInput): Promise<ConversationAnalysisResult> {
    const prompt = `You are a procurement conversation analysis assistant for Fleeto.

Analyze only the supplied requirement, vendor information, call metadata, structured extraction and transcript.
Do not invent facts. Do not assume facts that are not explicitly stated.
Do not select or rank vendors. Do not recommend which vendor should be selected.
Do not negotiate. Do not approve quotations. Do not make commitments.
Distinguish explicit statements from interpretations.
Every important finding must reference transcript sequence numbers as evidence (e.g., [4, 5]).
If information is missing, return UNKNOWN or mark it as unanswered.
If the transcript contains contradictory information, report the contradiction as a RISK.
Do not treat sentiment as vendor quality or reliability.

Input Data:
Requirement: ${JSON.stringify(input.requirement, null, 2)}
Vendor: ${JSON.stringify(input.vendor, null, 2)}
Live Extraction: ${JSON.stringify(input.extraction, null, 2)}

Transcript:
${input.transcripts.map(t => `[Seq: ${t.sequenceNumber}] ${t.speaker}: ${t.text}`).join('\n')}`;



    try {
      if (!this.ai) {
        throw new Error('Gemini AI client is unavailable');
      }
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: this.getResponseSchema(),
          temperature: 0.1,
        }
      });

      const text = response?.text || '{}';
      const parsed = JSON.parse(text);
      const validated = ConversationAnalysisSchema.parse(parsed);

      return {
        ...validated,
        provider: 'gemini',
        model: this.modelName,
        promptVersion: this.promptVersion,
      };
    } catch (err: any) {
      this.logger.error(`Gemini analysis failed: ${err.message}`);
      throw err;
    }
  }
}
