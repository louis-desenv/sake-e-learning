/**
 * Voice-Only Chat Page (No Scenario)
 *
 * Simple wrapper for voice-only chat without a specific scenario.
 * Uses Gemini Live API directly (without LiveKit) for real-time voice chat.
 *
 * @fileoverview This component provides a generic voice-only chat interface
 * using direct WebSocket connection to Gemini Live API.
 *
 * @dependencies react, ../../components/GeminiVoiceChat
 *
 * @author SAke E-Learning Team
 * @version 4.0.0
 */

import GeminiVoiceChat from '../../components/GeminiVoiceChat';

/**
 * Generic voice-only chat page component.
 * Uses Gemini Live API directly without LiveKit infrastructure.
 *
 * @component VoiceOnlyChat
 * @returns {JSX.Element} GeminiVoiceChat component
 *
 * @example
 * ```tsx
 * // In router configuration
 * <Route path="/chat/voice-only" element={<VoiceOnlyChat />} />
 * ```
 */
const VoiceOnlyChat = () => {
  return <GeminiVoiceChat />;
};

export default VoiceOnlyChat;
