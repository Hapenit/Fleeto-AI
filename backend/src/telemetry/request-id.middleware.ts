import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const providedId = request.header('x-request-id');
    const requestId =
      providedId && /^[\w.-]{1,128}$/.test(providedId) ? providedId : randomUUID();

    response.setHeader('x-request-id', requestId);
    next();
  }
}
