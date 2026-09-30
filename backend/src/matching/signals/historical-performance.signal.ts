import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration } from '@prisma/client';

export class HistoricalPerformanceSignal implements MatchingSignal {
  code = 'MATCH-007';
  name = 'Historical Performance';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.performanceWeight;
    const perf = vendor.performance;

    if (!perf || perf.totalTrips === 0) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.NOT_AVAILABLE, reason: 'Not enough historical data.' };
    }

    const successRate = (perf.successfulTrips / perf.totalTrips) * 100;
    const normalizedScore = weight * (successRate / 100);

    return { factorCode: this.code, factorName: this.name, weight, rawScore: Math.round(successRate), normalizedScore, status: MatchFactorStatus.PASS, reason: `Success rate based on ${perf.totalTrips} trips.` };
  }
}