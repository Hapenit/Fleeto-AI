import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AI_ANALYSIS_PROVIDER_TOKEN } from './providers/ai-analysis-provider.interface.js';
import type { AIAnalysisProvider } from './providers/ai-analysis-provider.interface.js';
import { EvidenceValidatorService } from './analysis/evidence-validator.service.js';
import type { ConversationAnalysisInput } from './types/index.js';

@Injectable()
export class ConversationAnalysisService {
  private readonly logger = new Logger(ConversationAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_ANALYSIS_PROVIDER_TOKEN)
    private readonly aiProvider: AIAnalysisProvider,
    private readonly evidenceValidator: EvidenceValidatorService
  ) {}

  async requestAnalysis(callId: string) {
    const call = await this.prisma.voiceCall.findUnique({
      where: { id: callId },
      include: { requirement: true, vendor: true, extraction: true, transcripts: { orderBy: { sequenceNumber: 'asc' } } }
    });

    if (!call) throw new NotFoundException('Call not found');

    // Return existing processing run if active
    let analysis = await this.prisma.conversationAnalysis.findUnique({
      where: { callId }
    });

    if (analysis && (analysis.status === 'PROCESSING' || analysis.status === 'PENDING')) {
      return { analysisId: analysis.id, status: analysis.status };
    }

    if (!analysis) {
      analysis = await this.prisma.conversationAnalysis.create({
        data: {
          callId,
          requirementId: call.requirementId,
          vendorId: call.vendorId,
          status: 'PENDING',
          analysisVersion: '1.0.0',
          provider: 'pending',
          model: 'pending',
        }
      });
    } else {
      analysis = await this.prisma.conversationAnalysis.update({
        where: { id: analysis.id },
        data: { status: 'PENDING' }
      });
    }

    // Trigger async processing
    this.processAnalysis(analysis.id, call).catch(e => {
      this.logger.error(`Background analysis failed: ${e.message}`, e.stack);
    });

    return { analysisId: analysis.id, status: 'PROCESSING' };
  }

  async processAnalysis(analysisId: string, call: any) {
    // 1. Mark as processing
    await this.prisma.conversationAnalysis.update({
      where: { id: analysisId },
      data: { status: 'PROCESSING' }
    });

    let run: any = null;
    try {
      const input: ConversationAnalysisInput = {
        callId: call.id,
        requirement: call.requirement,
        vendor: call.vendor,
        extraction: call.extraction?.rawExtraction || {},
        transcripts: call.transcripts.map((t: any) => ({
          sequenceNumber: t.sequenceNumber,
          speaker: t.speaker,
          text: t.text,
          startTime: t.startTime,
          endTime: t.endTime,
        }))
      };

      // Create Run Record
      run = await this.prisma.conversationAnalysisRun.create({
        data: {
          analysisId,
          provider: 'gemini',
          model: process.env.AI_ANALYSIS_MODEL || 'gemini-2.5-flash',
          promptVersion: 'conversation-analysis-v1',
          status: 'RUNNING',
          startedAt: new Date()
        }
      });

      // 2. Call AI Provider
      const result = await this.aiProvider.analyzeConversation(input);

      // 3. Evidence Validation
      const { isValid, invalidSequences } = this.evidenceValidator.validateEvidence(result, input.transcripts);
      
      const finalStatus = isValid ? 'COMPLETED' : 'NEEDS_REVIEW';

      // 4. Persist to Database
      await this.prisma.$transaction(async (tx) => {
        // Update analysis record
        await tx.conversationAnalysis.update({
          where: { id: analysisId },
          data: {
            status: finalStatus,
            provider: result.provider,
            model: result.model,
            overallSummary: result.summary,
            vendorInterest: result.vendorInterest as any,
            availabilityStatus: result.availabilityStatus as any,
            quoteAmount: result.quote.amount,
            quoteCurrency: result.quote.currency,
            quoteStatus: result.quote.status,
            analysisConfidence: result.confidence,
            completedAt: new Date()
          }
        });

        // Delete old findings
        await tx.conversationFinding.deleteMany({ where: { analysisId } });

        // Helper to insert findings and evidence
        const insertFindings = async (items: any[], type: string, severity: string = 'INFO') => {
          for (const item of items) {
            const explicit = item.explicit || false;
            const finding = await tx.conversationFinding.create({
              data: {
                analysisId,
                type: item.type || type,
                description: item.description || item.question || '', // Fallback for unansweredQuestions
                severity: (item.severity || severity) as any,
                explicit
              }
            });

            // Map evidence
            if (item.evidenceSequenceNumbers && Array.isArray(item.evidenceSequenceNumbers)) {
              for (const seq of item.evidenceSequenceNumbers) {
                const transcript = call.transcripts.find((t: any) => t.sequenceNumber === seq);
                if (transcript) {
                  await tx.conversationFindingEvidence.create({
                    data: {
                      findingId: finding.id,
                      transcriptId: transcript.id,
                      sequenceNumber: seq,
                      quotedText: transcript.text
                    }
                  });
                }
              }
            }
          }
        };

        await insertFindings(result.objections, 'OBJECTION', 'MEDIUM');
        await insertFindings(result.conditions, 'CONDITION', 'INFO');
        await insertFindings(result.unansweredQuestions, 'UNANSWERED_QUESTION', 'LOW');
        await insertFindings(result.negotiationSignals, 'NEGOTIATION_SIGNAL', 'INFO');
        await insertFindings(result.risks, 'RISK'); // risks have severity specified

        // Update run
        await tx.conversationAnalysisRun.update({
          where: { id: run.id },
          data: { status: 'COMPLETED', completedAt: new Date() }
        });
      });

    } catch (err: any) {
      this.logger.error(`Failed to analyze conversation for call ${call.id}`, err.stack);
      await this.prisma.conversationAnalysis.update({
        where: { id: analysisId },
        data: { status: 'FAILED' }
      });

      if (run) {
        await this.prisma.conversationAnalysisRun.update({
          where: { id: run.id },
          data: { status: 'FAILED', errorCode: 'AI_ERROR', errorMessage: err.message, completedAt: new Date() }
        });
      }
    }
  }

  async getAnalysisByCallId(callId: string) {
    return this.prisma.conversationAnalysis.findUnique({
      where: { callId },
      include: {
        findings: {
          include: { evidence: true }
        },
        call: {
          include: { vendor: true, requirement: true }
        }
      }
    });
  }
}
