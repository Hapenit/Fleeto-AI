import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration } from '@prisma/client';
import { WeightConversionService } from '../../eligibility/utils/weight-conversion.service.js';

export class CapacityFitSignal implements MatchingSignal {
  code = 'MATCH-003';
  name = 'Capacity Fit';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.capacityWeight;
    
    if (!requirement.cargoWeight || !requirement.cargoWeightUnit) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.NOT_AVAILABLE, reason: 'Requirement missing cargo weight.' };
    }

    const reqWeightInKg = WeightConversionService.convertToKg(requirement.cargoWeight, requirement.cargoWeightUnit);
    
    const maxVendorCapacity = Math.max(...vendor.vehicleCapabilities.map(vc => 
      vc.maximumCapacity && vc.capacityUnit ? WeightConversionService.convertToKg(vc.maximumCapacity, vc.capacityUnit) : 0
    ));

    if (maxVendorCapacity === 0) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.NOT_AVAILABLE, reason: 'Vendor capacity unknown.' };
    }

    if (reqWeightInKg <= maxVendorCapacity) {
      // Efficiency calculation. 100% if exact match. If vendor is double size, 50% efficiency.
      const efficiency = (reqWeightInKg / maxVendorCapacity) * 100;
      const normalizedScore = weight * (efficiency / 100);
      
      return { factorCode: this.code, factorName: this.name, weight, rawScore: Math.round(efficiency), normalizedScore, status: MatchFactorStatus.PASS, reason: 'Capacity supports requirement with efficiency factor.' };
    }

    return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.WEAK, reason: 'Insufficient capacity.' };
  }
}