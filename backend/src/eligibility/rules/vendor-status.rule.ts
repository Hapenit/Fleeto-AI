import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
import { EligibilityRuleType, RuleStatus, RuleSeverity, VendorStatus, Requirement } from '@prisma/client';

export class VendorStatusRule implements EligibilityRule {
  code = 'RULE-001';
  name = 'Vendor Status';
  type = EligibilityRuleType.MANDATORY;

  async evaluate(requirement: Requirement, vendor: VendorContext): Promise<RuleResult> {
    if (vendor.status === VendorStatus.ACTIVE) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.PASS, severity: RuleSeverity.INFO,
        message: 'Vendor is active.',
        details: { vendorStatus: vendor.status }
      };
    } else if (vendor.status === VendorStatus.PENDING_VERIFICATION) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.REVIEW, severity: RuleSeverity.WARNING,
        message: 'Vendor is pending verification.',
        details: { vendorStatus: vendor.status }
      };
    } else {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.FAIL, severity: RuleSeverity.ERROR,
        message: 'Vendor is not active.',
        details: { vendorStatus: vendor.status }
      };
    }
  }
}