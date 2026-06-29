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
import { useEntitlements } from '../../hooks/useEntitlements';
import { FeatureLockScreen } from '../../components/access/FeatureLockScreen';
import { useNavigate } from 'react-router-dom';

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
  const { getLock, loading } = useEntitlements();
  const textLock = getLock('text_chat');
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto w-full h-[calc(100dvh-105px)] md:h-[88vh] md:my-auto flex items-center justify-center px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!loading && textLock && textLock.status !== 'allowed') {
    return (
      <FeatureLockScreen
        decision={textLock}
        onBack={() => navigate('/real-life')}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full h-[calc(100dvh-105px)] md:h-[88vh] md:my-auto flex flex-col overflow-hidden px-4 pt-2 pb-2 md:pt-8 md:pb-4">
      <TextChatUI />
    </div>
  );
};

export default TextChatDirect;
