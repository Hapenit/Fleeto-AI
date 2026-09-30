import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { NegotiationAIProvider, NegotiationContext, NegotiationProposal } from './negotiation-ai-provider.interface.js';
import { NEGOTIATION_AGENT_PROMPT } from '../prompts/negotiation-agent-v1.js';

@Injectable()
export class GeminiNegotiationProvider implements NegotiationAIProvider {
  private ai: GoogleGenAI;
  private readonly logger = new Logger(GeminiNegotiationProvider.name);

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'mock-key' });
  }

  async generateProposal(context: NegotiationContext): Promise<NegotiationProposal> {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing Gemini API key for negotiation");
    }

    try {
      const prompt = `
${NEGOTIATION_AGENT_PROMPT}

INPUT CONTEXT:
${JSON.stringify(context, null, 2)}
      `;

      const response = await this.ai.models.generateContent({
        model: process.env.AI_NEGOTIATION_MODEL || 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });

      const responseText = response.text ?? '{}';
      const parsed = JSON.parse(responseText);

      return parsed as NegotiationProposal;
    } catch (err: any) {
      this.logger.error(`Gemini Negotiation failed: ${err.message}`, err.stack);
      throw new Error(`AI Provider Error: ${err.message}`);
    }
  }
}
