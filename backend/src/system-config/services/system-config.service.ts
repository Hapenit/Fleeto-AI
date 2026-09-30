import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class SystemConfigService {
  constructor(private prisma: PrismaService) {}

  async getVoiceConfig() {
    return this.prisma.voiceConfig.findFirst();
  }

  async getTelephonyConfig() {
    return this.prisma.telephonyConfig.findFirst();
  }

  async getCallingPolicies() {
    return this.prisma.callingPolicy.findMany();
  }

  async getSettings() {
    return this.prisma.systemSetting.findMany();
  }
}
