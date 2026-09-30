import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { LiveVoiceGateway } from './live-voice.gateway.js';
import { LiveVoiceEvent } from './types/index.js';

@Injectable()
export class CallEventService {
  private readonly logger = new Logger(CallEventService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: LiveVoiceGateway
  ) {}

  async publishEvent(
    callId: string,
    eventType: string,
    data: any,
    requirementId: string,
    vendorId: string
  ) {
    try {
      // Get the next sequence number for this call's events
      const lastEvent = await this.prisma.callEvent.findFirst({
        where: { callId },
        orderBy: { timestamp: 'desc' },
      });
      
      const sequenceNumber = lastEvent ? ((lastEvent.payload as any)?.sequenceNumber || 0) + 1 : 1;

      const eventPayload = {
        sequenceNumber,
        data,
      };

      // Save to database
      const savedEvent = await this.prisma.callEvent.create({
        data: {
          callId,
          eventType,
          payload: eventPayload,
        },
      });

      // Prepare envelope
      const liveEvent: LiveVoiceEvent = {
        eventId: savedEvent.id,
        eventType,
        callId,
        requirementId,
        vendorId,
        timestamp: savedEvent.timestamp.toISOString(),
        sequenceNumber,
        data,
      };

      // Broadcast
      this.gateway.broadcastEvent(callId, liveEvent);

      return liveEvent;
    } catch (err) {
      this.logger.error(`Failed to publish event ${eventType} for call ${callId}`, err);
    }
  }

  async getEvents(callId: string, limit: number = 100) {
    const events = await this.prisma.callEvent.findMany({
      where: { callId },
      orderBy: { timestamp: 'asc' },
      take: limit,
    });
    
    return events.map(e => ({
      eventId: e.id,
      eventType: e.eventType,
      timestamp: e.timestamp,
      sequenceNumber: (e.payload as any)?.sequenceNumber || 0,
      data: (e.payload as any)?.data || {},
    }));
  }
}
