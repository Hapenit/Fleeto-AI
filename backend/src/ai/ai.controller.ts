import { Controller, Post, Body, Req, UseGuards, Param, Get } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { AIRequirementExtractSchema, AIRequirementApplySchema, AIRequirementRejectSchema } from './dto/ai.dto.js';
import type { AIRequirementExtractDto, AIRequirementApplyDto, AIRequirementRejectDto } from './dto/ai.dto.js';

@Controller('api/ai/requirements')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('extract')
  async extractRequirement(@Body(new ZodValidationPipe(AIRequirementExtractSchema)) dto: AIRequirementExtractDto, @Req() req: any) {
    const result = await this.aiService.extractRequirement(dto, req.user.id, req.ip, req.headers['user-agent']);
    return { success: true, data: result };
  }

  @Post('extractions/:id/apply')
  async applyExtraction(@Param('id') id: string, @Body(new ZodValidationPipe(AIRequirementApplySchema)) dto: AIRequirementApplyDto, @Req() req: any) {
    const result = await this.aiService.applyExtraction(id, dto, req.user.id, req.ip, req.headers['user-agent']);
    return { success: true, data: result };
  }

  @Post('extractions/:id/reject')
  async rejectExtraction(@Param('id') id: string, @Body(new ZodValidationPipe(AIRequirementRejectSchema)) dto: AIRequirementRejectDto, @Req() req: any) {
    const result = await this.aiService.rejectExtraction(id, dto, req.user.id, req.ip, req.headers['user-agent']);
    return { success: true, data: result };
  }

  @Get(':requirementId/extractions')
  async getExtractionHistory(@Param('requirementId') requirementId: string, @Req() req: any) {
    const result = await this.aiService.getExtractionHistory(requirementId, req.user.id);
    return { success: true, data: result };
  }
}
