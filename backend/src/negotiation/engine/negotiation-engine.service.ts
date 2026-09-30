import { Injectable, Logger, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { NEGOTIATION_AI_PROVIDER } from '../providers/negotiation-ai-provider.interface.js';
import type { NegotiationAIProvider, NegotiationContext } from '../providers/negotiation-ai-provider.interface.js';
import { PolicyValidatorService } from '../policy/policy-validator.service.js';

@Injectable()
export class NegotiationEngineService {
  private readonly logger = new Logger(NegotiationEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(NEGOTIATION_AI_PROVIDER) private readonly aiProvider: NegotiationAIProvider,
    private readonly policyValidator: PolicyValidatorService
  ) {}

  async startNegotiation(callId: string, userId: string) {
    const call = await this.prisma.voiceCall.findUnique({
      where: { id: callId },
      include: { requirement: true, vendor: true, analysis: true }
    });

    if (!call) throw new NotFoundException('Call not found');

    const policy = await this.prisma.negotiationPolicy.findUnique({
      where: { requirementId: call.requirementId }
    });

    if (!policy) {
      throw new BadRequestException('Negotiation policy not configured for this requirement');
    }

    if (!policy.enabled) {
      throw new BadRequestException('Negotiation is disabled for this requirement');
    }

    let session = await this.prisma.negotiationSession.findUnique({
      where: { callId }
    });

    if (session) {
      if (['COMPLETED', 'FAILED', 'STOPPED'].includes(session.status)) {
        // Technically should create new version, but for POC we restart the existing one or reset it
        session = await this.prisma.negotiationSession.update({
          where: { id: session.id },
          data: {
            status: 'NEGOTIATION_NOT_STARTED',
            attemptCount: 0,
            currentOfferPrice: null,
            finalNegotiatedPrice: null,
            startedAt: new Date()
          }
        });
      }
      return session;
    }

    const negotiationNumber = `NEG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const initialVendorQuote = call.analysis?.quoteAmount || null;

    session = await this.prisma.negotiationSession.create({
      data: {
        negotiationNumber,
        callId,
        requirementId: call.requirementId,
        vendorId: call.vendorId,
        policyId: policy.id,
        status: 'ASSESSING',
        mode: policy.mode,
        targetPrice: policy.targetPrice,
        maximumAuthorizedPrice: policy.maximumAuthorizedPrice,
        minimumVendorPrice: policy.minimumVendorPrice,
        maxAttempts: policy.maxAttempts,
        currentVendorPrice: initialVendorQuote,
        createdById: userId,
        startedAt: new Date()
      }
    });

    if (initialVendorQuote) {
      await this.prisma.negotiationAttempt.create({
        data: {
          sessionId: session.id,
          attemptNumber: 0,
          speaker: 'VENDOR',
          action: 'INITIAL_VENDOR_QUOTE',
          proposedAmount: initialVendorQuote,
          currency: 'INR',
          status: 'COMPLETED'
        }
      });
    }

    // Trigger AI logic in background
    this.executeAI(session.id).catch(e => this.logger.error(`AI execution failed: ${e.message}`));

    return session;
  }

  async executeAI(sessionId: string) {
    const session = await this.prisma.negotiationSession.findUnique({
      where: { id: sessionId },
      include: { call: { include: { transcripts: true } }, requirement: true, vendor: true, policy: true, attempts: true }
    });

    if (!session || !session.policy) return;

    if (['COMPLETED', 'FAILED', 'STOPPED', 'LIMIT_REACHED', 'PRICE_AGREED', 'HUMAN_APPROVAL_REQUIRED'].includes(session.status)) {
      return;
    }

    const context: NegotiationContext = {
      requirement: {
        pickupLocation: session.requirement.pickupCity || '',
        deliveryLocation: session.requirement.deliveryCity || '',
        cargoType: session.requirement.cargoType || 'Unknown',
        cargoWeight: session.requirement.cargoWeight || 0,
        vehicleType: session.requirement.vehicleType || 'Unknown',
        pickupDate: session.requirement.pickupDate?.toISOString() || 'Any'
      },
      vendor: {
        preferredLanguage: session.vendor.preferredLanguage
      },
      currentQuote: {
        amount: session.currentVendorPrice || 0,
        currency: session.currency || 'INR'
      },
      policy: {
        targetPrice: session.policy.targetPrice || 0,
        maximumAuthorizedPrice: session.policy.maximumAuthorizedPrice || 99999999,
        maxAttempts: session.policy.maxAttempts
      },
      analysis: {
        objections: [],
        conditions: [],
        negotiationSignals: []
      },
      conversation: {
        recentTranscript: session.call.transcripts
      }
    };

    try {
      const proposal = await this.aiProvider.generateProposal(context);
      
      this.policyValidator.validateProposal(proposal, session.policy, session.attemptCount);

      if (proposal.requiresApproval || (proposal.proposedAmount && session.policy.maximumAuthorizedPrice && proposal.proposedAmount > session.policy.maximumAuthorizedPrice)) {
        await this.prisma.negotiationSession.update({
          where: { id: session.id },
          data: { status: 'HUMAN_APPROVAL_REQUIRED' }
        });

        await this.prisma.negotiationEscalation.create({
          data: {
            sessionId: session.id,
            reason: 'HUMAN_APPROVAL_REQUIRED',
            description: proposal.reason
          }
        });
        return;
      }

      const actionMapping: Record<string, string> = {
        'ASK_FOR_BETTER_PRICE': 'AI_COUNTER_OFFER',
        'MAKE_COUNTER_OFFER': 'AI_COUNTER_OFFER',
        'ACCEPT_VENDOR_PRICE': 'PRICE_CONFIRMATION',
        'ASK_CLARIFICATION': 'AI_COUNTER_OFFER', // fallback
        'STOP_NEGOTIATION': 'STOP',
        'ESCALATE': 'ESCALATE'
      };

      const attempt = await this.prisma.negotiationAttempt.create({
        data: {
          sessionId: session.id,
          attemptNumber: session.attemptCount + 1,
          speaker: 'AI',
          action: (actionMapping[proposal.action] || 'AI_COUNTER_OFFER') as any,
          proposedAmount: proposal.proposedAmount,
          currency: proposal.currency || session.currency,
          message: proposal.speech,
          reason: proposal.reason,
          status: 'COMPLETED'
        }
      });

      let nextStatus = session.status;
      if (proposal.action === 'MAKE_COUNTER_OFFER') {
        nextStatus = 'COUNTER_OFFER_SENT';
      } else if (proposal.action === 'ACCEPT_VENDOR_PRICE') {
        nextStatus = 'PRICE_AGREED';
      } else if (proposal.action === 'STOP_NEGOTIATION') {
        nextStatus = 'STOPPED';
      }

      await this.prisma.negotiationSession.update({
        where: { id: session.id },
        data: { 
          status: nextStatus as any, 
          attemptCount: session.attemptCount + 1,
          currentOfferPrice: proposal.proposedAmount || session.currentOfferPrice,
          finalNegotiatedPrice: proposal.action === 'ACCEPT_VENDOR_PRICE' ? proposal.proposedAmount : session.finalNegotiatedPrice,
          completedAt: ['PRICE_AGREED', 'STOPPED'].includes(nextStatus) ? new Date() : null
        }
      });

      if (nextStatus === 'PRICE_AGREED') {
        await this.prisma.negotiationResult.upsert({
          where: { sessionId: session.id },
          create: {
            sessionId: session.id,
            status: 'PRICE_AGREED',
            finalNegotiatedPrice: proposal.proposedAmount,
            vendorConfirmed: true,
            currency: 'INR'
          },
          update: {
            status: 'PRICE_AGREED',
            finalNegotiatedPrice: proposal.proposedAmount,
            vendorConfirmed: true
          }
        });
      }
    } catch (error: any) {
      this.logger.error(`AI execution error: ${error.message}`);
      await this.prisma.negotiationSession.update({
        where: { id: session.id },
        data: { status: 'FAILED' }
      });
    }
  }

  async getSession(id: string) {
    return this.prisma.negotiationSession.findUnique({
      where: { id },
      include: {
        policy: true,
        attempts: { orderBy: { attemptNumber: 'asc' } },
        escalations: true,
        result: true,
        call: { include: { vendor: true, requirement: true } }
      }
    });
  }

  async getSessionByCallId(callId: string) {
    return this.prisma.negotiationSession.findUnique({
      where: { callId },
      include: {
        policy: true,
        attempts: { orderBy: { attemptNumber: 'asc' } },
        escalations: true,
        result: true,
        call: { include: { vendor: true, requirement: true } }
      }
    });
  }
}
