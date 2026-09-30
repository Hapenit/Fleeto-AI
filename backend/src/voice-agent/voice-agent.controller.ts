import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { VoiceAgentService } from './voice-agent.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('api/voice-calls')
@UseGuards(JwtAuthGuard)
export class VoiceAgentController {
  constructor(private readonly voiceAgentService: VoiceAgentService) {}

  @Post()
  async createCall(@Body() body: { requirementId: string, vendorId: string }) {
    const call = await this.voiceAgentService.createCall(body.requirementId, body.vendorId);
    return { success: true, data: call };
  }

  @Post('batch')
  async batchProcessOutreach(@Body() body: { requirementId: string }) {
    const calls = await this.voiceAgentService.batchProcessOutreach(body.requirementId);
    return { success: true, data: calls };
  }

  @Post(':id/initiate')
  async initiateCall(@Param('id') id: string) {
    const result = await this.voiceAgentService.initiateCall(id);
    return { success: true, data: result };
  }

  @Get('requirement/:reqId')
  async getCallsByRequirement(
    @Param('reqId') reqId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    const p = parseInt(page, 10);
    const l = parseInt(limit, 10);
    const result = await this.voiceAgentService.getCallsByRequirement(reqId, p, l);
    return { success: true, ...result };
  }

  @Get(':id')
  async getCallDetails(@Param('id') id: string) {
    const result = await this.voiceAgentService.getCallDetails(id);
    return { success: true, data: result };
  }

  @Post(':id/simulate-speech')
  async simulateSpeech(@Param('id') id: string, @Body() body: { text: string }) {
    const result = await this.voiceAgentService.simulateVendorSpeech(id, body.text);
    return { success: true, data: result };
  }
}
