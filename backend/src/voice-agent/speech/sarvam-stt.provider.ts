import { Injectable, Logger } from '@nestjs/common';
import { SpeechToTextProvider, TranscriptResult } from './speech-to-text.provider.js';
import { SarvamAIClient } from 'sarvamai';
import { File } from 'buffer';

@Injectable()
export class SarvamSTTProvider implements SpeechToTextProvider {
  private readonly logger = new Logger(SarvamSTTProvider.name);
  private readonly client: SarvamAIClient;

  constructor() {
    this.client = new SarvamAIClient({});
  }

  async transcribe(audio: Buffer): Promise<TranscriptResult> {
    this.logger.log('Processing real audio chunk for transcription with Sarvam AI...');
    
    try {
      // The SDK expects a file-like object. For buffer we can use standard File if available
      // or just Blob/Buffer depending on the core.file.Uploadable implementation.
      // Since core.file usually accepts an array of buffers or Blob we can try creating a Blob/File
      const file = new File([audio], 'audio.wav', { type: 'audio/wav' });

      const response = await this.client.speechToText.transcribe({
        file: file as any,
        language_code: 'ta-IN',
      });

      return {
        text: response.transcript || '',
        language: response.language_code || 'ta-IN',
        isFinal: true,
        confidence: 0.95
      };
    } catch (error) {
      this.logger.error(`STT Failed: ${error}`);
      throw error;
    }
  }
}
