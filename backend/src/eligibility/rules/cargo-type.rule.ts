import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
import { EligibilityRuleType, RuleStatus, RuleSeverity, Requirement } from '@prisma/client';

export class CargoTypeRule implements EligibilityRule {
  code = 'RULE-005';
  name = 'Cargo Type';
  type = EligibilityRuleType.MANDATORY;

  async evaluate(requirement: Requirement, vendor: VendorContext): Promise<RuleResult> {
    if (!requirement.cargoType) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.REVIEW, severity: RuleSeverity.WARNING,
        message: 'Requirement cargo type is missing.'
      };
    }

    const reqCargo = requirement.cargoType.toUpperCase();
    
    // Simple matching or substring matching
    const supportsCargo = vendor.cargoCapabilities.some(cc => 
      cc.cargoType.toUpperCase().includes(reqCargo) || reqCargo.includes(cc.cargoType.toUpperCase())
    );

    if (supportsCargo) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.PASS, severity: RuleSeverity.INFO,
        message: 'Vendor supports the required cargo type.',
        details: { requiredCargoType: requirement.cargoType }
      };
    }

    return {
      ruleCode: this.code, ruleName: this.name, status: RuleStatus.FAIL, severity: RuleSeverity.ERROR,
      message: 'Vendor does not support the required cargo type.',
      details: { requiredCargoType: requirement.cargoType }
    };
  }
}