import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
import { EligibilityRuleType, RuleStatus, RuleSeverity, Requirement } from '@prisma/client';

export class CallEnabledRule implements EligibilityRule {
  code = 'RULE-008';
  name = 'Call Enabled';
  type = EligibilityRuleType.INFORMATIONAL;

  async evaluate(requirement: Requirement, vendor: VendorContext): Promise<RuleResult> {
    if (vendor.callEnabled) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.PASS, severity: RuleSeverity.INFO,
        message: 'Vendor has AI calling enabled.'
      };
    }

    return {
      ruleCode: this.code, ruleName: this.name, status: RuleStatus.REVIEW, severity: RuleSeverity.WARNING,
      message: 'Vendor does not have AI calling enabled.'
    };
  }
}