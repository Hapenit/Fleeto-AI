import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CallOrchestratorService } from './call-orchestrator.service.js';
import { ConversationEngineService } from './conversation-engine.service.js';
import { CallSessionService } from './call-session.service.js';

@Injectable()
export class VoiceAgentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orchestrator: CallOrchestratorService,
    private readonly conversation: ConversationEngineService,
    private readonly session: CallSessionService
  ) {}

  async createCall(requirementId: string, vendorId: string) {
    return this.orchestrator.createCall(requirementId, vendorId);
  }

  async initiateCall(callId: string) {
    return this.orchestrator.initiateCall(callId);
  }

  async batchProcessOutreach(requirementId: string) {
    return this.orchestrator.batchProcessOutreach(requirementId);
  }

  async getCallsByRequirement(requirementId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.voiceCall.findMany({
        where: { requirementId },
        include: { vendor: true, extraction: true, outcome: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.voiceCall.count({ where: { requirementId } })
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getCallDetails(callId: string) {
    return this.prisma.voiceCall.findUnique({
      where: { id: callId },
      include: {
        vendor: true,
        requirement: true,
        session: true,
        transcripts: { orderBy: { sequenceNumber: 'asc' } },
        events: { orderBy: { timestamp: 'asc' } },
        extraction: true,
        outcome: true
      }
    });
  }

  async simulateVendorSpeech(callId: string, text: string) {
    // Helper function for the POC testing
    return this.conversation.processVendorUtterance(callId, text);
  }
}
