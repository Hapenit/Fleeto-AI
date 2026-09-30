export const SPEECH_TO_TEXT_PROVIDER_TOKEN = 'SpeechToTextProvider';

export interface TranscriptResult {
  text: string;
  language: string;
  confidence?: number;
  isFinal: boolean;
}

export interface SpeechToTextProvider {
  transcribe(audio: Buffer): Promise<TranscriptResult>;
}
