import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class CallMonitoringService {
  private readonly logger = new Logger(CallMonitoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCallState(callId: string) {
    const call = await this.prisma.voiceCall.findUnique({
      where: { id: callId },
      include: {
        vendor: true,
        requirement: true,
        session: true,
        extraction: true,
      }
    });

    if (!call) {
      throw new NotFoundException(`Call ${callId} not found`);
    }

    let durationSeconds = call.durationSeconds || 0;
    if (call.connectedAt && !call.endedAt) {
      durationSeconds = Math.floor((new Date().getTime() - call.connectedAt.getTime()) / 1000);
    }

    return {
      callId: call.id,
      status: call.status,
      currentState: call.session?.currentState || null,
      language: call.session?.currentLanguage || call.language,
      durationSeconds,
      vendor: call.vendor,
      requirement: call.requirement,
      extraction: call.extraction,
    };
  }

  async getCallHistory(filters: any) {
    const { requirementId, vendorId, status, page = 1, limit = 20 } = filters;
    
    const where: any = {};
    if (requirementId) where.requirementId = requirementId;
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.voiceCall.findMany({
        where,
        include: {
          vendor: true,
          requirement: true,
          outcome: true,
          extraction: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.voiceCall.count({ where })
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
}
