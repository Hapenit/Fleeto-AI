import { Injectable, Logger } from '@nestjs/common';
import { ConversationAnalysisResult } from '../types/index.js';

@Injectable()
export class EvidenceValidatorService {
  private readonly logger = new Logger(EvidenceValidatorService.name);

  validateEvidence(
    analysis: ConversationAnalysisResult,
    transcripts: any[]
  ): { isValid: boolean; invalidSequences: number[] } {
    const validSequences = new Set(transcripts.map(t => t.sequenceNumber));
    const usedSequences = new Set<number>();

    const checkAndAdd = (seqs: number[]) => {
      if (seqs) {
        seqs.forEach(seq => usedSequences.add(seq));
      }
    };

    analysis.objections.forEach(obj => checkAndAdd(obj.evidenceSequenceNumbers));
    analysis.conditions.forEach(cond => checkAndAdd(cond.evidenceSequenceNumbers));
    analysis.unansweredQuestions.forEach(uq => checkAndAdd(uq.evidenceSequenceNumbers));
    analysis.negotiationSignals.forEach(ns => checkAndAdd(ns.evidenceSequenceNumbers));
    analysis.risks.forEach(r => checkAndAdd(r.evidenceSequenceNumbers));

    const invalidSequences: number[] = [];
    for (const seq of usedSequences) {
      if (!validSequences.has(seq)) {
        invalidSequences.push(seq);
      }
    }

    if (invalidSequences.length > 0) {
      this.logger.warn(`Invalid evidence sequences detected: ${invalidSequences.join(', ')}`);
      return { isValid: false, invalidSequences };
    }

    return { isValid: true, invalidSequences: [] };
  }
}
