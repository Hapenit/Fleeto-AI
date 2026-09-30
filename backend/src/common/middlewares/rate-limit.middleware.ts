import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoginRateLimitMiddleware implements NestMiddleware {
  private requests = new Map<string, { count: number, resetTime: number }>();

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 5;

    let record = this.requests.get(ip);
    if (!record || record.resetTime < now) {
      record = { count: 1, resetTime: now + windowMs };
    } else {
      record.count++;
    }
    
    this.requests.set(ip, record);

    if (record.count > maxRequests) {
      throw new HttpException('Too many login attempts. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    next();
  }
}
