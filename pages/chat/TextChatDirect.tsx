/**
 * Text Chat Page (No Scenario)
 *
 * Simple wrapper for text chat without a specific scenario.
 * Renders the TextChatUI component without scenario context.
 *
 * @fileoverview This component provides a generic text chat interface
 * without any scenario-specific context or routing.
 *
 * @dependencies react, ../../components
 *
 * @author SAke E-Learning Team
 * @version 3.1.0
 */

import TextChatUI from '../../components/TextChatUI';

/**
 * Generic text chat page component.
 * Renders TextChatUI without a specific scenario.
 *
 * @component TextChatDirect
 * @returns {JSX.Element} TextChatUI without scenario
 *
 * @example
 * ```tsx
 * // In router configuration
 * <Route path="/chat/text" element={<TextChatDirect />} />
 * ```
 */
const TextChatDirect = () => {
  return <TextChatUI />;
};

export default TextChatDirect;
