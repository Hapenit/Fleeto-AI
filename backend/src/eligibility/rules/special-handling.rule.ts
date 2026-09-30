import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
import { EligibilityRuleType, RuleStatus, RuleSeverity, Requirement } from '@prisma/client';

export class SpecialHandlingRule implements EligibilityRule {
  code = 'RULE-009';
  name = 'Special Handling Capability';
  type = EligibilityRuleType.CONDITIONAL;

  async evaluate(requirement: Requirement, vendor: VendorContext): Promise<RuleResult> {
    // Simplistic check, as Special Handling is not explicitly a boolean on Requirement schema currently.
    // But we check if notes/cargoType implies special handling. We'll default to NOT_APPLICABLE.
    const needsSpecial = requirement.cargoType?.toUpperCase().includes('HAZMAT') || false;

    if (!needsSpecial) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.NOT_APPLICABLE, severity: RuleSeverity.INFO,
        message: 'Requirement does not require special handling.'
      };
    }

    const supportsSpecial = vendor.cargoCapabilities.some(cc => cc.specialHandlingSupported);

    if (supportsSpecial) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.PASS, severity: RuleSeverity.INFO,
        message: 'Vendor supports special handling.'
      };
    }

    return {
      ruleCode: this.code, ruleName: this.name, status: RuleStatus.FAIL, severity: RuleSeverity.ERROR,
      message: 'Vendor does not support required special handling.'
    };
  }
}