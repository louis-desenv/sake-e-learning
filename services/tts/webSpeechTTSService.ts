/**
 * Web Speech API TTS Service
 *
 * Wrapper for the browser's built-in Web Speech API (SpeechSynthesis).
 * Provides offline TTS capability using voices installed on the user's device.
 *
 * @fileoverview This module implements TTS using the Web Speech API.
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import {
  ITTSService,
  TTSVoice,
  TTSConfig,
  TTSService,
  TTSCallbacks,
} from './types';

// ============================================================================
// CLASS DEFINITION
// ============================================================================

/**
 * Web Speech API implementation of TTS service
 */
export class WebSpeechTTSService implements ITTSService {
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  // ========================================================================
  // PUBLIC METHODS
  // ========================================================================

  /**
   * Get list of available voices from the browser
   * Note: Some browsers load voices asynchronously
   */
  async getAvailableVoices(): Promise<TTSVoice[]> {
    if (!this.synthesis) {
      return [];
    }

    // Try to get voices immediately
    let voices = this.synthesis.getVoices();

    // If empty, wait for voices to load (some browsers load asynchronously)
    if (voices.length === 0) {
      await new Promise<void>((resolve) => {
        const loadVoices = () => {
          voices = this.synthesis?.getVoices() || [];
          if (voices.length > 0) {
            this.synthesis?.removeEventListener('voiceschanged', loadVoices);
            resolve();
          }
        };

        // Check if already loaded
        voices = this.synthesis?.getVoices() || [];
        if (voices.length > 0) {
          resolve();
          return;
        }

        // Wait for voiceschanged event
        this.synthesis?.addEventListener('voiceschanged', loadVoices);

        // Fallback timeout
        setTimeout(() => {
          this.synthesis?.removeEventListener('voiceschanged', loadVoices);
          resolve();
        }, 1000);
      });
    }

    return voices.map((voice) => ({
      id: voice.voiceURI,
      name: voice.name,
      language: voice.lang,
      service: TTSService.WEB_SPEECH,
      metadata: {
        voiceURI: voice.voiceURI,
        gender: this.inferGender(voice.name),
      },
    }));
  }

  /**
   * Speak text using the browser's speech synthesis
   */
  async speak(
    text: string,
    voice: TTSVoice,
    config: TTSConfig,
    callbacks?: TTSCallbacks
  ): Promise<void> {
    if (!this.synthesis) {
      throw new Error('Web Speech API not supported');
    }

    // Validate that this voice belongs to Web Speech service
    if (voice.service !== TTSService.WEB_SPEECH) {
      throw new Error(
        `Invalid voice for Web Speech: "${voice.name}" is from ${voice.service} service. ` +
        `Please select a Web Speech voice.`
      );
    }

    // Cancel any current speech
    this.stop();

    return new Promise<void>((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Set voice — but ONLY if no language override OR the override matches the voice's language.
      // When config.lang differs (e.g. pt-BR feedback with an English tutor voice), we skip
      // forcing the voice so the browser auto-selects the best native voice for that language.
      const targetLang = config.lang ?? voice.language;
      const voiceLangMatches = voice.language.startsWith(targetLang.split('-')[0]) ||
                               targetLang.startsWith(voice.language.split('-')[0]);

      if (!config.lang || voiceLangMatches) {
        const browserVoices = this.synthesis.getVoices();
        const browserVoice = browserVoices.find(v => v.voiceURI === voice.metadata?.voiceURI || v.name === voice.name);
        if (browserVoice) {
          utterance.voice = browserVoice;
        }
      }
      // else: let browser pick the best voice for config.lang automatically

      // Set parameters
      utterance.rate = config.rate ?? 1.0;
      utterance.pitch = config.pitch ?? 1.0;
      utterance.volume = config.volume ?? 1.0;
      // Apply language override for correct phonetics (e.g. pt-BR for Portuguese feedback)
      if (config.lang) {
        utterance.lang = config.lang;
      }

      // Event handlers
      utterance.onstart = () => {
        this.currentUtterance = utterance;
        callbacks?.onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        callbacks?.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;

        // Ignore "interrupted" errors - they occur when stop() is called
        // Ignore "not-allowed" errors - they occur when autoplay policy blocks speech
        if (event.error === 'interrupted' || event.error === 'not-allowed') {
          resolve();
          return;
        }

        const error = new Error(`Speech synthesis error: ${event.error}`);
        callbacks?.onError?.(error);
        reject(error);
      };

      // Start speaking
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.currentUtterance = null;
  }

  /**
   * Check if Web Speech API is supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stop();
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  /**
   * Infer gender from voice name (heuristic)
   * This is a rough approximation based on common naming patterns
   */
  private inferGender(name: string): string | undefined {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('female') || lowerName.includes('woman') || lowerName.includes('girl')) {
      return 'female';
    }
    if (lowerName.includes('male') || lowerName.includes('man') || lowerName.includes('boy')) {
      return 'male';
    }

    return undefined;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default WebSpeechTTSService;
