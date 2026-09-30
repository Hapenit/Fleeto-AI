export const TEXT_TO_SPEECH_PROVIDER_TOKEN = 'TextToSpeechProvider';

export interface TTSOptions {
  language: string;
  voice?: string;
}

export interface AudioResult {
  audio: Buffer;
  durationSeconds: number;
}

export interface TextToSpeechProvider {
  synthesize(text: string, options: TTSOptions): Promise<AudioResult>;
}
