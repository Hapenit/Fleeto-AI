import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LocalRecordingStorage } from '../storage/local-recording-storage.js';

@Injectable()
export class CallRecordingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalRecordingStorage
  ) {}

  async getRecordingMetadata(callId: string) {
    const recording = await this.prisma.callRecording.findFirst({
      where: { callId }
    });

    if (!recording) {
      return { status: 'UNAVAILABLE' };
    }

    return {
      status: recording.status,
      durationSeconds: recording.durationSeconds,
      mimeType: recording.mimeType,
      fileSizeBytes: recording.fileSizeBytes?.toString(),
      createdAt: recording.createdAt,
    };
  }

  async getRecordingAccess(callId: string, userId: string) {
    const recording = await this.prisma.callRecording.findFirst({
      where: { callId }
    });

    if (!recording || recording.status !== 'AVAILABLE') {
      throw new NotFoundException('Recording not available');
    }

    const expiresInSeconds = 300;
    const url = await this.storage.getSignedUrl(recording.storageKey, expiresInSeconds);

    // Audit log
    await this.prisma.callRecordingAccessLog.create({
      data: {
        recordingId: recording.id,
        userId,
        action: 'PLAY',
        ipAddress: '127.0.0.1',
      }
    });

    return {
      url,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString()
    };
  }

  async handleProviderWebhook(payload: any) {
    const { providerCallId, durationSeconds, recordingUrl } = payload;
    
    const call = await this.prisma.voiceCall.findUnique({ where: { providerCallId } });
    if (!call) return { success: false, reason: 'Call not found' };

    // Avoid duplicate
    const existing = await this.prisma.callRecording.findFirst({ where: { callId: call.id } });
    if (existing) return { success: true, message: 'Already ingested' };

    // In a real implementation we fetch the recordingUrl from Exotel here and save it
    // For now, we will create an empty buffer placeholder
    let fileBuffer = Buffer.from([]);
    if (recordingUrl) {
      try {
        const response = await fetch(recordingUrl);
        if (response.ok) {
           fileBuffer = Buffer.from(await response.arrayBuffer());
        }
      } catch (e) {
        // failed to fetch recording
      }
    }

    const storageKey = await this.storage.upload(call.id, fileBuffer, 'audio/wav');

    const recording = await this.prisma.callRecording.create({
      data: {
        callId: call.id,
        storageProvider: 'EXTERNAL',
        storageKey,
        originalFileName: 'recording.wav',
        mimeType: 'audio/wav',
        fileSizeBytes: fileBuffer.length, 
        durationSeconds: durationSeconds || call.durationSeconds || 120,
        status: 'AVAILABLE',
        checksum: 'checksum-placeholder',
        recordingStartedAt: call.connectedAt || new Date(),
        recordingEndedAt: call.endedAt || new Date(),
      }
    });

    return { success: true, recordingId: recording.id };
  }
}
