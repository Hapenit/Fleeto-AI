import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ComparisonEngineService } from './engine/comparison-engine.service.js';
import { CreateComparisonDto } from './dto/create-comparison.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class QuotationComparisonController {
  constructor(private readonly engineService: ComparisonEngineService) {}

  @Post('requirements/:requirementId/comparison')
  async createComparison(@Param('requirementId') requirementId: string, @Req() req: any) {
    const comparison = await this.engineService.buildComparisonSnapshot(requirementId, req.user.id);
    return { success: true, data: comparison };
  }

  @Post('requirements/:requirementId/comparison/refresh')
  async refreshComparison(@Param('requirementId') requirementId: string, @Req() req: any) {
    const comparison = await this.engineService.buildComparisonSnapshot(requirementId, req.user.id);
    return { success: true, data: comparison };
  }

  @Get('requirements/:requirementId/comparison')
  async getComparison(@Param('requirementId') requirementId: string) {
    const comparison = await this.engineService.getLatestComparison(requirementId);
    return { success: true, data: comparison };
  }
}
