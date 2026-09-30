import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ProcurementSelectionService } from '../services/procurement-selection.service.js';
import { ConfirmSelectionDto } from '../dto/confirm-selection.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class ProcurementDecisionController {
  constructor(
    private readonly selectionService: ProcurementSelectionService,
    private readonly prisma: PrismaService
  ) {}

  @Post('requirements/:requirementId/procurement/decision')
  async createWorkspace(@Param('requirementId') requirementId: string, @Req() req: any) {
    const decision = await this.selectionService.createDecisionWorkspace(requirementId, req.user.id);
    return { success: true, data: decision };
  }

  @Post('procurement-decisions/:decisionId/confirm')
  async confirmDecision(@Param('decisionId') decisionId: string, @Body() dto: ConfirmSelectionDto, @Req() req: any) {
    const decision = await this.selectionService.confirmSelection(decisionId, dto, req.user.id);
    return { success: true, data: decision };
  }

  @Get('procurement-decisions/:decisionId')
  async getDecision(@Param('decisionId') decisionId: string) {
    const decision = await this.prisma.procurementDecision.findUnique({
      where: { id: decisionId },
      include: {
        requirement: true,
        selectedQuotation: true,
        selectedVendor: true,
        items: true,
        auditEntries: true
      }
    });
    return { success: true, data: decision };
  }
}
