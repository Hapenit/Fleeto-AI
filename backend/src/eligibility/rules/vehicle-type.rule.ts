import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
import { EligibilityRuleType, RuleStatus, RuleSeverity, Requirement } from '@prisma/client';

export class VehicleTypeRule implements EligibilityRule {
  code = 'RULE-003';
  name = 'Vehicle Type';
  type = EligibilityRuleType.MANDATORY;

  async evaluate(requirement: Requirement, vendor: VendorContext): Promise<RuleResult> {
    if (!requirement.vehicleType || requirement.vehicleType.toUpperCase() === 'OTHER') {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.REVIEW, severity: RuleSeverity.WARNING,
        message: 'Requirement vehicle type is missing or OTHER.'
      };
    }

    const reqVehicle = requirement.vehicleType.toUpperCase();
    const supportsVehicle = vendor.vehicleCapabilities.some(vc => vc.vehicleType.toUpperCase() === reqVehicle);

    if (supportsVehicle) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.PASS, severity: RuleSeverity.INFO,
        message: 'Vendor supports the required vehicle type.',
        details: { requiredVehicleType: reqVehicle }
      };
    }

    return {
      ruleCode: this.code, ruleName: this.name, status: RuleStatus.FAIL, severity: RuleSeverity.ERROR,
      message: 'Vendor does not support the required vehicle type.',
      details: { requiredVehicleType: reqVehicle }
    };
  }
}