import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CallHistoryQueryDto } from '../dto/call-history-query.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class CallHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getCalls(query: CallHistoryQueryDto) {
    const { page = 1, limit = 25, search, status, outcome, language, vendorId, requirementId, recordingStatus } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VoiceCallWhereInput = {};

    if (search) {
      where.OR = [
        { callNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { companyName: { contains: search, mode: 'insensitive' } } },
        { vendor: { vendorCode: { contains: search, mode: 'insensitive' } } },
        { requirement: { requirementNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (status) {
      where.status = status as any;
    }
    if (outcome) {
      where.outcome = { outcome: outcome as any };
    }
    if (language) {
      where.language = language;
    }
    if (vendorId) {
      where.vendorId = vendorId;
    }
    if (requirementId) {
      where.requirementId = requirementId;
    }
    if (recordingStatus) {
      where.recording = { status: recordingStatus as any };
    }

    const [total, items] = await Promise.all([
      this.prisma.voiceCall.count({ where }),
      this.prisma.voiceCall.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: { select: { id: true, companyName: true, vendorCode: true } },
          requirement: { select: { id: true, requirementNumber: true } },
          outcome: true,
          recording: { select: { status: true, durationSeconds: true } }
        }
      })
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getCallDetails(callId: string, userId: string) {
    const call = await this.prisma.voiceCall.findUnique({
      where: { id: callId },
      include: {
        vendor: true,
        requirement: true,
        recording: true,
        extraction: true,
        outcome: true,
        analysis: true,
        quotations: true,
        negotiations: true,
      }
    });

    if (!call) throw new NotFoundException('Call not found');

    // Fetch procurement decision if exists (we find through requirement and quotation)
    let procurementDecision = null;
    const confirmedQuotation = call.quotations?.find(q => q.status === 'SELECTED' || q.status === 'CONFIRMED');
    
    if (confirmedQuotation) {
      procurementDecision = await this.prisma.procurementDecision.findFirst({
        where: { selectedQuotationId: confirmedQuotation.id },
        include: { confirmedBy: { select: { firstName: true, lastName: true } } }
      });
    }

    // Log the view action
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CALL_HISTORY_VIEWED',
        entity: 'VoiceCall',
        entityId: call.id,
      }
    });

    return {
      call: {
        id: call.id,
        callNumber: call.callNumber,
        status: call.status,
        phoneNumber: this.maskPhoneNumber(call.phoneNumber),
        language: call.language,
        startedAt: call.startedAt,
        connectedAt: call.connectedAt,
        endedAt: call.endedAt,
        durationSeconds: call.durationSeconds,
      },
      vendor: call.vendor,
      requirement: call.requirement,
      recording: call.recording ? {
        ...call.recording,
        fileSizeBytes: call.recording.fileSizeBytes?.toString(),
      } : null,
      extraction: call.extraction,
      outcome: call.outcome,
      analysis: call.analysis,
      quotation: confirmedQuotation || call.quotations?.[0], // Get the confirmed one or the first available
      negotiation: call.negotiations?.[0],
      procurementDecision
    };
  }

  async getCallEvents(callId: string) {
    return this.prisma.callEvent.findMany({
      where: { callId },
      orderBy: { timestamp: 'asc' }
    });
  }

  async getTranscript(callId: string, query: { page?: number, limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.callTranscript.count({ where: { callId } }),
      this.prisma.callTranscript.findMany({
        where: { callId },
        skip,
        take: limit,
        orderBy: { sequenceNumber: 'asc' }
      })
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  private maskPhoneNumber(phone: string): string {
    if (!phone) return phone;
    // Example: +919876543242 -> +91 98******42
    if (phone.length >= 10) {
      const prefix = phone.substring(0, 5); // +91 9
      const suffix = phone.substring(phone.length - 2);
      return `${prefix}******${suffix}`;
    }
    return '******';
  }
}
