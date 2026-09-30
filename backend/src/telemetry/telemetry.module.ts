import { Module } from '@nestjs/common';
import { SystemHealthModule } from '../system-health/system-health.module.js';
import { TelemetryController } from './telemetry.controller.js';
import { TelemetryInterceptor } from './telemetry.interceptor.js';
import { TelemetryService } from './telemetry.service.js';

@Module({
  imports: [SystemHealthModule],
  controllers: [TelemetryController],
  providers: [TelemetryService, TelemetryInterceptor],
  exports: [TelemetryService, TelemetryInterceptor],
})
export class TelemetryModule {}
