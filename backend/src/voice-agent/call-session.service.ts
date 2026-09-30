import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CallEventService } from '../live-voice/call-event.service.js';
import { TranscriptService } from '../live-voice/transcript.service.js';

@Injectable()
export class CallSessionService {
  private readonly logger = new Logger(CallSessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly callEventService: CallEventService,
    private readonly transcriptService: TranscriptService
  ) {}

  async createSession(callId: string, sessionId: string) {
    return this.prisma.callSession.create({
      data: {
        callId,
        sessionId,
        currentState: 'INTRODUCTION',
        startedAt: new Date(),
        lastActivityAt: new Date(),
      }
    });
  }

  async getSession(callId: string) {
    return this.prisma.callSession.findUnique({ where: { callId } });
  }

  async updateSessionState(callId: string, state: string, turnIncrement = 1) {
    return this.prisma.callSession.update({
      where: { callId },
      data: {
        currentState: state,
        conversationTurn: { increment: turnIncrement },
        lastActivityAt: new Date(),
      }
    });
  }

  async endSession(callId: string) {
    return this.prisma.callSession.update({
      where: { callId },
      data: {
        endedAt: new Date(),
      }
    });
  }

  async addTranscript(callId: string, speaker: 'AI' | 'VENDOR' | 'SYSTEM', text: string, sequenceNumber: number) {
    const transcript = await this.prisma.callTranscript.create({
      data: { callId, speaker, text, sequenceNumber }
    });
    
    // Broadcast
    const call = await this.prisma.voiceCall.findUnique({ where: { id: callId } });
    if (call) {
      await this.transcriptService.handleFinalTranscript(callId, call.requirementId, call.vendorId, transcript);
    }
    return transcript;
  }

  async getTranscripts(callId: string) {
    return this.prisma.callTranscript.findMany({
      where: { callId },
      orderBy: { sequenceNumber: 'asc' }
    });
  }

  async addEvent(callId: string, eventType: string, payload?: any) {
    // Instead of duplicating DB writes, we let CallEventService handle it
    const call = await this.prisma.voiceCall.findUnique({ where: { id: callId } });
    if (call) {
      await this.callEventService.publishEvent(callId, eventType, payload, call.requirementId, call.vendorId);
    }
  }
}
