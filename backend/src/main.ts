import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { RequestIdMiddleware } from './telemetry/request-id.middleware.js';
import { validateProductionEnvironment } from './common/config/production-environment.js';

async function bootstrap() {
  validateProductionEnvironment(process.env);
  const app = await NestFactory.create(AppModule);
  const requestIdMiddleware = new RequestIdMiddleware();
  app.use((request: Request, response: Response, next: NextFunction) =>
    requestIdMiddleware.use(request, response, next),
  );
  app.enableShutdownHooks();
  const allowedOrigins = [
    'http://localhost:3000',
    'https://fleeto-frontend-25t4.onrender.com',
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [])
  ].map((origin) => origin.trim()).filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    exposedHeaders: ['x-request-id'],
  });

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Procurement POC API')
    .setDescription('API for Authentication and User Management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
    
  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_API_DOCS === 'true') {
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
await bootstrap();
