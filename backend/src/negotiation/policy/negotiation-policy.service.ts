import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateNegotiationPolicyDto } from '../dto/create-policy.dto.js';
import { UpdateNegotiationPolicyDto } from '../dto/update-policy.dto.js';

@Injectable()
export class NegotiationPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdatePolicy(requirementId: string, userId: string, dto: CreateNegotiationPolicyDto) {
    const existing = await this.prisma.negotiationPolicy.findUnique({
      where: { requirementId }
    });

    if (existing) {
      return this.prisma.negotiationPolicy.update({
        where: { id: existing.id },
        data: {
          ...dto,
          updatedById: userId
        }
      });
    }

    return this.prisma.negotiationPolicy.create({
      data: {
        requirementId,
        createdById: userId,
        updatedById: userId,
        ...dto
      }
    });
  }

  async getPolicy(requirementId: string) {
    return this.prisma.negotiationPolicy.findUnique({
      where: { requirementId }
    });
  }

  async updatePolicy(requirementId: string, userId: string, dto: UpdateNegotiationPolicyDto) {
    const existing = await this.prisma.negotiationPolicy.findUnique({
      where: { requirementId }
    });

    if (!existing) {
      throw new NotFoundException('Negotiation policy not found for this requirement');
    }

    return this.prisma.negotiationPolicy.update({
      where: { id: existing.id },
      data: {
        ...dto,
        updatedById: userId
      }
    });
  }
}
