import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class AiConfigService {
  constructor(private prisma: PrismaService) {}

  async getProviders() {
    return this.prisma.aIProviderConfig.findMany({
      include: {
        models: true,
      },
      orderBy: { priority: 'desc' }
    });
  }

  async getModels() {
    return this.prisma.aIModelConfig.findMany({
      include: {
        provider: true,
      },
    });
  }

  async getFeatures() {
    return this.prisma.aIFeatureConfig.findMany();
  }

  async getPrompts() {
    return this.prisma.aIPrompt.findMany({
      orderBy: [
        { promptKey: 'asc' },
        { version: 'desc' }
      ]
    });
  }
}
