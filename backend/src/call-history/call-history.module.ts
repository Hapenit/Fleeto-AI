import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CallHistoryController } from './controllers/call-history.controller.js';
import { CallRecordingController } from './controllers/call-recording.controller.js';
import { CallHistoryService } from './services/call-history.service.js';
import { CallRecordingService } from './services/call-recording.service.js';
import { LocalRecordingStorage } from './storage/local-recording-storage.js';

@Module({
  imports: [PrismaModule],
  controllers: [CallHistoryController, CallRecordingController],
  providers: [CallHistoryService, CallRecordingService, LocalRecordingStorage],
  exports: [CallHistoryService, CallRecordingService]
})
export class CallHistoryModule {}
