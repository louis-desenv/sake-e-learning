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

import { useParams, Navigate } from 'react-router-dom';
import TextChatUI from '../../components/TextChatUI';
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

  if (!chatScenario) {
    return <Navigate to="/chat" replace />;
  }

  // Render TextChatUI with the scenario
  return <TextChatUI scenario={chatScenario} />;
};

export default TextChatWithScenario;
