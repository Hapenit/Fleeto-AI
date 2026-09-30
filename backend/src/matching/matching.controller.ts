import { Controller, Post, Get, Param, Req, UseGuards, Query, Body } from '@nestjs/common';
import { MatchingService } from './matching.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

@Controller('api/matching')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('rank')
  async rank(@Req() req: any) {
    const { requirementId, includeNeedsReview } = req.body;
    const run = await this.matchingService.generateRanking(requirementId, req.user.id, includeNeedsReview);
    return { success: true, data: run };
  }

  @Get(':id')
  async getRankingDetails(@Param('id') id: string) {
    const evaluation = await this.matchingService.getRankingDetails(id);
    return { success: true, data: evaluation };
  }
}

@Controller('api/requirements/:requirementId/matching')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequirementMatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get()
  async getRankings(
    @Param('requirementId') requirementId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNum = parseInt(page || '1', 10);
    const limitNum = parseInt(limit || '20', 10);
    const result = await this.matchingService.getRankings(requirementId, pageNum, limitNum);
    return { success: true, ...result };
  }

  @Post('re-rank')
  async reRank(@Param('requirementId') requirementId: string, @Req() req: any) {
    const run = await this.matchingService.generateRanking(requirementId, req.user.id);
    return { success: true, data: run };
  }
}

@Controller('api/requirements/:requirementId/outreach')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OutreachController {
  constructor(private readonly matchingService: MatchingService) {}

  @Post('vendors')
  async selectVendors(@Param('requirementId') requirementId: string, @Body() body: { vendorIds: string[] }, @Req() req: any) {
    const result = await this.matchingService.selectVendorsForOutreach(requirementId, body.vendorIds, req.user.id);
    return { success: true, data: result };
  }

  @Get('vendors')
  async getSelectedVendors(@Param('requirementId') requirementId: string) {
    const vendors = await this.matchingService.getOutreachSelection(requirementId);
    return { success: true, data: vendors };
  }
}

@Controller('api/admin/matching/configuration')
@UseGuards(JwtAuthGuard, RolesGuard)
// In a real app, restrict to ADMIN role
export class AdminMatchingConfigurationController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get()
  async getConfig() {
    const config = await this.matchingService.getActiveConfiguration();
    return { success: true, data: config };
  }

  @Post()
  async updateConfig(@Body() body: any, @Req() req: any) {
    const config = await this.matchingService.updateConfiguration(req.user.id, body);
    return { success: true, data: config };
  }
}
