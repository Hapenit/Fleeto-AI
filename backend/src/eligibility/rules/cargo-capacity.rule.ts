import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
import { EligibilityRuleType, RuleStatus, RuleSeverity, Requirement } from '@prisma/client';
import { WeightConversionService } from '../utils/weight-conversion.service.js';

export class CargoCapacityRule implements EligibilityRule {
  code = 'RULE-006';
  name = 'Cargo Capacity';
  type = EligibilityRuleType.MANDATORY;

  async evaluate(requirement: Requirement, vendor: VendorContext): Promise<RuleResult> {
    if (requirement.cargoWeight === null || !requirement.cargoWeightUnit) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.REVIEW, severity: RuleSeverity.WARNING,
        message: 'Requirement cargo weight is missing.'
      };
    }

    const reqWeight = requirement.cargoWeight;
    const reqUnit = requirement.cargoWeightUnit;

    const reqWeightInKg = WeightConversionService.convertToKg(reqWeight, reqUnit);

    const validVehicles = vendor.vehicleCapabilities.filter(vc => {
      if (!vc.maximumCapacity || !vc.capacityUnit) return false;
      const vWeightInKg = WeightConversionService.convertToKg(vc.maximumCapacity, vc.capacityUnit);
      return vWeightInKg >= reqWeightInKg;
    });

    if (validVehicles.length > 0) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.PASS, severity: RuleSeverity.INFO,
        message: 'Vendor capacity supports the requested cargo weight.',
        details: { requiredCapacity: reqWeight, requiredUnit: reqUnit, availableVehicles: validVehicles.length }
      };
    }

    const hasAnyCapacity = vendor.vehicleCapabilities.some(vc => vc.maximumCapacity !== null);
    if (!hasAnyCapacity) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.REVIEW, severity: RuleSeverity.WARNING,
        message: 'Vendor maximum capacity is unknown.'
      };
    }

    return {
      ruleCode: this.code, ruleName: this.name, status: RuleStatus.FAIL, severity: RuleSeverity.ERROR,
      message: 'Vendor capacity is below the required cargo weight.',
      details: { requiredCapacity: reqWeight, requiredUnit: reqUnit }
    };
  }
}