import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration } from '@prisma/client';

export class ServiceCoverageSignal implements MatchingSignal {
  code = 'MATCH-006';
  name = 'Service Coverage';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.serviceCoverageWeight;
    
    const pickupCity = requirement.pickupLocation?.toLowerCase() || '';
    const deliveryCity = requirement.deliveryLocation?.toLowerCase() || '';

    const hasPickupOffice = vendor.locations.some(loc => loc.city.toLowerCase() === pickupCity);
    const hasDeliveryOffice = vendor.locations.some(loc => loc.city.toLowerCase() === deliveryCity);

    if (hasPickupOffice && hasDeliveryOffice) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 100, normalizedScore: weight, status: MatchFactorStatus.PASS, reason: 'Vendor has physical presence at both locations.' };
    }

    if (hasPickupOffice || hasDeliveryOffice) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 50, normalizedScore: weight * 0.5, status: MatchFactorStatus.PARTIAL, reason: 'Vendor has physical presence at one location.' };
    }

    return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.WEAK, reason: 'Vendor lacks physical presence in required route.' };
  }
}