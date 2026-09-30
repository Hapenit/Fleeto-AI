import { Test, TestingModule } from '@nestjs/testing';
import { EligibilityService } from './eligibility.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { VendorStatus, EvaluationStatus, EvaluationRunStatus, RuleStatus, RuleSeverity } from '@prisma/client';

describe('EligibilityService', () => {
  let service: EligibilityService;
  let prismaService: any;
  let auditService: any;

  beforeEach(async () => {
    prismaService = {
      requirement: {
        findUnique: vi.fn(),
      },
      vendorEligibilityRun: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      vendor: {
        findMany: vi.fn(),
      },
      vendorEligibilityEvaluation: {
        create: vi.fn(),
        count: vi.fn(),
      }
    };

    auditService = {
      createLog: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EligibilityService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<EligibilityService>(EligibilityService);
  });

  describe('evaluateRequirement', () => {
    it('should create an evaluation run successfully for eligible vendor', async () => {
      const mockReq = {
        id: 'r1',
        pickupLocation: 'Chennai',
        deliveryLocation: 'Bangalore',
        vehicleType: 'TRAILER',
        cargoType: 'INDUSTRIAL',
        cargoWeight: 20,
        cargoWeightUnit: 'TON',
        pickupDate: new Date(),
      };

      prismaService.requirement.findUnique.mockResolvedValue(mockReq);
      prismaService.vendorEligibilityRun.findFirst.mockResolvedValue(null);
      prismaService.vendorEligibilityRun.create.mockResolvedValue({ id: 'run1', runNumber: 'ELG-2026-111111' });
      prismaService.vendorEligibilityRun.update.mockResolvedValue({ id: 'run1', status: EvaluationRunStatus.COMPLETED });
      
      const mockVendor = {
        id: 'v1', vendorCode: 'V1', status: VendorStatus.ACTIVE, callEnabled: true,
        locations: [],
        serviceRegions: [
          { city: 'Chennai', regionType: 'PICKUP' },
          { city: 'Bangalore', regionType: 'DELIVERY' }
        ],
        vehicleCapabilities: [
          { vehicleType: 'TRAILER', maximumCapacity: 25, capacityUnit: 'TON' }
        ],
        cargoCapabilities: [
          { cargoType: 'INDUSTRIAL' }
        ],
        availabilities: [
          { availabilityStatus: 'AVAILABLE' }
        ]
      };

      prismaService.vendor.findMany.mockResolvedValue([mockVendor]);
      prismaService.vendorEligibilityEvaluation.create.mockResolvedValue({ id: 'e1', status: EvaluationStatus.COMPLETED, eligible: true });
      prismaService.vendorEligibilityEvaluation.count.mockResolvedValue(1);

      const res = await service.evaluateRequirement('r1', 'u1', 'ip', 'ua');

      expect(res).toBeDefined();
      expect(prismaService.vendorEligibilityEvaluation.create).toHaveBeenCalled();
    });

    it('should mark vendor ineligible if capacity is below requirement', async () => {
      const mockReq = {
        id: 'r1',
        pickupLocation: 'Chennai',
        deliveryLocation: 'Bangalore',
        vehicleType: 'TRAILER',
        cargoType: 'INDUSTRIAL',
        cargoWeight: 20, // Requires 20
        cargoWeightUnit: 'TON',
        pickupDate: new Date(),
      };

      prismaService.requirement.findUnique.mockResolvedValue(mockReq);
      prismaService.vendorEligibilityRun.findFirst.mockResolvedValue(null);
      prismaService.vendorEligibilityRun.create.mockResolvedValue({ id: 'run1', runNumber: 'ELG-2026-111111' });
      prismaService.vendorEligibilityRun.update.mockResolvedValue({ id: 'run1' });
      
      const mockVendor = {
        id: 'v1', vendorCode: 'V1', status: VendorStatus.ACTIVE, callEnabled: true,
        locations: [],
        serviceRegions: [
          { city: 'Chennai', regionType: 'PICKUP' },
          { city: 'Bangalore', regionType: 'DELIVERY' }
        ],
        vehicleCapabilities: [
          { vehicleType: 'TRAILER', maximumCapacity: 15, capacityUnit: 'TON' } // Vendor has only 15
        ],
        cargoCapabilities: [{ cargoType: 'INDUSTRIAL' }],
        availabilities: [{ availabilityStatus: 'AVAILABLE' }]
      };

      prismaService.vendor.findMany.mockResolvedValue([mockVendor]);

      await service.evaluateRequirement('r1', 'u1', 'ip', 'ua');

      const createCall = prismaService.vendorEligibilityEvaluation.create.mock.calls[0][0];
      expect(createCall.data.status).toBe(EvaluationStatus.FAILED);
      expect(createCall.data.eligible).toBe(false);
      
      const ruleResults = createCall.data.ruleResults.create;
      const capacityRule = ruleResults.find((r: any) => r.ruleCode === 'RULE-006');
      expect(capacityRule.status).toBe(RuleStatus.FAIL);
    });
  });
});
