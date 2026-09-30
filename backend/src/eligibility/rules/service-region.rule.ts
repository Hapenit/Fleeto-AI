import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
import { EligibilityRuleType, RuleStatus, RuleSeverity, Requirement, ServiceRegionType } from '@prisma/client';

export class ServiceRegionRule implements EligibilityRule {
  code = 'RULE-002';
  name = 'Service Region';
  type = EligibilityRuleType.MANDATORY;

  async evaluate(requirement: Requirement, vendor: VendorContext): Promise<RuleResult> {
    if (!requirement.pickupLocation || !requirement.deliveryLocation) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.REVIEW, severity: RuleSeverity.WARNING,
        message: 'Pickup or delivery location missing from requirement.'
      };
    }

    const pickupCity = requirement.pickupLocation.toLowerCase();
    const deliveryCity = requirement.deliveryLocation.toLowerCase();

    const supportsPickup = vendor.serviceRegions.some(sr => sr.city.toLowerCase() === pickupCity && (sr.regionType === ServiceRegionType.PICKUP || sr.regionType === ServiceRegionType.BOTH));
    const supportsDelivery = vendor.serviceRegions.some(sr => sr.city.toLowerCase() === deliveryCity && (sr.regionType === ServiceRegionType.DELIVERY || sr.regionType === ServiceRegionType.BOTH));

    if (supportsPickup && supportsDelivery) {
      return {
        ruleCode: this.code, ruleName: this.name, status: RuleStatus.PASS, severity: RuleSeverity.INFO,
        message: 'Vendor supports both pickup and delivery locations.',
        details: { pickupCity, deliveryCity }
      };
    }

    return {
      ruleCode: this.code, ruleName: this.name, status: RuleStatus.FAIL, severity: RuleSeverity.ERROR,
      message: 'Vendor does not support required service regions.',
      details: { pickupCity, deliveryCity, supportsPickup, supportsDelivery }
    };
  }
}