import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { AIRequirementExtractDto, AIRequirementApplyDto, AIRequirementRejectDto } from './dto/ai.dto.js';
import { AIExtractionStatus, RequirementStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service.js';
import { RequirementValidationService } from '../requirements/requirement-validation.service.js';

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private aiProvider: GeminiProvider,
    private auditService: AuditService,
    private validationService: RequirementValidationService
  ) {}

  async extractRequirement(dto: AIRequirementExtractDto, userId: string, ip: string, userAgent: string) {
    if (dto.requirementId) {
      const existingReq = await this.prisma.requirement.findUnique({ where: { id: dto.requirementId } });
      if (!existingReq) throw new NotFoundException('Requirement not found');
      if (existingReq.createdById !== userId) throw new ForbiddenException('Access denied');
      if (existingReq.status !== RequirementStatus.DRAFT) throw new BadRequestException('Can only run AI extraction on DRAFT requirements');
    }

    const extraction = await this.prisma.aIRequirementExtraction.create({
      data: {
        requirementId: dto.requirementId || null,
        inputText: dto.inputText,
        provider: this.aiProvider.getProviderName(),
        model: this.aiProvider.getModelName(),
        promptVersion: this.aiProvider.getPromptVersion(),
        status: AIExtractionStatus.PROCESSING,
        createdById: userId,
      }
    });

    await this.auditService.createLog({ userId, action: 'AI_REQUIREMENT_EXTRACTION_STARTED', entity: 'AIRequirementExtraction', entityId: extraction.id, ipAddress: ip, userAgent });

    try {
      const result = await this.aiProvider.extractRequirement({
        text: dto.inputText,
        currentDate: new Date().toISOString().split('T')[0],
        timezone: 'Asia/Kolkata',
      });

      let status: AIExtractionStatus = AIExtractionStatus.COMPLETED;
      if (result.missingFields.length > 0 || result.ambiguities.length > 0) {
        status = AIExtractionStatus.NEEDS_CLARIFICATION;
      }

      const updated = await this.prisma.aIRequirementExtraction.update({
        where: { id: extraction.id },
        data: {
          extractedData: result.extractedData,
          missingFields: result.missingFields,
          ambiguities: result.ambiguities,
          confidence: result.confidence,
          summary: result.summary,
          status,
        }
      });

      await this.auditService.createLog({ userId, action: 'AI_REQUIREMENT_EXTRACTION_COMPLETED', entity: 'AIRequirementExtraction', entityId: extraction.id, ipAddress: ip, userAgent });

      return updated;
    } catch (error) {
      await this.prisma.aIRequirementExtraction.update({
        where: { id: extraction.id },
        data: { status: AIExtractionStatus.FAILED }
      });
      await this.auditService.createLog({ userId, action: 'AI_REQUIREMENT_EXTRACTION_FAILED', entity: 'AIRequirementExtraction', entityId: extraction.id, ipAddress: ip, userAgent });
      throw new BadRequestException({
        message: 'AI output could not be validated',
        errorCode: 'AI_OUTPUT_VALIDATION_FAILED'
      });
    }
  }

  async applyExtraction(extractionId: string, dto: AIRequirementApplyDto, userId: string, ip: string, userAgent: string) {
    const extraction = await this.prisma.aIRequirementExtraction.findUnique({
      where: { id: extractionId },
      include: { requirement: true }
    });

    if (!extraction) throw new NotFoundException('Extraction not found');
    if (extraction.createdById !== userId) throw new ForbiddenException('Access denied');
    if (extraction.status === AIExtractionStatus.APPLIED) throw new BadRequestException('Extraction already applied');
    if (extraction.status === AIExtractionStatus.REJECTED) throw new BadRequestException('Extraction already rejected');
    
    let requirementId = extraction.requirementId;

    if (requirementId) {
      if (extraction.requirement?.status !== RequirementStatus.DRAFT) {
        throw new BadRequestException('Cannot apply AI data to non-DRAFT requirement');
      }
      // Update existing
      await this.prisma.requirement.update({
        where: { id: requirementId },
        data: dto.acceptedFields
      });
    } else {
      // Create new requirement from AI
      const latestReq = await this.prisma.requirement.findFirst({
        where: { requirementNumber: { startsWith: `REQ-${new Date().getFullYear()}-` } },
        orderBy: { requirementNumber: 'desc' }
      });
      let nextNumber = 1;
      if (latestReq) {
        const parts = latestReq.requirementNumber.split('-');
        if (parts.length === 3) nextNumber = parseInt(parts[2], 10) + 1;
      }
      const requirementNumber = `REQ-${new Date().getFullYear()}-${nextNumber.toString().padStart(6, '0')}`;

      const newReq = await this.prisma.requirement.create({
        data: {
          ...dto.acceptedFields,
          requirementNumber,
          createdById: userId,
          status: RequirementStatus.DRAFT,
        }
      });
      requirementId = newReq.id;

      await this.prisma.requirementStatusHistory.create({
        data: { requirementId, toStatus: RequirementStatus.DRAFT, changedById: userId, reason: 'Created via AI extraction' }
      });
    }

    const updatedExtraction = await this.prisma.aIRequirementExtraction.update({
      where: { id: extractionId },
      data: { status: AIExtractionStatus.APPLIED, requirementId }
    });

    await this.auditService.createLog({ userId, action: 'AI_REQUIREMENT_EXTRACTION_APPLIED', entity: 'AIRequirementExtraction', entityId: extraction.id, metadata: { appliedFields: Object.keys(dto.acceptedFields) }, ipAddress: ip, userAgent });

    return updatedExtraction;
  }

  async rejectExtraction(extractionId: string, dto: AIRequirementRejectDto, userId: string, ip: string, userAgent: string) {
    const extraction = await this.prisma.aIRequirementExtraction.findUnique({ where: { id: extractionId } });
    if (!extraction) throw new NotFoundException('Extraction not found');
    if (extraction.createdById !== userId) throw new ForbiddenException('Access denied');
    if (extraction.status === AIExtractionStatus.APPLIED) throw new BadRequestException('Extraction already applied');

    const updated = await this.prisma.aIRequirementExtraction.update({
      where: { id: extractionId },
      data: { status: AIExtractionStatus.REJECTED }
    });

    await this.auditService.createLog({ userId, action: 'AI_REQUIREMENT_EXTRACTION_REJECTED', entity: 'AIRequirementExtraction', entityId: extraction.id, metadata: { reason: dto.reason }, ipAddress: ip, userAgent });
    return updated;
  }

  async getExtractionHistory(requirementId: string, userId: string) {
    return this.prisma.aIRequirementExtraction.findMany({
      where: { requirementId, createdById: userId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
