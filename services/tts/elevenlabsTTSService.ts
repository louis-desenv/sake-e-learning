/**
 * ElevenLabs TTS Service
 *
 * Wrapper for the ElevenLabs Text-to-Speech API.
 * Provides high-quality cloud-based TTS with natural voices.
 *
 * @fileoverview This module implements TTS using the ElevenLabs API.
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import {
  ITTSService,
  TTSVoice,
  TTSConfig,
  TTSService,
  TTSCallbacks,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  labels?: Record<string, string>;
  description?: string;
  preview_url?: string;
  language?: string;
}

// Default ElevenLabs voices as fallback
const DEFAULT_ELEVENLABS_VOICES: TTSVoice[] = [
  {
    id: 'qyFhaJEAwHR0eYLCmlUT',
    name: 'Aria (Default)',
    language: 'en',
    service: TTSService.ELEVENLABS,
    metadata: { gender: 'female', accent: 'american' },
  },
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    language: 'en',
    service: TTSService.ELEVENLABS,
    metadata: { gender: 'female', accent: 'american' },
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    language: 'en',
    service: TTSService.ELEVENLABS,
    metadata: { gender: 'female', accent: 'american' },
  },
  {
    id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    language: 'en',
    service: TTSService.ELEVENLABS,
    metadata: { gender: 'male', accent: 'american' },
  },
  {
    id: 'VR6AewLTigWG4xSOukaG',
    name: 'Arnold',
    language: 'en',
    service: TTSService.ELEVENLABS,
    metadata: { gender: 'male', accent: 'american' },
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    language: 'en',
    service: TTSService.ELEVENLABS,
    metadata: { gender: 'male', accent: 'american' },
  },
  {
    id: 'yoZ06aMxZJJ28mfd3POQ',
    name: 'Sam',
    language: 'en',
    service: TTSService.ELEVENLABS,
    metadata: { gender: 'male', accent: 'american' },
  },
];

// ============================================================================
// CLASS DEFINITION
// ============================================================================

/**
 * ElevenLabs implementation of TTS service
 */
