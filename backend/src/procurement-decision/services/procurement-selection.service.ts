import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfirmSelectionDto } from '../dto/confirm-selection.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProcurementSelectionService {
  private readonly logger = new Logger(ProcurementSelectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createDecisionWorkspace(requirementId: string, userId: string) {
    const existing = await this.prisma.procurementDecision.findFirst({
      where: { requirementId, status: { in: ['DRAFT', 'PENDING_DECISION'] } }
    });
    if (existing) return existing;

    const req = await this.prisma.requirement.findUnique({ where: { id: requirementId } });
    if (!req) throw new NotFoundException('Requirement not found');

    const latestComparison = await this.prisma.quotationComparison.findFirst({
      where: { requirementId },
      orderBy: { createdAt: 'desc' }
    });

    const decisionNumber = `DEC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    
    return await this.prisma.procurementDecision.create({
      data: {
        decisionNumber,
        requirementId,
        comparisonId: latestComparison?.id,
        status: 'PENDING_DECISION',
        createdById: userId,
      }
    });
  }

  async confirmSelection(decisionId: string, dto: ConfirmSelectionDto, userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      // Use FOR UPDATE equivalent lock internally if possible, or version checking
      const decision = await tx.procurementDecision.findUnique({
        where: { id: decisionId },
        include: { comparison: { include: { items: true } }, requirement: true }
      });
      if (!decision) throw new NotFoundException('Decision workspace not found');
      if (decision.status === 'CONFIRMED') throw new ConflictException('Decision already confirmed');
      if (decision.version !== dto.version) throw new ConflictException('Decision was modified by another user');

      const quotation = await tx.quotation.findUnique({ where: { id: dto.quotationId } });
      if (!quotation) throw new NotFoundException('Quotation not found');
      if (quotation.status === 'CANCELLED') throw new ConflictException('Quotation is cancelled');

      // Update Decision
      const updatedDecision = await tx.procurementDecision.update({
        where: { id: decisionId },
        data: {
          status: 'CONFIRMED',
          selectedQuotationId: quotation.id,
          selectedVendorId: quotation.vendorId,
          confirmedById: userId,
          confirmedAt: new Date(),
          decisionReason: dto.reason,
          decisionNotes: dto.notes,
          version: { increment: 1 }
        }
      });

      // Fetch all quotations from the current comparison
      const comparisonQuotationIds = decision.comparison?.items.map(i => i.quotationId) || [];
      const comparisonQuotations = comparisonQuotationIds.length > 0 
        ? await tx.quotation.findMany({ where: { id: { in: comparisonQuotationIds } } }) 
        : [];

      for (const q of comparisonQuotations) {
        const isSelected = q.id === quotation.id;
        // Update Quotation
        await tx.quotation.update({
          where: { id: q.id },
          data: { status: isSelected ? 'SELECTED' : 'NOT_SELECTED' }
        });

        // Create Item
        await tx.procurementDecisionItem.create({
          data: {
            decisionId,
            quotationId: q.id,
            vendorId: q.vendorId,
            decisionStatus: isSelected ? 'SELECTED' : 'NOT_SELECTED',
          }
        });
      }

      // Update Requirement
      await tx.requirement.update({
        where: { id: decision.requirementId },
        data: { status: 'VENDOR_SELECTED' }
      });
      await tx.requirementStatusHistory.create({
        data: {
          requirementId: decision.requirementId,
          fromStatus: decision.requirement.status,
          toStatus: 'VENDOR_SELECTED',
          changedById: userId,
        }
      });

      // Audit Record
      await tx.procurementDecisionAudit.create({
        data: {
          decisionId,
          action: 'SELECTION_CONFIRMED',
          userId,
          metadata: { quotationId: quotation.id, reason: dto.reason }
        }
      });

      return updatedDecision;
    });
  }
}
