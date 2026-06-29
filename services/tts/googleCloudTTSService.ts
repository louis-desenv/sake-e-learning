/**
 * Google Cloud TTS Service
 *
 * Wrapper for the Google Cloud Text-to-Speech REST API.
 * Provides high-quality neural voice synthesis.
 */

import {
  ITTSService,
  TTSVoice,
  TTSConfig,
  TTSService,
  TTSCallbacks,
} from './types';

// Default Google Cloud voices (Neural2 are newer, highly natural voices)
const DEFAULT_GOOGLE_VOICES: TTSVoice[] = [
  {
    id: 'pt-BR-Neural2-F',
    name: 'Francisca (PT-BR Female)',
    language: 'pt-BR',
    service: TTSService.GOOGLE_CLOUD,
    metadata: { gender: 'female', accent: 'brazilian' },
  },
  {
    id: 'pt-BR-Neural2-B',
    name: 'Antonio (PT-BR Male)',
    language: 'pt-BR',
    service: TTSService.GOOGLE_CLOUD,
    metadata: { gender: 'male', accent: 'brazilian' },
  },
  {
    id: 'en-US-Neural2-F',
    name: 'Bella (US Female)',
    language: 'en-US',
    service: TTSService.GOOGLE_CLOUD,
    metadata: { gender: 'female', accent: 'american' },
  },
  {
    id: 'en-US-Neural2-J',
    name: 'Adam (US Male)',
    language: 'en-US',
    service: TTSService.GOOGLE_CLOUD,
    metadata: { gender: 'male', accent: 'american' },
  },
  {
    id: 'en-GB-Neural2-F',
    name: 'Emma (UK Female)',
    language: 'en-GB',
    service: TTSService.GOOGLE_CLOUD,
    metadata: { gender: 'female', accent: 'british' },
  },
  {
    id: 'en-GB-Neural2-M',
    name: 'George (UK Male)',
    language: 'en-GB',
    service: TTSService.GOOGLE_CLOUD,
    metadata: { gender: 'male', accent: 'british' },
  },
];

export class GoogleCloudTTSService implements ITTSService {
  private static readonly MAX_CACHE_ENTRIES = 10;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;
  private audioCache = new Map<string, Promise<Blob>>();
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getAvailableVoices(): Promise<TTSVoice[]> {
    return DEFAULT_GOOGLE_VOICES;
  }

  async speak(
    text: string,
    voice: TTSVoice,
    config: TTSConfig,
    callbacks?: TTSCallbacks
  ): Promise<void> {
    if (voice.service !== TTSService.GOOGLE_CLOUD) {
      throw new Error(`Invalid voice for Google Cloud service.`);
    }

    this.stop();

    try {
      callbacks?.onStart?.();

      const audioBlob = await this.getOrCreateAudio(text, voice, config);
      const audioUrl = URL.createObjectURL(audioBlob);

      this.currentAudioUrl = audioUrl;
      this.currentAudio = new Audio(audioUrl);

      if (config.volume !== undefined) {
        this.currentAudio.volume = config.volume;
      }

      return new Promise<void>((resolve, reject) => {
        if (!this.currentAudio) {
          reject(new Error('Failed to play Google Cloud TTS audio.'));
          return;
        }

        this.currentAudio.onended = () => {
          this.cleanup();
          callbacks?.onEnd?.();
          resolve();
        };

        this.currentAudio.onerror = (e) => {
          this.cleanup();
          const err = new Error('Audio element error in Google Cloud playback');
          callbacks?.onError?.(err);
          reject(err);
        };

        this.currentAudio.play().catch((err) => {
          this.cleanup();
          callbacks?.onError?.(err);
          reject(err);
        });
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callbacks?.onError?.(err);
      throw err;
    }
  }

  async prefetch(text: string, voice: TTSVoice, config: TTSConfig): Promise<void> {
    if (voice.service !== TTSService.GOOGLE_CLOUD) {
      throw new Error('Invalid voice for Google Cloud service.');
    }

    await this.getOrCreateAudio(text, voice, config);
  }

  private getCacheKey(text: string, voice: TTSVoice, config: TTSConfig): string {
    return JSON.stringify([
      text,
      voice.id,
      voice.language,
      config.rate ?? 1.0,
      config.pitch ?? 1.0,
    ]);
  }

  private getOrCreateAudio(text: string, voice: TTSVoice, config: TTSConfig): Promise<Blob> {
    const cacheKey = this.getCacheKey(text, voice, config);
    const cachedAudio = this.audioCache.get(cacheKey);
    if (cachedAudio) {
      console.log(`[Google Cloud TTS Cache] Reusing prefetched audio for: "${text.substring(0, 30)}..."`);
      return cachedAudio;
    }

    const audioPromise = this.synthesizeAudio(text, voice, config).catch((error) => {
      this.audioCache.delete(cacheKey);
      throw error;
    });

    this.audioCache.set(cacheKey, audioPromise);
    this.trimCache();
    return audioPromise;
  }

  private async synthesizeAudio(text: string, voice: TTSVoice, config: TTSConfig): Promise<Blob> {
    const startTime = performance.now();
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: voice.language,
            name: voice.id,
            ssmlGender: voice.metadata?.gender?.toUpperCase() || 'NEUTRAL',
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: config.rate ?? 1.0,
            pitch: ((config.pitch ?? 1.0) - 1.0) * 10.0,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Google Cloud TTS error: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const data = await response.json();
    if (!data.audioContent) {
      throw new Error('Google Cloud TTS returned no audio content.');
    }

    const latency = (performance.now() - startTime).toFixed(0);
    console.log(`%c[Google Cloud TTS API] Audio generated in ${latency}ms for text: "${text.substring(0, 30)}..."`, 'color: #4285F4; font-weight: bold;');

    const byteCharacters = atob(data.audioContent);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    return new Blob([new Uint8Array(byteNumbers)], { type: 'audio/mp3' });
  }

  private trimCache(): void {
    while (this.audioCache.size > GoogleCloudTTSService.MAX_CACHE_ENTRIES) {
      const oldestKey = this.audioCache.keys().next().value;
      if (!oldestKey) break;
      this.audioCache.delete(oldestKey);
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.cleanup();
  }

  isSupported(): boolean {
    return !!this.apiKey;
  }

  cleanup(): void {
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }
  }
}
