import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { NegotiationPolicyService } from './policy/negotiation-policy.service.js';
import { NegotiationEngineService } from './engine/negotiation-engine.service.js';
import { CreateNegotiationPolicyDto } from './dto/create-policy.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class NegotiationController {
  constructor(
    private readonly policyService: NegotiationPolicyService,
    private readonly engineService: NegotiationEngineService
  ) {}

  @Post('requirements/:requirementId/negotiation-policy')
  async createPolicy(@Param('requirementId') requirementId: string, @Body() dto: CreateNegotiationPolicyDto, @Req() req: any) {
    const policy = await this.policyService.createOrUpdatePolicy(requirementId, req.user.id, dto);
    return { success: true, data: policy };
  }

  @Get('requirements/:requirementId/negotiation-policy')
  async getPolicy(@Param('requirementId') requirementId: string) {
    const policy = await this.policyService.getPolicy(requirementId);
    return { success: true, data: policy };
  }

  @Post('calls/:callId/negotiation')
  async startNegotiation(@Param('callId') callId: string, @Req() req: any) {
    const session = await this.engineService.startNegotiation(callId, req.user.id);
    return { success: true, data: session };
  }

  @Get('calls/:callId/negotiation')
  async getNegotiationByCallId(@Param('callId') callId: string) {
    const session = await this.engineService.getSessionByCallId(callId);
    return { success: true, data: session };
  }

  @Get('negotiations/:negotiationId')
  async getNegotiation(@Param('negotiationId') negotiationId: string) {
    const session = await this.engineService.getSession(negotiationId);
    return { success: true, data: session };
  }
}
