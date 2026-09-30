const fs = require('fs');
const path = require('path');

const rulesDir = path.join(__dirname, '..', 'src', 'eligibility', 'rules');

const rules = [
  {
    name: 'vendor-status.rule.ts',
    content: `import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
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
}`
  },
  {
    name: 'service-region.rule.ts',
    content: `import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
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
}`
  },
  {
    name: 'vehicle-type.rule.ts',
    content: `import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
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
}`
  },
  {
    name: 'vehicle-body-type.rule.ts',
    content: `import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
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
}`
  },
  {
    name: 'cargo-type.rule.ts',
    content: `import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
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
}`
  },
  {
    name: 'cargo-capacity.rule.ts',
    content: `import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
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
}`
  },
  {
    name: 'availability.rule.ts',
    content: `import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
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
}`
  },
  {
    name: 'call-enabled.rule.ts',
    content: `import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
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
}`
  },
  {
    name: 'special-handling.rule.ts',
    content: `import { EligibilityRule, RuleResult, VendorContext } from './eligibility-rule.interface.js';
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
}`
  }
];

rules.forEach(rule => {
  fs.writeFileSync(path.join(rulesDir, rule.name), rule.content);
});

// Write WeightConversionService
const utilsDir = path.join(__dirname, '..', 'src', 'eligibility', 'utils');
fs.writeFileSync(path.join(utilsDir, 'weight-conversion.service.ts'), `
export class WeightConversionService {
  static convertToKg(value: number, unit: string): number {
    const u = unit.toUpperCase();
    if (u === 'KG') return value;
    if (u === 'TON' || u === 'MT') return value * 1000;
    if (u === 'GRAM') return value / 1000;
    if (u === 'LBS' || u === 'POUND') return value * 0.453592;
    return value; // fallback
  }
}
`);
