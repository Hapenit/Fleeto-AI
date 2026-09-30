import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { MatchingSignal, VendorMatchContext } from './signals/matching-signal.interface.js';
import { RouteMatchSignal } from './signals/route-match.signal.js';
import { VehicleMatchSignal } from './signals/vehicle-match.signal.js';
import { CapacityFitSignal } from './signals/capacity-fit.signal.js';
import { CargoCapabilitySignal } from './signals/cargo-capability.signal.js';
import { AvailabilityFitSignal } from './signals/availability-fit.signal.js';
import { ServiceCoverageSignal } from './signals/service-coverage.signal.js';
import { HistoricalPerformanceSignal } from './signals/historical-performance.signal.js';
import { CommercialHistorySignal } from './signals/commercial-history.signal.js';
import { CommunicationReadinessSignal } from './signals/communication-readiness.signal.js';
import { RankingRunStatus, RankingEvaluationStatus, MatchFactorStatus, Requirement, OutreachSelectionStatus } from '@prisma/client';

@Injectable()
export class MatchingService {
  private signals: MatchingSignal[];
  private engineVersion = '1.0.0';

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {
    this.signals = [
      new RouteMatchSignal(),
      new VehicleMatchSignal(),
      new CapacityFitSignal(),
      new CargoCapabilitySignal(),
      new AvailabilityFitSignal(),
      new ServiceCoverageSignal(),
      new HistoricalPerformanceSignal(),
      new CommercialHistorySignal(),
      new CommunicationReadinessSignal()
    ];
  }

  async getActiveConfiguration() {
    let config = await this.prisma.vendorRankingWeightConfiguration.findFirst({
      where: { isActive: true }
    });

    if (!config) {
      const user = await this.prisma.user.findFirst();
      if (!user) throw new Error("No users found to assign default config to");
      config = await this.prisma.vendorRankingWeightConfiguration.create({
        data: {
          version: '1.0',
          isActive: true,
          createdById: user.id
        }
      });
    }

    return config;
  }

  async updateConfiguration(userId: string, data: any) {
    const total = data.routeWeight + data.vehicleWeight + data.capacityWeight + data.cargoWeight + data.availabilityWeight + data.serviceCoverageWeight + data.performanceWeight + data.commercialWeight + data.communicationWeight;
    if (Math.abs(total - 100) > 0.01) {
      throw new BadRequestException('Weights must total exactly 100');
    }

    const currentConfig = await this.getActiveConfiguration();
    const newVersion = `${parseFloat(currentConfig.version) + 0.1}`;

    await this.prisma.vendorRankingWeightConfiguration.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    const newConfig = await this.prisma.vendorRankingWeightConfiguration.create({
      data: {
        version: parseFloat(newVersion).toFixed(1),
        isActive: true,
        routeWeight: data.routeWeight,
        vehicleWeight: data.vehicleWeight,
        capacityWeight: data.capacityWeight,
        cargoWeight: data.cargoWeight,
        availabilityWeight: data.availabilityWeight,
        serviceCoverageWeight: data.serviceCoverageWeight,
        performanceWeight: data.performanceWeight,
        commercialWeight: data.commercialWeight,
        communicationWeight: data.communicationWeight,
        createdById: userId
      }
    });

    await this.auditService.createLog({ userId, action: 'MATCHING_CONFIGURATION_UPDATED', entity: 'VendorRankingWeightConfiguration', entityId: newConfig.id, metadata: { version: newConfig.version } });

    return newConfig;
  }

