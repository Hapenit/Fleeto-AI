import { Test, TestingModule } from '@nestjs/testing';
import { RequirementsService } from './requirements.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RequirementNumberService } from './requirement-number.service.js';
import { RequirementStatusService } from './requirement-status.service.js';
import { RequirementValidationService } from './requirement-validation.service.js';
import { RequirementStatus, Role } from '@prisma/client';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('RequirementsService', () => {
  let service: RequirementsService;
  let prismaService: any;
  let numberService: any;
  let statusService: any;
  let validationService: any;

  beforeEach(async () => {
    prismaService = {
      requirement: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      requirementStatusHistory: {
        create: vi.fn(),
      },
    };

    numberService = {
      generateRequirementNumber: vi.fn().mockResolvedValue('REQ-2026-000001'),
    };

    statusService = {
      changeStatus: vi.fn(),
    };

    validationService = {
      validateForReadyStatus: vi.fn().mockReturnValue({ valid: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequirementsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: RequirementNumberService, useValue: numberService },
        { provide: RequirementStatusService, useValue: statusService },
        { provide: RequirementValidationService, useValue: validationService },
      ],
    }).compile();

    service = module.get<RequirementsService>(RequirementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a valid requirement', async () => {
      const createDto = { customerName: 'Test', pickupLocation: 'A', deliveryLocation: 'B' };
      prismaService.requirement.create.mockResolvedValue({ id: '1', ...createDto, requirementNumber: 'REQ-2026-000001', status: 'DRAFT' });
      
      const result = await service.create(createDto as any, 'user1');
      expect(result.requirementNumber).toBe('REQ-2026-000001');
      expect(prismaService.requirementStatusHistory.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      prismaService.requirement.findUnique.mockResolvedValue(null);
      await expect(service.findOne('invalid', { id: 'user1', role: Role.MARKETING_USER })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not admin and not creator', async () => {
      prismaService.requirement.findUnique.mockResolvedValue({ id: '1', createdById: 'otherUser' });
      await expect(service.findOne('1', { id: 'user1', role: Role.MARKETING_USER })).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to view any requirement', async () => {
      prismaService.requirement.findUnique.mockResolvedValue({ id: '1', createdById: 'otherUser', statusHistory: [] });
      const result = await service.findOne('1', { id: 'admin1', role: Role.ADMIN });
      expect(result.id).toBe('1');
    });
  });
});
