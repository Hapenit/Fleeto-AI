import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateQuotationDto } from './dto/create-quotation.dto.js';
import { UpdateQuotationDto } from './dto/update-quotation.dto.js';
import { QuotationSource, QuotationStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuotationsService {
  private readonly logger = new Logger(QuotationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createQuotation(dto: CreateQuotationDto, userId: string) {
    const requirement = await this.prisma.requirement.findUnique({ where: { id: dto.requirementId } });
    if (!requirement) throw new NotFoundException('Requirement not found');

    const quotationNumber = `QUO-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    return this.prisma.$transaction(async (tx) => {
      // Check for existing quotation for this negotiation to prevent duplicates
      if (dto.negotiationId) {
        const existing = await tx.quotation.findFirst({
          where: { negotiationId: dto.negotiationId, status: { notIn: ['CANCELLED', 'EXPIRED'] } },
          orderBy: { version: 'desc' }
        });

        if (existing) {
          // Instead of throwing, create a new version
          return this.createNewVersion(existing.id, dto, userId, tx);
        }
      }

      const status: QuotationStatus = dto.vendorConfirmed ? 'CONFIRMED' : 'DRAFT';

      const quotation = await tx.quotation.create({
        data: {
          quotationNumber,
          requirementId: dto.requirementId,
          vendorId: dto.vendorId,
          callId: dto.callId,
          negotiationId: dto.negotiationId,
          initialAmount: dto.initialAmount,
          finalAmount: dto.finalAmount,
          currency: dto.currency || 'INR',
          source: dto.source || 'MANUAL',
          status,
          vendorConfirmed: dto.vendorConfirmed || false,
          createdById: userId,
          updatedById: userId,
        }
      });

      // Create Requirement Snapshot
      await tx.quotationRequirementSnapshot.create({
        data: {
          quotationId: quotation.id,
          pickupLocation: requirement.pickupCity || '',
          deliveryLocation: requirement.deliveryCity || '',
          cargoType: requirement.cargoType || 'Unknown',
          cargoWeight: requirement.cargoWeight || 0,
          cargoWeightUnit: requirement.cargoWeightUnit || 'TON',
          vehicleType: requirement.vehicleType || 'Unknown',
          pickupDate: requirement.pickupDate
        }
      });

      return quotation;
    });
  }

  async createNewVersion(existingId: string, updates: Partial<CreateQuotationDto>, userId: string, tx: Prisma.TransactionClient) {
    const existing = await tx.quotation.findUnique({
      where: { id: existingId },
      include: { charges: true, conditions: true }
    });

    if (!existing) throw new NotFoundException('Quotation not found');

    // Supercede previous version
    await tx.quotation.update({
      where: { id: existing.id },
      data: { status: 'SUPERSEDED' }
    });

    const status: QuotationStatus = updates.vendorConfirmed ? 'CONFIRMED' : (updates.negotiationId ? 'NEGOTIATED' : existing.status);

    const newVersion = await tx.quotation.create({
      data: {
        quotationNumber: existing.quotationNumber,
        requirementId: existing.requirementId,
        vendorId: existing.vendorId,
        callId: updates.callId || existing.callId,
        negotiationId: updates.negotiationId || existing.negotiationId,
        version: existing.version + 1,
        parentQuotationId: existing.id,
        initialAmount: existing.initialAmount, // Keep initial quote
        finalAmount: updates.finalAmount ?? existing.finalAmount,
        currency: updates.currency || existing.currency,
        source: updates.source || existing.source,
        status,
        vendorConfirmed: updates.vendorConfirmed ?? false,
        createdById: userId,
        updatedById: userId,
      }
    });

    // We should ideally copy charges and conditions, but for the POC we can just link or recreate them if needed.

    return newVersion;
  }

  async getQuotation(id: string) {
    const q = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        charges: true,
        conditions: true,
        evidence: true,
        confirmations: true,
        requirementSnaps: true,
        parentQuotation: true,
        vendor: true
      }
    });
    if (!q) throw new NotFoundException('Quotation not found');
    return q;
  }

  async confirmQuotation(id: string, userId: string) {
    const q = await this.prisma.quotation.findUnique({ where: { id } });
    if (!q) throw new NotFoundException();

    return this.prisma.quotation.update({
      where: { id },
      data: {
        vendorConfirmed: true,
        confirmationAt: new Date(),
        status: 'CONFIRMED',
        updatedById: userId
      }
    });
  }

  async cancelQuotation(id: string, userId: string, reason: string) {
    return this.prisma.quotation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason,
        updatedById: userId
      }
    });
  }
}
