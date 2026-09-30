import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardKpis() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [requirementsToday, callsCompleted, quotesReceived, followUpsPending] = await Promise.all([
      this.prisma.requirement.count({ where: { createdAt: { gte: today } } }),
      this.prisma.voiceCall.count({ where: { status: 'COMPLETED' } }),
      this.prisma.quotation.count(),
      this.prisma.followUp.count({ where: { status: 'PENDING' } })
    ]);

    return {
      requirementsToday,
      callsCompleted,
      quotesReceived,
      followUpsPending
    };
  }

  async getAiUsage() {
    return this.prisma.aIUsageRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  async getCallAnalytics() {
    const calls = await this.prisma.voiceCall.groupBy({
      by: ['status'],
      _count: { _all: true }
    });
    return calls;
  }
}
