/**
 * TTS Service Factory
 *
 * Factory for creating TTS service instances.
 * Implements singleton pattern to reuse service instances.
 *
 * @fileoverview This module provides a factory for creating TTS service instances.
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import {
  ITTSService,
  TTSService,
} from './types';
import { WebSpeechTTSService } from './webSpeechTTSService';
import { ElevenLabsTTSService } from './elevenlabsTTSService';

// ============================================================================
// CLASS DEFINITION
// ============================================================================

/**
 * Factory for creating and managing TTS service instances
 */
export class TTSServiceFactory {
  private static instances = new Map<TTSService, ITTSService>();
  private static elevenLabsApiKey: string | null = null;

  /**
   * Set the ElevenLabs API key
   * Call this before creating an ElevenLabs service instance
   * @param apiKey - The ElevenLabs API key
   */
  static setElevenLabsApiKey(apiKey: string): void {
    this.elevenLabsApiKey = apiKey;
    // Clear existing ElevenLabs instance so it gets recreated with new key
    if (this.instances.has(TTSService.ELEVENLABS)) {
      const instance = this.instances.get(TTSService.ELEVENLABS);
      instance?.cleanup?.();
      this.instances.delete(TTSService.ELEVENLABS);
    }
  }

  /**
   * Check if ElevenLabs API key is configured
   * @returns true if API key is set
   */
  static hasElevenLabsApiKey(): boolean {
    return !!this.elevenLabsApiKey;
  }

  /**
   * Create or retrieve a TTS service instance
   * @param service - The type of TTS service to create
   * @returns An instance of the requested TTS service
   * @throws Error if the service is not supported or API key is missing
   */
  static create(service: TTSService): ITTSService {
    // Return cached instance if available
    if (this.instances.has(service)) {
      return this.instances.get(service)!;
    }

    let instance: ITTSService;

    switch (service) {
      case TTSService.WEB_SPEECH:
        instance = new WebSpeechTTSService();
        break;

      case TTSService.ELEVENLABS:
        if (!this.elevenLabsApiKey) {
          throw new Error(
            'ElevenLabs API key not configured. Please set VITE_ELEVENLABS_API_KEY in your .env file.'
          );
        }
        instance = new ElevenLabsTTSService(this.elevenLabsApiKey);
        break;

      default:
        throw new Error(`Unknown TTS service: ${service}`);
    }

    // Cache the instance
    this.instances.set(service, instance);
    return instance;
  }

  /**
   * Check if a service is supported/available
   * @param service - The type of TTS service to check
   * @returns true if the service can be used
   */
  static isServiceSupported(service: TTSService): boolean {
    try {
      if (service === TTSService.ELEVENLABS) {
        // ElevenLabs requires API key
        return this.hasElevenLabsApiKey();
      }
      const instance = this.create(service);
      return instance.isSupported();
    } catch {
      return false;
    }
  }

  /**
   * Get all supported services
   * @returns Array of supported service types
   */
  static getSupportedServices(): TTSService[] {
    const supported: TTSService[] = [];

    // Web Speech is always checked
    if (this.isServiceSupported(TTSService.WEB_SPEECH)) {
      supported.push(TTSService.WEB_SPEECH);
    }

    // ElevenLabs is supported if API key is configured
    if (this.hasElevenLabsApiKey()) {
      supported.push(TTSService.ELEVENLABS);
    }

    return supported;
  }

  /**
   * Clean up all service instances
   * Call this when the app unmounts to free resources
   */
  static cleanup(): void {
    this.instances.forEach((instance) => {
      if (instance.cleanup) {
        instance.cleanup();
      }
    });
    this.instances.clear();
  }

  /**
   * Reset the factory (clears all cached instances)
   * Useful for testing or when configuration changes
   */
  static reset(): void {
    this.cleanup();
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the default TTS service (Web Speech API)
 * @returns The default service type
 */
export function getDefaultTTSService(): TTSService {
  // Currently only Web Speech is supported
  return TTSService.WEB_SPEECH;
}

/**
 * Get a human-readable name for a service
 * @param service - The service type
 * @returns Human-readable name
 */
export function getServiceName(service: TTSService): string {
  switch (service) {
    case TTSService.WEB_SPEECH:
      return 'Browser Voice';
    case TTSService.ELEVENLABS:
      return 'ElevenLabs';
    default:
      return 'Unknown Service';
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TTSServiceFactory;
