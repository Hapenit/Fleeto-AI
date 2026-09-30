import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration, VendorAvailabilityStatus } from '@prisma/client';

export class AvailabilityFitSignal implements MatchingSignal {
  code = 'MATCH-005';
  name = 'Availability Fit';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.availabilityWeight;
    const avail = vendor.availabilities[0];

    if (!avail || avail.availabilityStatus === VendorAvailabilityStatus.UNKNOWN) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.NOT_AVAILABLE, reason: 'Availability unknown.' };
    }

    if (avail.availabilityStatus === VendorAvailabilityStatus.AVAILABLE) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 100, normalizedScore: weight, status: MatchFactorStatus.PASS, reason: 'Vendor explicitly available.' };
    }

    return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.WEAK, reason: 'Vendor explicitly busy.' };
  }
}