import { Injectable } from '@nestjs/common';
import { RecordingStorageProvider } from './recording-storage.interface.js';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalRecordingStorage implements RecordingStorageProvider {
  private readonly storageDir = path.join(process.cwd(), 'uploads', 'recordings');

  constructor() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async upload(callId: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
    const ext = mimeType === 'audio/mp3' ? '.mp3' : '.wav';
    const filename = `${callId}${ext}`;
    const filePath = path.join(this.storageDir, filename);
    
    await fs.promises.writeFile(filePath, fileBuffer);
    return `local/${filename}`;
  }

  async getSignedUrl(storageKey: string, expiresInSeconds: number): Promise<string> {
    // In local dev, we serve from a static route like /api/recordings/
    const filename = storageKey.replace('local/', '');
    return `/api/recordings/${filename}`;
  }

  async delete(storageKey: string): Promise<void> {
    const filename = storageKey.replace('local/', '');
    const filePath = path.join(this.storageDir, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    const filename = storageKey.replace('local/', '');
    const filePath = path.join(this.storageDir, filename);
    return fs.existsSync(filePath);
  }
}
