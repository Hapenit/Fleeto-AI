import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Socket } from 'socket.io';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { TelemetryService } from './telemetry.service.js';

@Injectable()
export class TelemetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TelemetryInterceptor.name);

  constructor(private readonly telemetry: TelemetryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() === 'ws') return this.interceptWebSocket(context, next);
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = performance.now();
    const controller = context.getClass().name;
    const method = request.method;
    const route = request.route?.path
      ? `${request.baseUrl}${request.route.path}`
      : 'unmatched';
    const requestId = response.getHeader('x-request-id');
    const id = typeof requestId === 'string' ? requestId : 'unknown';

    const record = (statusCode: number): void => {
      const durationSeconds = (performance.now() - startedAt) / 1000;
      this.telemetry.recordRequest({ controller, method, route, statusCode }, durationSeconds);
      const log = JSON.stringify({
        event: 'http_request',
        requestId: id,
        controller,
        method,
        route,
        statusCode,
        durationMs: Math.round(durationSeconds * 1000 * 100) / 100,
      });
      if (statusCode >= 500) this.logger.error(log);
      else this.logger.log(log);
    };

    return next.handle().pipe(
      tap(() => record(response.statusCode)),
      catchError((error: unknown) => {
        const statusCode = error instanceof HttpException ? error.getStatus() : 500;
        record(statusCode);
        return throwError(() => error);
      }),
    );
  }

  private interceptWebSocket(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const socket = context.switchToWs().getClient<Socket>();
    const requestId =
      typeof socket.data.requestId === 'string' ? socket.data.requestId : 'unknown';
    const gateway = context.getClass().name;
    const event = context.getHandler().name;
    const startedAt = performance.now();

    const record = (outcome: 'success' | 'error'): void => {
      const durationSeconds = (performance.now() - startedAt) / 1000;
      this.telemetry.recordWebSocketEvent({ gateway, event, outcome }, durationSeconds);
      const log = JSON.stringify({
        event: 'websocket_event',
        requestId,
        gateway,
        handler: event,
        outcome,
        durationMs: Math.round(durationSeconds * 1000 * 100) / 100,
      });
      if (outcome === 'error') this.logger.error(log);
      else this.logger.log(log);
    };

    return next.handle().pipe(
      tap(() => record('success')),
      catchError((error: unknown) => {
        record('error');
        return throwError(() => error);
      }),
    );
  }
}
