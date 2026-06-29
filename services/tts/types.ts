/**
 * TTS Service Types
 *
 * Type definitions for the Text-to-Speech service layer.
 * Supports multiple TTS providers (Web Speech API, ElevenLabs, etc.)
 *
 * @fileoverview This module defines the unified types and interfaces for all TTS services.
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Available TTS service providers
 */
export enum TTSService {
  /** Browser's built-in Web Speech API */
  WEB_SPEECH = 'web-speech',
  /** ElevenLabs cloud TTS service (not yet implemented) */
  ELEVENLABS = 'elevenlabs',
  /** Google Cloud Text-to-Speech API */
  GOOGLE_CLOUD = 'google-cloud',
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Unified voice representation across all TTS services
 */
export interface TTSVoice {
  /** Unique identifier for the voice (service-specific) */
  id: string;
  /** Human-readable voice name */
  name: string;
  /** Language code (e.g., 'en-US', 'pt-BR') */
  language: string;
  /** Which service this voice belongs to */
  service: TTSService;
  /** Optional service-specific metadata */
  metadata?: {
    /** Voice gender (if available) */
    gender?: string;
    /** Voice age range (if available) */
    age?: string;
    /** Voice accent (if available) */
    accent?: string;
    /** Voice description (ElevenLabs) */
    description?: string;
    /** Original voice URI (Web Speech API) */
    voiceURI?: string;
  };
}

/**
 * Configuration for TTS playback
 */
export interface TTSConfig {
  /** Which service to use */
  service: TTSService;
  /** Which voice to use */
  voice: TTSVoice;
  /** Speech rate (0.1 to 10, default 1.0) */
  rate?: number;
  /** Speech pitch (0 to 2, default 1.0) */
  pitch?: number;
  /** Speech volume (0 to 1, default 1.0) */
  volume?: number;
  /** Override utterance language (e.g. 'pt-BR' for Portuguese text). Defaults to voice language. */
  lang?: string;
}

/**
 * Callbacks for TTS playback events
 */
export interface TTSCallbacks {
  /** Called when speech starts */
  onStart?: () => void;
  /** Called when speech ends successfully */
  onEnd?: () => void;
  /** Called when speech encounters an error */
  onError?: (error: Error) => void;
}

/**
 * Unified interface for all TTS services
 */
export interface ITTSService {
  /**
   * Get list of available voices for this service
   * @returns Promise resolving to array of available voices
   */
  getAvailableVoices(): Promise<TTSVoice[]>;

  /**
   * Speak the given text using the specified voice
   * @param text - The text to speak
   * @param voice - The voice to use
   * @param config - Configuration options
   * @param callbacks - Optional event callbacks
   * @returns Promise that resolves when speech completes
   */
  speak(
    text: string,
    voice: TTSVoice,
    config: TTSConfig,
    callbacks?: TTSCallbacks
  ): Promise<void>;

  /**
   * Generate and cache audio without playing it.
   */
  prefetch?(
    text: string,
    voice: TTSVoice,
    config: TTSConfig
  ): Promise<void>;

  /**
   * Stop any currently playing speech
   */
  stop(): void;

  /**
   * Check if this service is supported/available
   * @returns true if service can be used
   */
  isSupported(): boolean;

  /**
   * Clean up resources (optional)
   */
  cleanup?(): void;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a voice is from a specific service
 */
export function isVoiceFromService(voice: TTSVoice, service: TTSService): boolean {
  return voice.service === service;
}

/**
 * Check if a voice supports a specific language
 */
export function isVoiceForLanguage(voice: TTSVoice, languageCode: string): boolean {
  return voice.language.startsWith(languageCode);
}

/**
 * Filter voices by service
 */
export function filterVoicesByService(voices: TTSVoice[], service: TTSService): TTSVoice[] {
  return voices.filter(v => v.service === service);
}

/**
 * Filter voices by language
 */
export function filterVoicesByLanguage(voices: TTSVoice[], languageCode: string): TTSVoice[] {
  return voices.filter(v => v.language.startsWith(languageCode));
}

/**
 * Find default voice for a language from a list of voices
 */
export function findDefaultVoice(voices: TTSVoice[], languageCode: string = 'en'): TTSVoice | null {
  return voices.find(v => v.language.startsWith(languageCode)) || voices[0] || null;
}
