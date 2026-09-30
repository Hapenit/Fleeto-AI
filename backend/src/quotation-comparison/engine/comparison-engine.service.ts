import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Quotation, QuotationCharge, Requirement } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class ComparisonEngineService {
  private readonly logger = new Logger(ComparisonEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  async buildComparisonSnapshot(requirementId: string, userId: string) {
    const requirement = await this.prisma.requirement.findUnique({
      where: { id: requirementId }
    });
    if (!requirement) throw new Error('Requirement not found');

    // Get current active quotations for this requirement
    const activeQuotations = await this.prisma.quotation.findMany({
      where: {
        requirementId,
        status: { in: ['CONFIRMED', 'NEGOTIATED', 'UNDER_REVIEW', 'UNDER_COMPARISON'] }
      },
      include: {
        charges: true,
        conditions: true,
        vendor: true,
        requirementSnaps: true
      },
      orderBy: { version: 'desc' }, // Latest version
    });

    // Deduplicate to only get current version per vendor
    const vendorQuotationMap = new Map<string, typeof activeQuotations[0]>();
    for (const q of activeQuotations) {
      if (!vendorQuotationMap.has(q.vendorId)) {
        vendorQuotationMap.set(q.vendorId, q);
      }
    }
    const currentQuotations = Array.from(vendorQuotationMap.values());

    const comparisonNumber = `CMP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    return this.prisma.$transaction(async (tx) => {
      // Create new Comparison
      const comparison = await tx.quotationComparison.create({
        data: {
          comparisonNumber,
          requirementId,
          status: 'READY',
          createdById: userId,
        }
      });

      for (let i = 0; i < currentQuotations.length; i++) {
        const q = currentQuotations[i];

        const { knownAdditionalCharges, unknownChargeCount, knownTotalAmount, totalAmountStatus } = this.calculateTotals(q.finalAmount ? Number(q.finalAmount) : 0, q.charges);
        const { mismatches } = this.detectRequirementMismatches(requirement, q);

        const completeness = this.calculateCompleteness(q);

        const item = await tx.quotationComparisonItem.create({
          data: {
            comparisonId: comparison.id,
            quotationId: q.id,
            vendorId: q.vendorId,
            displayOrder: i,
            finalAmount: q.finalAmount,
            currency: q.currency,
            knownAdditionalCharges,
            knownAdditionalChargesAmount: knownAdditionalCharges, // Stored as Decimal
            unknownChargeCount,
            knownTotalAmount,
            totalAmountStatus,
            deliveryDuration: q.estimatedDeliveryDuration,
            quoteValidity: q.validUntil,
            vendorConfirmed: q.vendorConfirmed,
            quoteCompleteness: completeness,
          }
        });

        // Store Mismatches
        if (mismatches.length > 0) {
          await tx.requirementMismatch.createMany({
            data: mismatches.map(m => ({
              comparisonItemId: item.id,
              type: m.type as any,
              severity: m.severity as any,
              requirementValue: m.requirementValue,
              quotationValue: m.quotationValue,
              description: m.description
            }))
          });
        }
      }

      return await tx.quotationComparison.findUnique({
        where: { id: comparison.id },
        include: {
          items: {
            include: { mismatches: true, quotation: { include: { charges: true } }, vendor: true }
          }
        }
      });
    });
  }

  async getLatestComparison(requirementId: string) {
    return await this.prisma.quotationComparison.findFirst({
      where: { requirementId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { mismatches: true, quotation: { include: { charges: true, conditions: true } }, vendor: true },
          orderBy: { finalAmount: 'asc' }
        }
      }
    });
  }

  private calculateTotals(baseAmount: number, charges: QuotationCharge[]) {
    let knownAdditionalCharges = 0;
    let unknownChargeCount = 0;

    for (const charge of charges) {
      if (charge.status === 'EXTRA' && charge.amount !== null) {
        knownAdditionalCharges += Number(charge.amount);
      } else if (charge.status === 'UNKNOWN') {
        unknownChargeCount++;
      }
    }

    const knownTotalAmount = baseAmount + knownAdditionalCharges;
    const totalAmountStatus = unknownChargeCount > 0 ? 'KNOWN_TOTAL' : 'FINAL_TOTAL';

    return { knownAdditionalCharges, unknownChargeCount, knownTotalAmount, totalAmountStatus };
  }

  private detectRequirementMismatches(req: Requirement, quote: any) {
    const mismatches = [];
    const snap = quote.requirementSnaps?.[0];

    // Example mismatch checks
    if (req.vehicleType && snap?.vehicleType && req.vehicleType.toLowerCase() !== snap.vehicleType.toLowerCase()) {
      mismatches.push({
        type: 'VEHICLE_TYPE',
        severity: 'WARNING',
        requirementValue: req.vehicleType,
        quotationValue: snap.vehicleType,
        description: 'Vehicle type mismatch detected'
      });
    }

    return { mismatches };
  }

  private calculateCompleteness(quote: any): number {
    let fields = 0;
    if (quote.finalAmount) fields++;
    if (quote.currency) fields++;
    if (quote.estimatedDeliveryDuration) fields++;
    if (quote.vendorConfirmed) fields++;
    return fields;
  }
}
