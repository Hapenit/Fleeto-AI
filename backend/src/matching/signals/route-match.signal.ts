import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration, ServiceRegionType } from '@prisma/client';

export class RouteMatchSignal implements MatchingSignal {
  code = 'MATCH-001';
  name = 'Route Match';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.routeWeight;
    
    if (!requirement.pickupLocation || !requirement.deliveryLocation) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.NOT_AVAILABLE, reason: 'Requirement missing route details.' };
    }

    const pickupCity = requirement.pickupLocation.toLowerCase();
    const deliveryCity = requirement.deliveryLocation.toLowerCase();

    const supportsPickup = vendor.serviceRegions.some(sr => sr.city.toLowerCase() === pickupCity && (sr.regionType === ServiceRegionType.PICKUP || sr.regionType === ServiceRegionType.BOTH));
    const supportsDelivery = vendor.serviceRegions.some(sr => sr.city.toLowerCase() === deliveryCity && (sr.regionType === ServiceRegionType.DELIVERY || sr.regionType === ServiceRegionType.BOTH));

    if (supportsPickup && supportsDelivery) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 100, normalizedScore: weight, status: MatchFactorStatus.PASS, reason: 'Vendor fully supports the route.' };
    }

    if (supportsPickup || supportsDelivery) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 50, normalizedScore: weight * 0.5, status: MatchFactorStatus.PARTIAL, reason: 'Vendor partially supports the route.' };
    }

    return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.WEAK, reason: 'Vendor does not explicitly support the route.' };
  }
}