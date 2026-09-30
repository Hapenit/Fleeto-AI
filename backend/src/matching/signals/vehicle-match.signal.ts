import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration } from '@prisma/client';

export class VehicleMatchSignal implements MatchingSignal {
  code = 'MATCH-002';
  name = 'Vehicle Match';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.vehicleWeight;
    
    if (!requirement.vehicleType) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.NOT_AVAILABLE, reason: 'Requirement missing vehicle type.' };
    }

    const reqVehicle = requirement.vehicleType.toUpperCase();
    const supportsVehicle = vendor.vehicleCapabilities.some(vc => vc.vehicleType.toUpperCase() === reqVehicle);

    if (supportsVehicle) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 100, normalizedScore: weight, status: MatchFactorStatus.PASS, reason: 'Required vehicle available.' };
    }

    return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.WEAK, reason: 'Exact vehicle not matched.' };
  }
}