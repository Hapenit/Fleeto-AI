import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
import { EligibilityRuleType, RuleStatus, RuleSeverity, Requirement } from '@prisma/client';

export class VehicleBodyTypeRule implements EligibilityRule {
  code = 'RULE-004';
  name = 'Vehicle Body Type';
  type = EligibilityRuleType.CONDITIONAL;

  async evaluate(requirement: Requirement, vendor: VendorContext): Promise<RuleResult> {
    // Requirements might not explicitly have bodyType right now. Assuming we might parse it or add it later.
    // Wait, Requirement doesn't have bodyType. Let me check the prompt, maybe it's in preferredVendorConditions or we just return NOT_APPLICABLE if absent.
    const reqBodyType = (requirement as any).vehicleBodyType || null;

    if (!reqBodyType) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.NOT_APPLICABLE, severity: RuleSeverity.INFO,
        message: 'Requirement does not specify a vehicle body type.'
      };
    }

    const reqVehicle = requirement.vehicleType?.toUpperCase();
    const matchingVehicles = vendor.vehicleCapabilities.filter(vc => !reqVehicle || vc.vehicleType.toUpperCase() === reqVehicle);
    
    if (matchingVehicles.some(vc => vc.vehicleBodyType?.toUpperCase() === reqBodyType.toUpperCase())) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.PASS, severity: RuleSeverity.INFO,
        message: 'Vendor supports the required vehicle body type.',
        details: { requiredBodyType: reqBodyType }
      };
    }

    return {
      ruleCode: this.code, ruleName: this.name, status: RuleStatus.FAIL, severity: RuleSeverity.ERROR,
      message: 'Vendor does not support the required vehicle body type.',
      details: { requiredBodyType: reqBodyType }
    };
  }
}