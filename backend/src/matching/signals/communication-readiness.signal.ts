import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration } from '@prisma/client';

export class CommunicationReadinessSignal implements MatchingSignal {
  code = 'MATCH-009';
  name = 'Communication Readiness';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.communicationWeight;
    
    let rawScore = 0;
    if (vendor.callEnabled) rawScore += 50;
    if (vendor.primaryPhone) rawScore += 30;
    if (vendor.preferredLanguage) rawScore += 20;

    const normalizedScore = weight * (rawScore / 100);

    return { factorCode: this.code, factorName: this.name, weight, rawScore, normalizedScore, status: rawScore > 50 ? MatchFactorStatus.PASS : MatchFactorStatus.PARTIAL, reason: 'Calculated communication readiness based on contact info.' };
  }
}