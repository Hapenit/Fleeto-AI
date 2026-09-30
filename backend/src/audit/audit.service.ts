import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CreateAuditLogDto {
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async createLog(data: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data,
    });
  }

  async getLogs(skip?: number, take?: number) {
    return this.prisma.auditLog.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }
}
