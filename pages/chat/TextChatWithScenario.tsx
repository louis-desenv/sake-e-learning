/**
 * Text Chat Page with Scenario
 *
 * Wrapper component that extracts scenario from URL parameter
 * and renders the TextChatUI component with that scenario.
 *
 * @fileoverview This component enables URL-based navigation like /chat/text/job-interviews
 * by parsing the scenario slug from the URL and passing it to TextChatUI.
 *
 * @dependencies react, react-router-dom, ../../components, ../../types
 *
 * @author SAke E-Learning Team
 * @version 3.1.0
 */

import { useParams, Navigate, useNavigate } from 'react-router-dom';
import TextChatUI from '../../components/TextChatUI';
import { useEntitlements } from '../../hooks/useEntitlements';
import { FeatureLockScreen } from '../../components/access/FeatureLockScreen';
import { getScenarioFromSlug, isValidScenarioSlug } from '../../types/routeMapping';

/**
 * Text chat page component that accepts a scenario via URL parameter.
 * Renders TextChatUI with the scenario extracted from the route.
 *
 * @component TextChatWithScenario
 * @returns {JSX.Element} TextChatUI with scenario, or redirect if invalid
 *
 * @example
 * ```tsx
 * // In router configuration
 * <Route path="/chat/text/:scenario" element={<TextChatWithScenario />} />
 *
 * // URL examples:
 * // /chat/text/job-interviews       → Chat with JOB_INTERVIEWS scenario
 * // /chat/text/phone-screen         → Chat with PHONE_SCREEN scenario
 * // /chat/text/invalid-scenario     → Redirects to /chat/text
 * ```
 */
const TextChatWithScenario = () => {
  // Extract scenario slug from URL parameter
  const { scenario } = useParams<{ scenario: string }>();

  // Validate scenario slug
  if (!scenario || !isValidScenarioSlug(scenario)) {
    return <Navigate to="/chat" replace />;
  }

  // Convert slug to ChatScenario enum
  const chatScenario = getScenarioFromSlug(scenario);

  const { getLock, loading } = useEntitlements();
  const textLock = getLock('text_chat');
  const navigate = useNavigate();

  if (!chatScenario) {
    return <Navigate to="/chat" replace />;
  }

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

  // Render TextChatUI with the scenario
  return (
    <div className="max-w-4xl mx-auto w-full h-[calc(100dvh-105px)] md:h-[88vh] md:my-auto flex flex-col overflow-hidden px-4 pt-2 pb-2 md:pt-8 md:pb-4">
      <TextChatUI scenario={chatScenario} />
    </div>
  );
};

export default TextChatWithScenario;
