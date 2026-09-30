import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration } from '@prisma/client';

export class CargoCapabilitySignal implements MatchingSignal {
  code = 'MATCH-004';
  name = 'Cargo Capability Match';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.cargoWeight;
    
    if (!requirement.cargoType) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.NOT_AVAILABLE, reason: 'Requirement missing cargo type.' };
    }

    const reqCargo = requirement.cargoType.toUpperCase();
    const supportsCargo = vendor.cargoCapabilities.some(cc => cc.cargoType.toUpperCase().includes(reqCargo) || reqCargo.includes(cc.cargoType.toUpperCase()));

    if (supportsCargo) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 100, normalizedScore: weight, status: MatchFactorStatus.PASS, reason: 'Vendor supports requested cargo type.' };
    }

    return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.WEAK, reason: 'Vendor lacks explicit cargo type support.' };
  }
}