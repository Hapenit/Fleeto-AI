import { Injectable, BadRequestException } from '@nestjs/common';
import { RequirementStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { RequirementValidationService } from './requirement-validation.service.js';

@Injectable()
export class RequirementStatusService {
  constructor(
    private prisma: PrismaService,
    private validationService: RequirementValidationService
  ) {}

  // Defines allowed transitions
  private readonly transitions: Record<RequirementStatus, RequirementStatus[]> = {
    DRAFT: [RequirementStatus.READY, RequirementStatus.VALIDATION_REQUIRED, RequirementStatus.CANCELLED],
    VALIDATION_REQUIRED: [RequirementStatus.READY, RequirementStatus.DRAFT, RequirementStatus.CANCELLED],
    READY: [RequirementStatus.MATCHING, RequirementStatus.DRAFT, RequirementStatus.CANCELLED],
    MATCHING: [RequirementStatus.CALLING, RequirementStatus.CANCELLED, RequirementStatus.READY],
    CALLING: [RequirementStatus.QUOTATION_RECEIVED, RequirementStatus.CANCELLED, RequirementStatus.READY],
    QUOTATION_RECEIVED: [RequirementStatus.UNDER_REVIEW, RequirementStatus.CANCELLED],
    UNDER_REVIEW: [RequirementStatus.VENDOR_SELECTED, RequirementStatus.CANCELLED],
    VENDOR_SELECTED: [RequirementStatus.COMPLETED, RequirementStatus.CANCELLED],
    COMPLETED: [],
    CANCELLED: [],
  };

  canTransition(from: RequirementStatus, to: RequirementStatus): boolean {
    return this.transitions[from]?.includes(to) || false;
  }

  async changeStatus(requirementId: string, toStatus: RequirementStatus, userId: string, reason?: string) {
    const requirement = await this.prisma.requirement.findUnique({ where: { id: requirementId } });
    if (!requirement) {
      throw new BadRequestException('Requirement not found');
    }

    if (!this.canTransition(requirement.status, toStatus)) {
      throw new BadRequestException(`Cannot transition from ${requirement.status} to ${toStatus}`);
    }

    if (toStatus === RequirementStatus.READY || toStatus === RequirementStatus.MATCHING) {
      const validation = this.validationService.validateForReadyStatus(requirement);
      if (!validation.valid) {
        throw new BadRequestException({
          message: 'Requirement is missing mandatory fields',
          errorCode: 'REQUIREMENT_VALIDATION_FAILED',
          details: { missingFields: validation.missingFields, errors: validation.errors },
        });
      }
    }

    const updated = await this.prisma.requirement.update({
      where: { id: requirementId },
      data: { status: toStatus },
    });

    await this.prisma.requirementStatusHistory.create({
      data: {
        requirementId,
        fromStatus: requirement.status,
        toStatus,
        changedById: userId,
        reason,
      },
    });

    return updated;
  }
}
