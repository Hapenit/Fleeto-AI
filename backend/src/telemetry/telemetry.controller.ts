import {
  Controller,
  Get,
  NotFoundException,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { SystemHealthService } from '../system-health/services/system-health.service.js';
import { TelemetryService } from './telemetry.service.js';

@Controller()
export class TelemetryController {
  constructor(
    private readonly healthService: SystemHealthService,
    private readonly telemetryService: TelemetryService,
  ) {}

  @Get('health/live')
  getLiveness() {
    return { status: 'ok' };
  }

  @Get('health/ready')
  async getReadiness(@Res() response: Response) {
    const ready = await this.healthService.isDatabaseAvailable();
    return response.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      dependencies: { database: ready ? 'available' : 'unavailable' },
    });
  }

  @Get('metrics')
  getMetrics(@Req() request: Request, @Res() response: Response) {
    const token = process.env.METRICS_TOKEN;
    if (process.env.NODE_ENV === 'production' && !token) throw new NotFoundException();

    if (token) {
      const authorization = request.header('authorization') ?? '';
      const suppliedToken = authorization.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length)
        : '';
      const expected = Buffer.from(token);
      const supplied = Buffer.from(suppliedToken);
      if (
        expected.length !== supplied.length ||
        !timingSafeEqual(expected, supplied)
      ) {
        throw new UnauthorizedException();
      }
    }

    return response
      .type('text/plain; version=0.0.4; charset=utf-8')
      .send(this.telemetryService.toPrometheusMetrics());
  }
}
