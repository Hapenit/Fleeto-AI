import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CallEventService } from './call-event.service.js';

@Injectable()
export class TranscriptService {
  private readonly logger = new Logger(TranscriptService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventService: CallEventService
  ) {}

  async getTranscripts(callId: string) {
    return this.prisma.callTranscript.findMany({
      where: { callId },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  async searchTranscript(callId: string, query: string) {
    return this.prisma.callTranscript.findMany({
      where: {
        callId,
        text: { contains: query, mode: 'insensitive' }
      },
      orderBy: { sequenceNumber: 'asc' }
    });
  }

  // Used by Module 7 when recording final transcript
  async handleFinalTranscript(callId: string, requirementId: string, vendorId: string, transcriptData: any) {
    await this.eventService.publishEvent(
      callId,
      'transcript.final',
      transcriptData,
      requirementId,
      vendorId
    );
  }

  // Used by Module 7 to push partial transcript
  async handlePartialTranscript(callId: string, requirementId: string, vendorId: string, transcriptData: any) {
    await this.eventService.publishEvent(
      callId,
      'transcript.partial',
      transcriptData,
      requirementId,
      vendorId
    );
  }
}
