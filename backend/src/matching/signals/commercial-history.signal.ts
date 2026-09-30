import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration } from '@prisma/client';

export class CommercialHistorySignal implements MatchingSignal {
  code = 'MATCH-008';
  name = 'Commercial History';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.commercialWeight;
    
    // For POC, we might lack requirement budget or vendor average price.
    // If either is missing, return NOT_AVAILABLE.
    if (!vendor.performance?.averageFinalPrice || !requirement.budget) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.NOT_AVAILABLE, reason: 'Historical price or budget unavailable.' };
    }

    const avgPrice = vendor.performance.averageFinalPrice;
    const budget = requirement.budget;

    if (avgPrice <= budget) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 100, normalizedScore: weight, status: MatchFactorStatus.PASS, reason: 'Historical price within budget.' };
    }

    const ratio = Math.max(0, 100 - ((avgPrice - budget) / budget * 100));
    return { factorCode: this.code, factorName: this.name, weight, rawScore: Math.round(ratio), normalizedScore: weight * (ratio / 100), status: MatchFactorStatus.PARTIAL, reason: 'Historical price exceeds budget.' };
  }
}