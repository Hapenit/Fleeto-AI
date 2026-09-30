import { Test, TestingModule } from '@nestjs/testing';
import { RequirementStatusService } from './requirement-status.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RequirementValidationService } from './requirement-validation.service.js';
import { RequirementStatus } from '@prisma/client';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';

describe('RequirementStatusService', () => {
  let service: RequirementStatusService;
  let prismaService: any;
  let validationService: any;

  beforeEach(async () => {
    prismaService = {
      requirement: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      requirementStatusHistory: {
        create: vi.fn(),
      },
    };

    validationService = {
      validateForReadyStatus: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequirementStatusService,
        { provide: PrismaService, useValue: prismaService },
        { provide: RequirementValidationService, useValue: validationService },
      ],
    }).compile();

    service = module.get<RequirementStatusService>(RequirementStatusService);
  });

  it('should allow DRAFT to READY transition if valid', async () => {
    prismaService.requirement.findUnique.mockResolvedValue({ id: '1', status: RequirementStatus.DRAFT });
    validationService.validateForReadyStatus.mockReturnValue({ valid: true });
    prismaService.requirement.update.mockResolvedValue({ id: '1', status: RequirementStatus.READY });

    const result = await service.changeStatus('1', RequirementStatus.READY, 'user1');
    expect(result.status).toBe(RequirementStatus.READY);
    expect(prismaService.requirement.update).toHaveBeenCalled();
  });

  it('should reject DRAFT to COMPLETED transition', async () => {
    prismaService.requirement.findUnique.mockResolvedValue({ id: '1', status: RequirementStatus.DRAFT });

    await expect(service.changeStatus('1', RequirementStatus.COMPLETED, 'user1')).rejects.toThrow(BadRequestException);
  });

  it('should reject DRAFT to READY transition if invalid', async () => {
    prismaService.requirement.findUnique.mockResolvedValue({ id: '1', status: RequirementStatus.DRAFT });
    validationService.validateForReadyStatus.mockReturnValue({ valid: false, missingFields: ['cargoType'] });

    await expect(service.changeStatus('1', RequirementStatus.READY, 'user1')).rejects.toThrow(BadRequestException);
  });
});
