import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RequirementNumberService {
  constructor(private prisma: PrismaService) {}

  async generateRequirementNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `REQ-${year}-`;
    
    // In a real production system, we'd use a sequence or advisory lock to prevent race conditions.
    // For POC, we'll find the highest number in the current year.
    const latestReq = await this.prisma.requirement.findFirst({
      where: {
        requirementNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        requirementNumber: 'desc',
      },
      select: {
        requirementNumber: true,
      },
    });

    let nextNumber = 1;
    if (latestReq) {
      const parts = latestReq.requirementNumber.split('-');
      if (parts.length === 3) {
        nextNumber = parseInt(parts[2], 10) + 1;
      }
    }

    const paddedNumber = nextNumber.toString().padStart(6, '0');
    return `${prefix}${paddedNumber}`;
  }
}
