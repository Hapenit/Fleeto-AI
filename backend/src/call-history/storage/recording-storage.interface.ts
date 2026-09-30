export interface RecordingStorageProvider {
  upload(callId: string, fileBuffer: Buffer, mimeType: string): Promise<string>;
  getSignedUrl(storageKey: string, expiresInSeconds: number): Promise<string>;
  delete(storageKey: string): Promise<void>;
  exists(storageKey: string): Promise<boolean>;
}
