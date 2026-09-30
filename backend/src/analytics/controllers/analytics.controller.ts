import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@Controller('api/admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN', 'MARKETING_USER')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.analyticsService.getDashboardKpis();
  }

  @Get('ai-usage')
  getAiUsage() {
    return this.analyticsService.getAiUsage();
  }

  @Get('calls')
  getCallAnalytics() {
    return this.analyticsService.getCallAnalytics();
  }
}
