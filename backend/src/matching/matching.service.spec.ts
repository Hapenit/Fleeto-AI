import { Test, TestingModule } from '@nestjs/testing';
import { MatchingService } from './matching.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('MatchingService', () => {
  let service: MatchingService;
  let prismaService: any;
  let auditService: any;

  beforeEach(async () => {
    prismaService = {
      vendorRankingWeightConfiguration: {
        findFirst: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
      },
      requirement: {
        findUnique: vi.fn(),
      },
      vendorRankingRun: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      vendorEligibilityEvaluation: {
        findMany: vi.fn(),
      },
      vendorRankingEvaluation: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
      vendorOutreachSelection: {
        deleteMany: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
      }
    };

    auditService = {
      createLog: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  describe('generateRanking', () => {
    it('should generate ranking for eligible vendors correctly', async () => {
      prismaService.vendorRankingWeightConfiguration.findFirst.mockResolvedValue({
        version: '1.0',
        routeWeight: 25,
        vehicleWeight: 20,
        capacityWeight: 15,
        cargoWeight: 10,
        availabilityWeight: 10,
        serviceCoverageWeight: 5,
        performanceWeight: 10,
        commercialWeight: 3,
        communicationWeight: 2
      });

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
      prismaService.vendorRankingRun.findFirst.mockResolvedValue(null);
      prismaService.vendorRankingRun.create.mockResolvedValue({ id: 'run1', runNumber: 'RANK-2026-111111' });
      prismaService.vendorRankingRun.update.mockResolvedValue({ id: 'run1', status: 'COMPLETED' });

      // Mock one eligible vendor
      const mockVendor = {
        id: 'v1', vendorCode: 'V1', callEnabled: true, primaryPhone: '999', preferredLanguage: 'EN',
        locations: [{ city: 'Chennai' }],
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
        ],
        performance: { totalTrips: 10, successfulTrips: 10 }
      };

      prismaService.vendorEligibilityEvaluation.findMany.mockResolvedValue([
        { vendor: mockVendor, id: 'elg1', vendorId: 'v1' }
      ]);

      prismaService.vendorRankingEvaluation.create.mockResolvedValue({});

      await service.generateRanking('r1', 'u1');

      // The create call for evaluation
      expect(prismaService.vendorRankingEvaluation.create).toHaveBeenCalled();
      const evalCall = prismaService.vendorRankingEvaluation.create.mock.calls[0][0];
      
      // Expected logic:
      // Route Match: 25
      // Vehicle Match: 20
      // Capacity Match: (20/25)*15 = 12
      // Cargo Match: 10
      // Availability: 10
      // Service Coverage: Has pickup only = 2.5
      // Performance: 100% = 10
      // Commercial: N/A (3 weight missing, so total weight is 97)
      // Communication Readiness: phone, callEnabled, lang = 100 = 2
      // raw = 25 + 20 + 12 + 10 + 10 + 2.5 + 10 + 2 = 91.5
      // final = (91.5 / 97) * 100 = ~94.3
      
      expect(evalCall.data.score).toBeGreaterThan(90);
      expect(evalCall.data.rank).toBe(1);
    });
  });
});
