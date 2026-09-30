import { Test, TestingModule } from '@nestjs/testing';
import { RequirementValidationService } from './requirement-validation.service.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('RequirementValidationService', () => {
  let service: RequirementValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequirementValidationService],
    }).compile();

    service = module.get<RequirementValidationService>(RequirementValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateForReadyStatus', () => {
    it('should be valid when all required fields are present', () => {
      const req = {
        customerName: 'A',
        pickupLocation: 'B',
        deliveryLocation: 'C',
        cargoType: 'D',
        cargoWeight: 10,
        vehicleType: 'TRUCK',
        pickupDate: new Date(),
      };
      const result = service.validateForReadyStatus(req);
      expect(result.valid).toBe(true);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should be invalid when fields are missing', () => {
      const req = {
        customerName: 'A',
      };
      const result = service.validateForReadyStatus(req);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('pickupLocation');
      expect(result.missingFields).toContain('cargoWeight');
    });

    it('should be invalid when cargoWeight is <= 0', () => {
      const req = {
        customerName: 'A',
        pickupLocation: 'B',
        deliveryLocation: 'C',
        cargoType: 'D',
        cargoWeight: 0,
        vehicleType: 'TRUCK',
        pickupDate: new Date(),
      };
      const result = service.validateForReadyStatus(req);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('cargoWeight must be > 0');
    });
  });
});
