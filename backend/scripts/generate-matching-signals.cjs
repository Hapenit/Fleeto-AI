const fs = require('fs');
const path = require('path');

const signalsDir = path.join(__dirname, '..', 'src', 'matching', 'signals');

const interfaceContent = `import { MatchFactorStatus, Requirement, Vendor, VendorLocation, VendorServiceRegion, VendorVehicleCapability, VendorCargoCapability, VendorAvailability, VendorPerformance, VendorRankingWeightConfiguration } from '@prisma/client';

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
`;
fs.writeFileSync(path.join(signalsDir, 'matching-signal.interface.ts'), interfaceContent);

const signals = [
  {
    name: 'route-match.signal.ts',
    content: `import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration, ServiceRegionType } from '@prisma/client';

export class RouteMatchSignal implements MatchingSignal {
  code = 'MATCH-001';
  name = 'Route Match';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.routeWeight;
    
    if (!requirement.pickupLocation || !requirement.deliveryLocation) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.NOT_AVAILABLE, reason: 'Requirement missing route details.' };
    }

    const pickupCity = requirement.pickupLocation.toLowerCase();
    const deliveryCity = requirement.deliveryLocation.toLowerCase();

    const supportsPickup = vendor.serviceRegions.some(sr => sr.city.toLowerCase() === pickupCity && (sr.regionType === ServiceRegionType.PICKUP || sr.regionType === ServiceRegionType.BOTH));
    const supportsDelivery = vendor.serviceRegions.some(sr => sr.city.toLowerCase() === deliveryCity && (sr.regionType === ServiceRegionType.DELIVERY || sr.regionType === ServiceRegionType.BOTH));

    if (supportsPickup && supportsDelivery) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 100, normalizedScore: weight, status: MatchFactorStatus.PASS, reason: 'Vendor fully supports the route.' };
    }

    if (supportsPickup || supportsDelivery) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 50, normalizedScore: weight * 0.5, status: MatchFactorStatus.PARTIAL, reason: 'Vendor partially supports the route.' };
    }

    return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.WEAK, reason: 'Vendor does not explicitly support the route.' };
  }
}`
  },
  {
    name: 'vehicle-match.signal.ts',
    content: `import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration } from '@prisma/client';

export class VehicleMatchSignal implements MatchingSignal {
  code = 'MATCH-002';
  name = 'Vehicle Match';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.vehicleWeight;
    
    if (!requirement.vehicleType) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.NOT_AVAILABLE, reason: 'Requirement missing vehicle type.' };
    }

    const reqVehicle = requirement.vehicleType.toUpperCase();
    const supportsVehicle = vendor.vehicleCapabilities.some(vc => vc.vehicleType.toUpperCase() === reqVehicle);

    if (supportsVehicle) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 100, normalizedScore: weight, status: MatchFactorStatus.PASS, reason: 'Required vehicle available.' };
    }

    return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.WEAK, reason: 'Exact vehicle not matched.' };
  }
}`
  },
  {
    name: 'capacity-fit.signal.ts',
    content: `import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration } from '@prisma/client';
import { WeightConversionService } from '../../eligibility/utils/weight-conversion.service.js';

export class CapacityFitSignal implements MatchingSignal {
  code = 'MATCH-003';
  name = 'Capacity Fit';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.capacityWeight;
    
    if (!requirement.cargoWeight || !requirement.cargoWeightUnit) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.NOT_AVAILABLE, reason: 'Requirement missing cargo weight.' };
    }

    const reqWeightInKg = WeightConversionService.convertToKg(requirement.cargoWeight, requirement.cargoWeightUnit);
    
    const maxVendorCapacity = Math.max(...vendor.vehicleCapabilities.map(vc => 
      vc.maximumCapacity && vc.capacityUnit ? WeightConversionService.convertToKg(vc.maximumCapacity, vc.capacityUnit) : 0
    ));

    if (maxVendorCapacity === 0) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.NOT_AVAILABLE, reason: 'Vendor capacity unknown.' };
    }

    if (reqWeightInKg <= maxVendorCapacity) {
      // Efficiency calculation. 100% if exact match. If vendor is double size, 50% efficiency.
      const efficiency = (reqWeightInKg / maxVendorCapacity) * 100;
      const normalizedScore = weight * (efficiency / 100);
      
      return { factorCode: this.code, factorName: this.name, weight, rawScore: Math.round(efficiency), normalizedScore, status: MatchFactorStatus.PASS, reason: 'Capacity supports requirement with efficiency factor.' };
    }

    return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.WEAK, reason: 'Insufficient capacity.' };
  }
}`
  },
  {
    name: 'cargo-capability.signal.ts',
    content: `import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration } from '@prisma/client';

export class CargoCapabilitySignal implements MatchingSignal {
  code = 'MATCH-004';
  name = 'Cargo Capability Match';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.cargoWeight;
    
    if (!requirement.cargoType) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.NOT_AVAILABLE, reason: 'Requirement missing cargo type.' };
    }

    const reqCargo = requirement.cargoType.toUpperCase();
    const supportsCargo = vendor.cargoCapabilities.some(cc => cc.cargoType.toUpperCase().includes(reqCargo) || reqCargo.includes(cc.cargoType.toUpperCase()));

    if (supportsCargo) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 100, normalizedScore: weight, status: MatchFactorStatus.PASS, reason: 'Vendor supports requested cargo type.' };
    }

    return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.WEAK, reason: 'Vendor lacks explicit cargo type support.' };
  }
}`
  },
  {
    name: 'availability-fit.signal.ts',
    content: `import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration, VendorAvailabilityStatus } from '@prisma/client';

export class AvailabilityFitSignal implements MatchingSignal {
  code = 'MATCH-005';
  name = 'Availability Fit';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.availabilityWeight;
    const avail = vendor.availabilities[0];

    if (!avail || avail.availabilityStatus === VendorAvailabilityStatus.UNKNOWN) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.NOT_AVAILABLE, reason: 'Availability unknown.' };
    }

    if (avail.availabilityStatus === VendorAvailabilityStatus.AVAILABLE) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 100, normalizedScore: weight, status: MatchFactorStatus.PASS, reason: 'Vendor explicitly available.' };
    }

    return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.WEAK, reason: 'Vendor explicitly busy.' };
  }
}`
  },
  {
    name: 'service-coverage.signal.ts',
    content: `import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration } from '@prisma/client';

export class ServiceCoverageSignal implements MatchingSignal {
  code = 'MATCH-006';
  name = 'Service Coverage';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.serviceCoverageWeight;
    
    const pickupCity = requirement.pickupLocation?.toLowerCase() || '';
    const deliveryCity = requirement.deliveryLocation?.toLowerCase() || '';

    const hasPickupOffice = vendor.locations.some(loc => loc.city.toLowerCase() === pickupCity);
    const hasDeliveryOffice = vendor.locations.some(loc => loc.city.toLowerCase() === deliveryCity);

    if (hasPickupOffice && hasDeliveryOffice) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 100, normalizedScore: weight, status: MatchFactorStatus.PASS, reason: 'Vendor has physical presence at both locations.' };
    }

    if (hasPickupOffice || hasDeliveryOffice) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 50, normalizedScore: weight * 0.5, status: MatchFactorStatus.PARTIAL, reason: 'Vendor has physical presence at one location.' };
    }

    return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.WEAK, reason: 'Vendor lacks physical presence in required route.' };
  }
}`
  },
  {
    name: 'historical-performance.signal.ts',
    content: `import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration } from '@prisma/client';

export class HistoricalPerformanceSignal implements MatchingSignal {
  code = 'MATCH-007';
  name = 'Historical Performance';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.performanceWeight;
    const perf = vendor.performance;

    if (!perf || perf.totalTrips === 0) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.NOT_AVAILABLE, reason: 'Not enough historical data.' };
    }

    const successRate = (perf.successfulTrips / perf.totalTrips) * 100;
    const normalizedScore = weight * (successRate / 100);

    return { factorCode: this.code, factorName: this.name, weight, rawScore: Math.round(successRate), normalizedScore, status: MatchFactorStatus.PASS, reason: \`Success rate based on \${perf.totalTrips} trips.\` };
  }
}`
  },
  {
    name: 'commercial-history.signal.ts',
    content: `import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration } from '@prisma/client';

export class CommercialHistorySignal implements MatchingSignal {
  code = 'MATCH-008';
  name = 'Commercial History';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.commercialWeight;
    
    // For POC, we might lack requirement budget or vendor average price.
    // If either is missing, return NOT_AVAILABLE.
    if (!vendor.performance?.averageFinalPrice || !requirement.budget) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 0, normalizedScore: 0, status: MatchFactorStatus.NOT_AVAILABLE, reason: 'Historical price or budget unavailable.' };
    }

    const avgPrice = vendor.performance.averageFinalPrice;
    const budget = requirement.budget;

    if (avgPrice <= budget) {
      return { factorCode: this.code, factorName: this.name, weight, rawScore: 100, normalizedScore: weight, status: MatchFactorStatus.PASS, reason: 'Historical price within budget.' };
    }

    const ratio = Math.max(0, 100 - ((avgPrice - budget) / budget * 100));
    return { factorCode: this.code, factorName: this.name, weight, rawScore: Math.round(ratio), normalizedScore: weight * (ratio / 100), status: MatchFactorStatus.PARTIAL, reason: 'Historical price exceeds budget.' };
  }
}`
  },
  {
    name: 'communication-readiness.signal.ts',
    content: `import { MatchingSignal, MatchFactorResultData, VendorMatchContext } from './matching-signal.interface.js';
import { MatchFactorStatus, Requirement, VendorRankingWeightConfiguration } from '@prisma/client';

export class CommunicationReadinessSignal implements MatchingSignal {
  code = 'MATCH-009';
  name = 'Communication Readiness';

  async evaluate(requirement: Requirement, vendor: VendorMatchContext, config: VendorRankingWeightConfiguration): Promise<MatchFactorResultData> {
    const weight = config.communicationWeight;
    
    let rawScore = 0;
    if (vendor.callEnabled) rawScore += 50;
    if (vendor.primaryPhone) rawScore += 30;
    if (vendor.preferredLanguage) rawScore += 20;

    const normalizedScore = weight * (rawScore / 100);

    return { factorCode: this.code, factorName: this.name, weight, rawScore, normalizedScore, status: rawScore > 50 ? MatchFactorStatus.PASS : MatchFactorStatus.PARTIAL, reason: 'Calculated communication readiness based on contact info.' };
  }
}`
  }
];

signals.forEach(signal => {
  fs.writeFileSync(path.join(signalsDir, signal.name), signal.content);
});

console.log('Signals generated successfully.');
