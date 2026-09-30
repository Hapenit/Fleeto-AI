import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { TELEPHONY_PROVIDER_TOKEN } from './telephony/telephony.provider.js';
import type { TelephonyProvider } from './telephony/telephony.provider.js';
import { CallSessionService } from './call-session.service.js';
import { ConversationEngineService } from './conversation-engine.service.js';

@Injectable()
export class CallOrchestratorService {
  private readonly logger = new Logger(CallOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TELEPHONY_PROVIDER_TOKEN)
    private readonly telephonyProvider: TelephonyProvider,
    private readonly sessionService: CallSessionService,
    private readonly conversationEngine: ConversationEngineService
  ) {}

  async createCall(requirementId: string, vendorId: string, outreachSelectionId?: string) {
    const requirement = await this.prisma.requirement.findUnique({ where: { id: requirementId } });
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });

    if (!requirement || !vendor) {
      throw new Error('Requirement or Vendor not found');
    }

    if (!vendor.primaryPhone) {
      throw new Error('Vendor primary phone missing');
    }

    const runNumber = `CALL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const call = await this.prisma.voiceCall.create({
      data: {
        callNumber: runNumber,
        requirementId,
        vendorId,
        outreachSelectionId,
        provider: 'exotel',
        phoneNumber: vendor.primaryPhone,
        status: 'QUEUED',
      }
    });

    await this.sessionService.addEvent(call.id, 'CALL_CREATED');

    return call;
  }

  async initiateCall(callId: string) {
    const call = await this.prisma.voiceCall.findUnique({ where: { id: callId } });
    if (!call) throw new Error('Call not found');

    if (call.status !== 'QUEUED') {
      throw new Error(`Cannot initiate call in status ${call.status}`);
    }

    await this.prisma.voiceCall.update({ where: { id: callId }, data: { status: 'INITIATING' } });
    await this.sessionService.addEvent(callId, 'CALL_INITIATED');

    try {
      // In a real app, the webhook URL would be configured per environment
      const webhookUrl = process.env.VOICE_WEBHOOK_PUBLIC_URL || 'http://localhost:3001/api/webhooks/telephony/exotel';
      
      const result = await this.telephonyProvider.initiateCall({
        callId: call.id,
        phoneNumber: call.phoneNumber,
        webhookUrl
      });

      await this.prisma.voiceCall.update({
        where: { id: callId },
        data: {
          providerCallId: result.providerCallId,
          status: 'RINGING',
        }
      });

      // Create session
      await this.sessionService.createSession(callId, `SESS-${callId}`);
      
      return result;
    } catch (err: any) {
      this.logger.error(`Failed to initiate call ${callId}`, err);
      await this.prisma.voiceCall.update({
        where: { id: callId },
        data: { status: 'FAILED', failureReason: err.message }
      });
      await this.sessionService.addEvent(callId, 'CALL_FAILED', { reason: err.message });
      throw err;
    }
  }

  async handleCallConnected(callId: string) {
    this.logger.log(`Call ${callId} connected`);
    await this.prisma.voiceCall.update({
      where: { id: callId },
      data: { status: 'CONNECTED', connectedAt: new Date() }
    });
    await this.sessionService.addEvent(callId, 'CALL_CONNECTED');

    // Automatically trigger greeting for simulation/POC purposes
    await this.prisma.voiceCall.update({ where: { id: callId }, data: { status: 'GREETING' } });
    await this.conversationEngine.generateGreeting(callId);
    await this.prisma.voiceCall.update({ where: { id: callId }, data: { status: 'CONVERSATION' } });
  }

  async handleCallCompleted(callId: string, finalStatus: 'COMPLETED' | 'NO_ANSWER' | 'BUSY' | 'FAILED' = 'COMPLETED') {
    this.logger.log(`Call ${callId} completed with status ${finalStatus}`);
    await this.prisma.voiceCall.update({
      where: { id: callId },
      data: { status: finalStatus, endedAt: new Date() }
    });
    await this.sessionService.addEvent(callId, `CALL_${finalStatus}`);
    await this.sessionService.endSession(callId);

    if (finalStatus === 'COMPLETED') {
      await this.generateOutcome(callId);
    }
  }

  private async generateOutcome(callId: string) {
    const extraction = await this.prisma.callExtraction.findUnique({ where: { callId } });
    
    let outcomeType: any = 'COMPLETED_WITHOUT_QUOTE';
    
    if (extraction) {
      if (extraction.quotedAmount) outcomeType = 'QUOTE_RECEIVED';
      else if (extraction.vendorAvailable) outcomeType = 'AVAILABLE_NO_QUOTE';
      else if (extraction.vendorAvailable === false) outcomeType = 'NOT_AVAILABLE';
    }

    await this.prisma.callOutcome.create({
      data: {
        callId,
        outcome: outcomeType,
        summary: `Call finished. Extracted ${extraction?.quotedAmount ? 'Quote' : 'No Quote'}`,
      }
    });
  }

  async batchProcessOutreach(requirementId: string) {
    const outreach = await this.prisma.vendorOutreachSelection.findMany({
      where: { requirementId, status: 'SELECTED' }
    });

    const calls = [];
    for (const sel of outreach) {
      // Check if active call exists
      const existing = await this.prisma.voiceCall.findFirst({
        where: {
          requirementId,
          vendorId: sel.vendorId,
          status: { in: ['QUEUED', 'INITIATING', 'RINGING', 'CONNECTED', 'GREETING', 'CONVERSATION', 'COMPLETING'] }
        }
      });

      if (!existing) {
        const call = await this.createCall(requirementId, sel.vendorId, sel.id);
        calls.push(call);
        // POC: initiate sequentially immediately or let a worker do it
        try {
          await this.initiateCall(call.id);
        } catch(e) {
          this.logger.error(`Failed to initiate ${call.id}`);
        }
      }
    }
    
    return calls;
  }
}
