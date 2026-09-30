import { z } from 'zod';

export const ConversationAnalysisSchema = z.object({
  summary: z.string(),

  vendorInterest: z.enum([
    "INTERESTED",
    "MAYBE_INTERESTED",
    "NOT_INTERESTED",
    "UNAVAILABLE",
    "CALLBACK_REQUESTED",
    "UNKNOWN"
  ]),

  availabilityStatus: z.enum([
    "AVAILABLE",
    "NOT_AVAILABLE",
    "PARTIALLY_AVAILABLE",
    "CALLBACK_REQUIRED",
    "UNKNOWN"
  ]),

  quote: z.object({
    amount: z.number().nullable(),
    currency: z.string().nullable(),
    status: z.string()
  }),

  objections: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      evidenceSequenceNumbers: z.array(z.number())
    })
  ),

  conditions: z.array(
    z.object({
      description: z.string(),
      evidenceSequenceNumbers: z.array(z.number())
    })
  ),

  unansweredQuestions: z.array(
    z.object({
      question: z.string(),
      evidenceSequenceNumbers: z.array(z.number())
    })
  ),

  negotiationSignals: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      explicit: z.boolean(),
      evidenceSequenceNumbers: z.array(z.number())
    })
  ),

  risks: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      severity: z.enum(["INFO", "LOW", "MEDIUM", "HIGH"]),
      evidenceSequenceNumbers: z.array(z.number())
    })
  ),

  confidence: z.number().min(0).max(1)
});

export type ConversationAnalysisOutput = z.infer<typeof ConversationAnalysisSchema>;
