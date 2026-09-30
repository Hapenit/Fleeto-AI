import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { CallHistoryService } from '../services/call-history.service.js';
import { CallHistoryQueryDto } from '../dto/call-history-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('api/calls')
@UseGuards(JwtAuthGuard)
export class CallHistoryController {
  constructor(private readonly historyService: CallHistoryService) {}

  @Get()
  async getCalls(@Query() query: CallHistoryQueryDto) {
    const data = await this.historyService.getCalls(query);
    return { success: true, data };
  }

  @Get(':id')
  async getCallDetails(@Param('id') callId: string, @Req() req: any) {
    const data = await this.historyService.getCallDetails(callId, req.user.id);
    return { success: true, data };
  }

  @Get(':id/transcript')
  async getCallTranscript(@Param('id') callId: string, @Query() query: any) {
    const data = await this.historyService.getTranscript(callId, query);
    return { success: true, data };
  }

  @Get(':id/events')
  async getCallEvents(@Param('id') callId: string) {
    const data = await this.historyService.getCallEvents(callId);
    return { success: true, data };
  }
}
