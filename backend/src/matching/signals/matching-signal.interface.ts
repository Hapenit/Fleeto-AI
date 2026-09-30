import { MatchFactorStatus, Requirement, Vendor, VendorLocation, VendorServiceRegion, VendorVehicleCapability, VendorCargoCapability, VendorAvailability, VendorPerformance, VendorRankingWeightConfiguration } from '@prisma/client';

export type VendorMatchContext = Vendor & {
  locations: VendorLocation[];
  serviceRegions: VendorServiceRegion[];
  vehicleCapabilities: VendorVehicleCapability[];
  cargoCapabilities: VendorCargoCapability[];
  availabilities: VendorAvailability[];
  performance: VendorPerformance | null;
};

export interface MatchFactorResultData {
  factorCode: string;
  factorName: string;
  weight: number;
  rawScore: number;
  normalizedScore: number;
  status: MatchFactorStatus;
  reason?: string;
  details?: any;
}

export interface MatchingSignal {
  code: string;
  name: string;
  
  evaluate(
    requirement: Requirement,
    vendor: VendorMatchContext,
    config: VendorRankingWeightConfiguration
  ): Promise<MatchFactorResultData>;
}
