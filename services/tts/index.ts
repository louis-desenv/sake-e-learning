/**
 * TTS Service Module
 *
 * Unified Text-to-Speech service layer supporting multiple providers.
 *
 * @fileoverview Main export file for TTS services
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export * from './types';

// ============================================================================
// SERVICES
// ============================================================================

export { WebSpeechTTSService } from './webSpeechTTSService';
export { ElevenLabsTTSService } from './elevenlabsTTSService';
export { GoogleCloudTTSService } from './googleCloudTTSService';

// ============================================================================
// FACTORY
// ============================================================================

export * from './ttsServiceFactory';
