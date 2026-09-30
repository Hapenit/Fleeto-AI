import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
import { EligibilityRuleType, RuleStatus, RuleSeverity, Requirement, VendorAvailabilityStatus } from '@prisma/client';

export class AvailabilityRule implements EligibilityRule {
  code = 'RULE-007';
  name = 'Vehicle Availability';
  type = EligibilityRuleType.CONDITIONAL;

  async evaluate(requirement: Requirement, vendor: VendorContext): Promise<RuleResult> {
    if (!requirement.pickupDate) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.NOT_APPLICABLE, severity: RuleSeverity.INFO,
        message: 'Requirement pickup date is missing.'
      };
    }

    // Just checking the vendor declared status. Real availability needs AI Voice Calling.
    const avail = vendor.availabilities[0]; // simplistic assumption
    
    if (avail?.availabilityStatus === VendorAvailabilityStatus.AVAILABLE) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.PASS, severity: RuleSeverity.INFO,
        message: 'Vendor declared available.'
      };
    } else if (avail?.availabilityStatus === VendorAvailabilityStatus.BUSY) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.REVIEW, severity: RuleSeverity.WARNING,
        message: 'Vendor declared busy. Needs AI voice confirmation.'
      };
    }

    return {
      ruleCode: this.code, ruleName: this.name, status: RuleStatus.REVIEW, severity: RuleSeverity.WARNING,
      message: 'Current vendor availability is UNKNOWN.'
    };
  }
}