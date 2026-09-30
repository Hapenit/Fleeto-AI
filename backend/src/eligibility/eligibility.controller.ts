import { Controller, Post, Get, Param, Req, UseGuards, Query } from '@nestjs/common';
import { EligibilityService } from './eligibility.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { EvaluationStatus } from '@prisma/client';

@Controller('api/eligibility')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EligibilityController {
  constructor(private readonly eligibilityService: EligibilityService) {}

  @Post('evaluate')
  async evaluate(@Req() req: any) {
    const { requirementId } = req.body;
    const run = await this.eligibilityService.evaluateRequirement(requirementId, req.user.id, req.ip, req.headers['user-agent']);
    return { success: true, data: run };
  }

  @Get(':id')
  async getEvaluationDetails(@Param('id') id: string) {
    const evaluation = await this.eligibilityService.getEvaluationDetails(id);
    return { success: true, data: evaluation };
  }
}

@Controller('api/requirements/:requirementId/eligibility')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequirementEligibilityController {
  constructor(private readonly eligibilityService: EligibilityService) {}

  @Get()
  async getEvaluations(
    @Param('requirementId') requirementId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status: EvaluationStatus
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '20', 10);
    const result = await this.eligibilityService.getEvaluations(requirementId, pageNum, limitNum, status);
    return { success: true, ...result };
  }

  @Get('summary')
  async getSummary(@Param('requirementId') requirementId: string) {
    const summary = await this.eligibilityService.getEvaluationSummary(requirementId);
    return { success: true, data: summary };
  }

  @Post('re-evaluate')
  async reEvaluate(@Param('requirementId') requirementId: string, @Req() req: any) {
    const run = await this.eligibilityService.evaluateRequirement(requirementId, req.user.id, req.ip, req.headers['user-agent']);
    return { success: true, data: run };
  }
}
