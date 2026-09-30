import { EligibilityRuleType, RuleStatus, RuleSeverity, Requirement, Vendor, VendorLocation, VendorServiceRegion, VendorVehicleCapability, VendorCargoCapability, VendorAvailability, VendorPerformance } from '@prisma/client';

export interface RuleResult {
  ruleCode: string;
  ruleName: string;
  status: RuleStatus;
  severity: RuleSeverity;
  message: string;
  details?: any;
}

export type VendorContext = Vendor & {
  locations: VendorLocation[];
  serviceRegions: VendorServiceRegion[];
  vehicleCapabilities: VendorVehicleCapability[];
  cargoCapabilities: VendorCargoCapability[];
  availabilities: VendorAvailability[];
  performance: VendorPerformance | null;
};

export interface EligibilityRule {
  code: string;
  name: string;
  type: EligibilityRuleType;

  evaluate(
    requirement: Requirement,
    vendor: VendorContext
  ): Promise<RuleResult>;
}
