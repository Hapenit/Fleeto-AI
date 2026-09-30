import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { AuditService } from '../audit/audit.service.js';
import { RequirementValidationService } from '../requirements/requirement-validation.service.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AIExtractionStatus, RequirementStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('AiService', () => {
  let service: AiService;
  let prismaService: any;
  let aiProvider: any;
  let auditService: any;

  beforeEach(async () => {
    prismaService = {
      requirement: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      aIRequirementExtraction: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
    };

    aiProvider = {
      getProviderName: vi.fn().mockReturnValue('Gemini'),
      getModelName: vi.fn().mockReturnValue('gemini-2.5-flash'),
      getPromptVersion: vi.fn().mockReturnValue('v1'),
      extractRequirement: vi.fn(),
    };

    auditService = {
      createLog: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: prismaService },
        { provide: GeminiProvider, useValue: aiProvider },
        { provide: AuditService, useValue: auditService },
        { provide: RequirementValidationService, useValue: {} },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  describe('extractRequirement', () => {
    it('should extract and save data', async () => {
      prismaService.aIRequirementExtraction.create.mockResolvedValue({ id: 'ext1' });
      prismaService.aIRequirementExtraction.update.mockResolvedValue({ id: 'ext1', status: AIExtractionStatus.COMPLETED });
      aiProvider.extractRequirement.mockResolvedValue({
        extractedData: { pickupLocation: 'Chennai' },
        missingFields: [],
        ambiguities: [],
        confidence: 0.9,
        summary: 'Test',
      });

      const res = await service.extractRequirement({ inputText: 'test' }, 'user1', 'ip', 'ua');
      expect(res.status).toBe(AIExtractionStatus.COMPLETED);
    });

    it('should set status to NEEDS_CLARIFICATION if missing fields', async () => {
      prismaService.aIRequirementExtraction.create.mockResolvedValue({ id: 'ext1' });
      prismaService.aIRequirementExtraction.update.mockImplementation((args: any) => args.data);
      aiProvider.extractRequirement.mockResolvedValue({
        extractedData: {},
        missingFields: ['pickupLocation'],
        ambiguities: [],
        confidence: 0.5,
        summary: 'Test',
      });

      const res = await service.extractRequirement({ inputText: 'test' }, 'user1', 'ip', 'ua');
      expect(res.status).toBe(AIExtractionStatus.NEEDS_CLARIFICATION);
    });

    it('should handle AI provider failure', async () => {
      prismaService.aIRequirementExtraction.create.mockResolvedValue({ id: 'ext1' });
      aiProvider.extractRequirement.mockRejectedValue(new Error('AI failed'));

      await expect(service.extractRequirement({ inputText: 'test' }, 'user1', 'ip', 'ua'))
        .rejects.toThrow(BadRequestException);
      expect(prismaService.aIRequirementExtraction.update).toHaveBeenCalledWith({
        where: { id: 'ext1' },
        data: { status: AIExtractionStatus.FAILED }
      });
    });
  });
});
