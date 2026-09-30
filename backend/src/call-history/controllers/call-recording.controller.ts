import { Controller, Get, Param, UseGuards, Req, Post, Body, Res } from '@nestjs/common';
import { CallRecordingService } from '../services/call-recording.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('api')
export class CallRecordingController {
  constructor(private readonly recordingService: CallRecordingService) {}

  @Get('calls/:id/recording')
  @UseGuards(JwtAuthGuard)
  async getRecordingMetadata(@Param('id') callId: string) {
    const data = await this.recordingService.getRecordingMetadata(callId);
    return { success: true, data };
  }

  @Get('calls/:id/recording/access')
  @UseGuards(JwtAuthGuard)
  async getRecordingAccess(@Param('id') callId: string, @Req() req: any) {
    const data = await this.recordingService.getRecordingAccess(callId, req.user.id);
    return { success: true, data };
  }

  @Post('call-recordings/webhooks/provider')
  async handleWebhook(@Body() payload: any) {
    const data = await this.recordingService.handleProviderWebhook(payload);
    return { success: true, data };
  }

  @Get('recordings/:filename')
  async getRecordingFile(@Param('filename') filename: string, @Req() req: any, @Res() res: any) {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'uploads', 'recordings', filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('Not Found');
    }
  }
}
