import { Injectable, Logger } from '@nestjs/common';
import { TextToSpeechProvider, TTSOptions, AudioResult } from './text-to-speech.provider.js';
import { SarvamAIClient } from 'sarvamai';

@Injectable()
export class SarvamTTSProvider implements TextToSpeechProvider {
  private readonly logger = new Logger(SarvamTTSProvider.name);
  private readonly client: SarvamAIClient;

  constructor() {
    this.client = new SarvamAIClient({});  }

  async synthesize(text: string, options: TTSOptions): Promise<AudioResult> {
    this.logger.log(`Synthesizing speech with Sarvam AI for text: ${text.substring(0, 50)}...`);
    
    try {
      const response = await this.client.textToSpeech.convert({
        text: text,
        languageCode: 'ta-IN',
        speaker: 'meera',
      } as any);

      // The SDK returns base64 encoded audio string
      const audioBuffer = Buffer.from(response.audios[0], 'base64');
      
      return {
        audio: audioBuffer,
        durationSeconds: audioBuffer.length / (24000 * 2), // rough estimation for 24kHz 16-bit
      };
    } catch (error) {
      this.logger.error(`TTS failed: ${error}`);
      throw error;
    }
  }
}
