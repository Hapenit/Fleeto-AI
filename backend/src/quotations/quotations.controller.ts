import { Controller, Post, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { QuotationsService } from './quotations.service.js';
import { CreateQuotationDto } from './dto/create-quotation.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class QuotationsController {
  constructor(private readonly service: QuotationsService) {}

  @Post('quotations')
  async createQuotation(@Body() dto: CreateQuotationDto, @Req() req: any) {
    const q = await this.service.createQuotation(dto, req.user.id);
    return { success: true, data: q };
  }

  @Post('calls/:callId/quotation')
  async createFromCall(@Param('callId') callId: string, @Body() dto: CreateQuotationDto, @Req() req: any) {
    const q = await this.service.createQuotation({ ...dto, callId }, req.user.id);
    return { success: true, data: q };
  }

  @Post('negotiations/:negotiationId/quotation')
  async createFromNegotiation(@Param('negotiationId') negotiationId: string, @Body() dto: CreateQuotationDto, @Req() req: any) {
    const q = await this.service.createQuotation({ ...dto, negotiationId }, req.user.id);
    return { success: true, data: q };
  }

  @Get('quotations/:quotationId')
  async getQuotation(@Param('quotationId') quotationId: string) {
    const q = await this.service.getQuotation(quotationId);
    return { success: true, data: q };
  }

  @Post('quotations/:quotationId/confirm')
  async confirmQuotation(@Param('quotationId') quotationId: string, @Req() req: any) {
    const q = await this.service.confirmQuotation(quotationId, req.user.userId);
    return { success: true, data: q };
  }

  @Post('quotations/:quotationId/cancel')
  async cancelQuotation(@Param('quotationId') quotationId: string, @Body('reason') reason: string, @Req() req: any) {
    const q = await this.service.cancelQuotation(quotationId, req.user.userId, reason);
    return { success: true, data: q };
  }
}
