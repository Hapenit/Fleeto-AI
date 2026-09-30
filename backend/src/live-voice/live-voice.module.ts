import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LiveVoiceController } from './live-voice.controller.js';
import { CallMonitoringService } from './call-monitoring.service.js';
import { CallEventService } from './call-event.service.js';
import { TranscriptService } from './transcript.service.js';
import { LiveVoiceGateway } from './live-voice.gateway.js';
import { TelemetryModule } from '../telemetry/telemetry.module.js';

@Module({
  imports: [
    JwtModule.register({}), // Just to decode the token in gateway
    TelemetryModule,
  ],
  controllers: [LiveVoiceController],
  providers: [
    CallMonitoringService,
    CallEventService,
    TranscriptService,
    LiveVoiceGateway,
  ],
  exports: [
    CallEventService,
    TranscriptService,
  ]
})
export class LiveVoiceModule {}
