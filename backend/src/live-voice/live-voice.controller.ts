import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CallMonitoringService } from './call-monitoring.service.js';
import { CallEventService } from './call-event.service.js';
import { TranscriptService } from './transcript.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('api/live-voice')
@UseGuards(JwtAuthGuard)
export class LiveVoiceController {
  constructor(
    private readonly monitoringService: CallMonitoringService,
    private readonly eventService: CallEventService,
    private readonly transcriptService: TranscriptService
  ) {}

  @Get('calls/:callId/state')
  async getCallState(@Param('callId') callId: string) {
    const data = await this.monitoringService.getCallState(callId);
    return { success: true, data };
  }

  @Get('calls/:callId/events')
  async getCallEvents(
    @Param('callId') callId: string,
    @Query('limit') limit: string = '100'
  ) {
    const data = await this.eventService.getEvents(callId, parseInt(limit, 10));
    return { success: true, data };
  }

  @Get('calls/:callId/transcript')
  async getTranscript(@Param('callId') callId: string) {
    const segments = await this.transcriptService.getTranscripts(callId);
    return {
      success: true,
      data: {
        callId,
        segments
      }
    };
  }

  @Get('calls/:callId/transcript/search')
  async searchTranscript(
    @Param('callId') callId: string,
    @Query('q') query: string
  ) {
    const segments = await this.transcriptService.searchTranscript(callId, query);
    return { success: true, data: segments };
  }

  @Get('calls')
  async getCallHistory(
    @Query('requirementId') requirementId?: string,
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    const filters = {
      requirementId,
      vendorId,
      status,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };
    const result = await this.monitoringService.getCallHistory(filters);
    return { success: true, ...result };
  }
}
