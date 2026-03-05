/**
 * Avatar Chat Page (No Scenario)
 *
 * Simple wrapper for avatar chat without a specific scenario.
 * Renders the VoiceChatUI component without scenario context.
 *
 * @fileoverview This component provides a generic avatar chat interface
 * without any scenario-specific context or routing.
 *
 * @dependencies react, ../../components
 *
 * @author SAke E-Learning Team
 * @version 3.1.0
 */

import VoiceChatUI from '../../components/VoiceChatUI';

/**
 * Generic avatar chat page component.
 * Renders VoiceChatUI without a specific scenario.
 *
 * @component WithAvatarChat
 * @returns {JSX.Element} VoiceChatUI without scenario
 *
 * @example
 * ```tsx
 * // In router configuration
 * <Route path="/chat/with-avatar" element={<WithAvatarChat />} />
 * ```
 */
const WithAvatarChat = () => {
  return <VoiceChatUI />;
};

export default WithAvatarChat;