  async generateRanking(requirementId: string, userId: string, includeNeedsReview = false) {
    const requirement = await this.prisma.requirement.findUnique({
      where: { id: requirementId }
    });

    if (!requirement) throw new NotFoundException('Requirement not found');

    const config = await this.getActiveConfiguration();

    const existingRun = await this.prisma.vendorRankingRun.findFirst({
      where: { requirementId, status: RankingRunStatus.RUNNING }
    });
    if (existingRun) return existingRun;

    const runNumber = `RANK-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const run = await this.prisma.vendorRankingRun.create({
      data: {
        runNumber,
        requirementId,
        engineVersion: this.engineVersion,
        weightConfigurationVersion: config.version,
        createdById: userId,
        status: RankingRunStatus.RUNNING,
        startedAt: new Date()
      }
    });

    await this.auditService.createLog({ userId, action: 'MATCHING_RUN_STARTED', entity: 'VendorRankingRun', entityId: run.id, metadata: { requirementId, engineVersion: this.engineVersion, configurationVersion: config.version } });

    // Load eligibility evaluations
    const eligibleQuery: any = {
      requirementId,
      status: 'COMPLETED',
      eligible: true
    };

    if (includeNeedsReview) {
      // In future, you might want an OR condition if includeNeedsReview is true.
      // But for POC, let's keep it simple.
    }

    const eligibilities = await this.prisma.vendorEligibilityEvaluation.findMany({
      where: eligibleQuery,
      include: {
        vendor: {
          include: {
            locations: true,
            serviceRegions: true,
            vehicleCapabilities: true,
            cargoCapabilities: true,
            availabilities: { orderBy: { updatedAt: 'desc' }, take: 1 },
            performance: true
          }
        }
      }
    });

    const evaluations: any[] = [];

    for (const elg of eligibilities) {
      const evalNum = `RANK-EVAL-${runNumber}-${elg.vendor.vendorCode}`;
      const vendorCtx = elg.vendor as any;
      
      const factorResults = [];
      let rawScoreTotal = 0;
      let availableWeightTotal = 0;

      for (const signal of this.signals) {
        const result = await signal.evaluate(requirement, vendorCtx, config);
        factorResults.push(result);

        if (result.status !== MatchFactorStatus.NOT_AVAILABLE) {
          rawScoreTotal += result.normalizedScore;
          availableWeightTotal += result.weight;
        }
      }

      let finalScore = 0;
      if (availableWeightTotal > 0) {
        finalScore = (rawScoreTotal / availableWeightTotal) * 100;
      }

      evaluations.push({
        rankingNumber: evalNum,
        runId: run.id,
        requirementId,
        vendorId: elg.vendorId,
        eligibilityEvaluationId: elg.id,
        score: finalScore,
        scorePercentage: finalScore,
        status: RankingEvaluationStatus.RANKED,
        engineVersion: this.engineVersion,
        weightConfigurationVersion: config.version,
        factorResults
      });
    }

    // Sort evaluations to calculate rank and apply tie-breakers
    evaluations.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tie breaker 1: Route Match score (we need to extract it)
      const aRoute = a.factorResults.find((f: any) => f.factorCode === 'MATCH-001')?.rawScore || 0;
      const bRoute = b.factorResults.find((f: any) => f.factorCode === 'MATCH-001')?.rawScore || 0;
      if (bRoute !== aRoute) return bRoute - aRoute;
      return 0; // simplistic fallback
    });

    for (let i = 0; i < evaluations.length; i++) {
      evaluations[i].rank = i + 1;
    }

    for (const ev of evaluations) {
      await this.prisma.vendorRankingEvaluation.create({
        data: {
          rankingNumber: ev.rankingNumber,
          runId: ev.runId,
          requirementId: ev.requirementId,
          vendorId: ev.vendorId,
          eligibilityEvaluationId: ev.eligibilityEvaluationId,
          rank: ev.rank,
          score: ev.score,
          scorePercentage: ev.scorePercentage,
          status: ev.status,
          engineVersion: ev.engineVersion,
          weightConfigurationVersion: ev.weightConfigurationVersion,
          factorResults: {
            create: ev.factorResults.map((fr: any) => ({
              factorCode: fr.factorCode,
              factorName: fr.factorName,
              weight: fr.weight,
              rawScore: fr.rawScore,
              normalizedScore: fr.normalizedScore,
              status: fr.status,
              reason: fr.reason
            }))
          }
        }
      });
    }

    const updatedRun = await this.prisma.vendorRankingRun.update({
      where: { id: run.id },
      data: {
        status: RankingRunStatus.COMPLETED,
        completedAt: new Date(),
        candidateCount: eligibilities.length,
        rankedCount: evaluations.length
      }
    });

    await this.auditService.createLog({ userId, action: 'MATCHING_RUN_COMPLETED', entity: 'VendorRankingRun', entityId: run.id, metadata: { rankedCount: evaluations.length } });

    return updatedRun;
  }

  async getRankings(requirementId: string, page: number = 1, limit: number = 20) {
    const latestRun = await this.prisma.vendorRankingRun.findFirst({
      where: { requirementId, status: RankingRunStatus.COMPLETED },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestRun) {
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.vendorRankingEvaluation.findMany({
        where: { runId: latestRun.id },
        skip, take: limit,
        orderBy: { rank: 'asc' },
        include: {
          vendor: { select: { id: true, companyName: true, vendorCode: true, primaryPhone: true, preferredLanguage: true } },
          factorResults: true
        }
      }),
      this.prisma.vendorRankingEvaluation.count({ where: { runId: latestRun.id } })
    ]);

    return {
      data,
      pagination: {
        page, limit, total, totalPages: Math.ceil(total / limit)
      },
      run: latestRun
    };
  }

  async getRankingDetails(id: string) {
    const evaluation = await this.prisma.vendorRankingEvaluation.findUnique({
      where: { id },
      include: {
        vendor: true,
        factorResults: true,
        requirement: true,
      }
    });

    if (!evaluation) throw new NotFoundException('Ranking not found');
    return evaluation;
  }

  async selectVendorsForOutreach(requirementId: string, vendorIds: string[], userId: string) {
    // Validate selection limit (hardcoded to 5 for POC, can be configurable)
    const MAX_OUTREACH = 5;
    
    // First remove all existing selection for this requirement
    await this.prisma.vendorOutreachSelection.deleteMany({
      where: { requirementId }
    });

    if (vendorIds.length > MAX_OUTREACH) {
      throw new BadRequestException(`You can select up to ${MAX_OUTREACH} vendors for this outreach batch.`);
    }

    const selections = await Promise.all(vendorIds.map(vendorId => 
      this.prisma.vendorOutreachSelection.create({
        data: {
          requirementId,
          vendorId,
          selectedById: userId,
          status: OutreachSelectionStatus.SELECTED
        }
      })
    ));

    for (const sel of selections) {
      await this.auditService.createLog({ userId, action: 'VENDOR_OUTREACH_SELECTED', entity: 'VendorOutreachSelection', entityId: sel.id, metadata: { vendorId: sel.vendorId, requirementId } });
    }

    return { selectedCount: selections.length };
  }

  async getOutreachSelection(requirementId: string) {
    return this.prisma.vendorOutreachSelection.findMany({
      where: { requirementId, status: OutreachSelectionStatus.SELECTED },
      include: {
        vendor: { select: { id: true, companyName: true, vendorCode: true, primaryPhone: true, preferredLanguage: true } }
      }
    });
  }
}
