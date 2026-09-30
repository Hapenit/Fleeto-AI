import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ConversationAnalysisService } from './conversation-analysis.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class ConversationAnalysisController {
  constructor(private readonly analysisService: ConversationAnalysisService) {}

  @Post('calls/:callId/analysis')
  async analyzeCall(@Param('callId') callId: string) {
    const result = await this.analysisService.requestAnalysis(callId);
    return { success: true, data: result };
  }

  @Post('calls/:callId/analysis/reanalyze')
  async reanalyzeCall(@Param('callId') callId: string) {
    // For POC, reanalyze simply triggers it again and overrides the old one. 
    // Usually it should create a new record if we maintain versioning strictly.
    const result = await this.analysisService.requestAnalysis(callId);
    return { success: true, data: result };
  }

  @Get('calls/:callId/analysis')
  async getAnalysis(@Param('callId') callId: string) {
    const data = await this.analysisService.getAnalysisByCallId(callId);
    return { success: true, data };
  }
}
