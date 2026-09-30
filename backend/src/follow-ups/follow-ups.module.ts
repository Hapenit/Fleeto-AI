import { Module } from '@nestjs/common';
import { FollowUpsService } from './services/follow-ups.service.js';
import { FollowUpsController } from './controllers/follow-ups.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [FollowUpsController],
  providers: [FollowUpsService],
  exports: [FollowUpsService],
})
export class FollowUpsModule {}
