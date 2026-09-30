import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { AuditModule } from './audit/audit.module.js';
import { RequirementsModule } from './requirements/requirements.module.js';
import { AiModule } from './ai/ai.module.js';
import { VendorsModule } from './vendors/vendors.module.js';
import { EligibilityModule } from './eligibility/eligibility.module.js';
import { MatchingModule } from './matching/matching.module.js';
import { VoiceAgentModule } from './voice-agent/voice-agent.module.js';
import { LiveVoiceModule } from './live-voice/live-voice.module.js';
import { ConversationAnalysisModule } from './conversation-analysis/conversation-analysis.module.js';
import { NegotiationModule } from './negotiation/negotiation.module.js';
import { QuotationsModule } from './quotations/quotations.module.js';
import { QuotationComparisonModule } from './quotation-comparison/quotation-comparison.module.js';
import { ProcurementDecisionModule } from './procurement-decision/procurement-decision.module.js';
import { CallHistoryModule } from './call-history/call-history.module.js';
import { FollowUpsModule } from './follow-ups/follow-ups.module.js';
import { AiConfigModule } from './ai-config/ai-config.module.js';
import { SystemConfigModule } from './system-config/system-config.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { SystemHealthModule } from './system-health/system-health.module.js';
import { LoginRateLimitMiddleware } from './common/middlewares/rate-limit.middleware.js';
import { TelemetryModule } from './telemetry/telemetry.module.js';
import { TelemetryInterceptor } from './telemetry/telemetry.interceptor.js';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [PrismaModule, AuditModule, UsersModule, AuthModule, RequirementsModule, AiModule, VendorsModule, EligibilityModule, MatchingModule, VoiceAgentModule, LiveVoiceModule, ConversationAnalysisModule, NegotiationModule, QuotationsModule, QuotationComparisonModule, ProcurementDecisionModule, CallHistoryModule, FollowUpsModule, AiConfigModule, SystemConfigModule, AnalyticsModule, SystemHealthModule, TelemetryModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_INTERCEPTOR, useClass: TelemetryInterceptor }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoginRateLimitMiddleware)
      .forRoutes({ path: 'api/auth/login', method: RequestMethod.POST });
  }
}