export class ElevenLabsTTSService implements ITTSService {
  private client: ElevenLabsClient | null = null;
  private currentAudio: HTMLAudioElement | null = null;
  private currentAudioUrl: string | null = null;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (apiKey) {
      this.client = new ElevenLabsClient({ apiKey });
    }
  }

  // ========================================================================
  // PUBLIC METHODS
  // ========================================================================

  /**
   * Get list of available voices from ElevenLabs
   */
  async getAvailableVoices(): Promise<TTSVoice[]> {
    if (!this.client) {
      console.warn('ElevenLabs client not initialized');
      return [];
    }

    try {
      const response = await this.client.voices.getAll();
      console.log('ElevenLabs API response type:', typeof response, response);

      // Handle different response formats from ElevenLabs SDK
      // The response might be { voices: [...] } or directly an array
      let voices: ElevenLabsVoice[];

      if (response && typeof response === 'object') {
        // Check if response has a 'voices' property
        if ('voices' in response && Array.isArray((response as any).voices)) {
          voices = (response as any).voices as ElevenLabsVoice[];
        } else if (Array.isArray(response)) {
          // Response is directly an array
          voices = response as unknown as ElevenLabsVoice[];
        } else {
          console.warn('Unexpected ElevenLabs response format:', response);
          return [];
        }
      } else {
        console.warn('Invalid ElevenLabs response:', response);
        return [];
      }

      console.log('ElevenLabs voices parsed:', voices.length, 'first voice:', voices[0]);
      // Log all keys of the first voice to understand the structure
      if (voices[0]) {
        console.log('First voice keys:', Object.keys(voices[0]));
        console.log('First voice JSON:', JSON.stringify(voices[0], null, 2));
      }

      const mappedVoices = voices.map((voice: any) => {
        // The SDK might use 'voiceId' (camelCase) instead of 'voice_id' (snake_case)
        const voiceId = voice.voice_id || voice.voiceId || voice.id;
        const mapped = {
          id: voiceId,
          name: voice.name,
          language: voice.language || this.extractLanguage(voice.labels) || 'en',
          service: TTSService.ELEVENLABS,
          metadata: {
            description: voice.description,
            gender: this.extractGender(voice.labels),
            accent: this.extractAccent(voice.labels),
          },
        };
        if (!mapped.id) {
          console.warn('Voice missing ID (checked voice_id, voiceId, id):', voice);
        }
        return mapped;
      }).filter(v => v.id); // Filter out voices without IDs

      // If no valid voices found, use defaults
      if (mappedVoices.length === 0) {
        console.log('No valid voices from API, using default ElevenLabs voices');
        return DEFAULT_ELEVENLABS_VOICES;
      }

      return mappedVoices;
    } catch (error) {
      console.error('Failed to fetch ElevenLabs voices:', error);
      // Return default voices as fallback
      console.log('Using default ElevenLabs voices as fallback');
      return DEFAULT_ELEVENLABS_VOICES;
    }
  }

  /**
   * Get default voices (used when API fails or returns invalid data)
   */
  getDefaultVoices(): TTSVoice[] {
    return DEFAULT_ELEVENLABS_VOICES;
  }

  /**
   * Speak text using ElevenLabs API
   */
  async speak(
    text: string,
    voice: TTSVoice,
    config: TTSConfig,
    callbacks?: TTSCallbacks
  ): Promise<void> {
    if (!this.client) {
      throw new Error('ElevenLabs client not initialized');
    }

    // Validate that this voice belongs to ElevenLabs service
    if (voice.service !== TTSService.ELEVENLABS) {
      throw new Error(
        `Invalid voice for ElevenLabs: "${voice.name}" is from ${voice.service} service. ` +
        `Please select an ElevenLabs voice.`
      );
    }

    // Validate voice ID exists
    if (!voice.id) {
      throw new Error('Voice ID is missing. Please select a valid voice.');
    }

    // Stop any current audio
    this.stop();

    try {
      callbacks?.onStart?.();

      // Call ElevenLabs API
      const audioStream = await this.client.textToSpeech.convert(voice.id, {
        text,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
      });

      // Convert stream to blob
      const arrayBuffer = await this.streamToArrayBuffer(audioStream);
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      this.currentAudioUrl = audioUrl;

      // Create and play audio element
      this.currentAudio = new Audio(audioUrl);

      return new Promise<void>((resolve, reject) => {
        if (!this.currentAudio) {
          reject(new Error('Failed to create audio element'));
          return;
        }

        this.currentAudio.onended = () => {
          this.cleanup();
          callbacks?.onEnd?.();
          resolve();
        };

        this.currentAudio.onerror = (error) => {
          this.cleanup();
          const audioError = new Error(`Audio playback error: ${error}`);
          callbacks?.onError?.(audioError);
          reject(audioError);
        };

        this.currentAudio.play().catch((playError) => {
          this.cleanup();
          callbacks?.onError?.(playError);
          reject(playError);
        });
      });
    } catch (error) {
      this.cleanup();
      callbacks?.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Stop current audio playback
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
    this.cleanup();
  }

  /**
   * Check if ElevenLabs API key is configured
   */
  isSupported(): boolean {
    return !!this.apiKey;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (this.currentAudioUrl) {
      URL.revokeObjectURL(this.currentAudioUrl);
      this.currentAudioUrl = null;
    }
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  /**
   * Convert ReadableStream to ArrayBuffer
   */
  private async streamToArrayBuffer(stream: ReadableStream<Uint8Array>): Promise<ArrayBuffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    // Calculate total length and create single buffer
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const arrayBuffer = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      arrayBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    return arrayBuffer.buffer;
  }

  /**
   * Extract language from voice labels
   */
  private extractLanguage(labels?: Record<string, string>): string | undefined {
    if (!labels) return undefined;
    return labels.language || labels.lang;
  }

  /**
   * Extract gender from voice labels
   */
  private extractGender(labels?: Record<string, string>): string | undefined {
    if (!labels) return undefined;
    return labels.gender || labels.sex;
  }

  /**
   * Extract accent from voice labels
   */
  private extractAccent(labels?: Record<string, string>): string | undefined {
    if (!labels) return undefined;
    return labels.accent;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ElevenLabsTTSService;
