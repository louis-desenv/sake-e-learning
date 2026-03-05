/**
 * SAke E-Learning Application Root Component
 *
 * Main application component managing routing, authentication state,
 * and user onboarding flow. Implements protected routes and navigation.
 *
 * @fileoverview This is the root component of the SAke E-Learning application.
 * It manages the complete user flow from onboarding through authenticated
 * sessions, with route protection and navigation controls.
 *
 * @dependencies react, react-router-dom, context, hooks, pages, components
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React from 'react';
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Link,
  Outlet,
} from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import useLocalStorage from './hooks/useLocalStorage';
import { type UserProfile } from './types';

// Page Components
import Onboarding from './components/Onboarding';
import Login from './pages/Login';
import HomeDashboard from './pages/HomeDashboard';
import IaChat from './pages/IaChat';
import GuidedLearning from './pages/GuidedLearning';
import IaLibrary from './pages/IaLibrary';
import MyProfile from './pages/MyProfile';
import GoogleCallback from './pages/GoogleCallback';

// New Chat Route Wrappers (v3.1.0)
import TextChatDirect from './pages/chat/TextChatDirect';
import TextChatWithScenario from './pages/chat/TextChatWithScenario';
import VoiceOnlyChat from './pages/chat/VoiceOnlyChat';
import WithAvatarChat from './pages/chat/WithAvatarChat';

// UI Components
import BottomNav from './components/BottomNav';
import PageTransition from './components/PageTransition';
import AudioOnlyChat from './components/AudioOnlyChat';
import { HomeIcon } from './components/icons/NavIcons';

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================

/**
 * Application layout wrapper with navigation controls.
 * Provides a back-to-home button and renders child routes with transitions.
 *
 * @component AppLayout
 * @returns {JSX.Element} Layout with navigation and outlet for child routes
 *
 * @example
 * ```tsx
 * <Route element={<AppLayout />}>
 *   <Route path="/home" element={<HomeDashboard />} />
 * </Route>
 * ```
 */
const AppLayout: React.FC = () => {
  const location = useLocation();
  const showHomeButton = location.pathname !== '/home' && location.pathname !== '/';

  return (
    <>
      {/* Back to Home button - shown on all pages except home */}
      {showHomeButton && (
        <Link
          to="/home"
          aria-label="Back to Home"
          className="fixed top-4 left-4 z-50 flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg text-gray-800 hover:bg-white hover:shadow-xl transition-all duration-300 group"
        >
          <HomeIcon className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
          <span className="font-semibold text-sm hidden sm:inline">Home</span>
        </Link>
      )}

      {/* Main content area with page transitions */}
      <div className={showHomeButton ? 'pt-16 pb-20' : 'pb-20'}>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </div>
    </>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

/**
 * Root application component.
 * Manages authentication state, routing, and navigation structure.
 *
 * @component App
 * @returns {JSX.Element} Complete application with routing and state management
 *
 * @remarks Application flow:
 * 1. First visit → Onboarding → Login
 * 2. Return visit → Login (if logged out) → Home Dashboard
 * 3. Authenticated → All protected routes accessible
 *
 * @example
 * ```tsx
 * // Render the app
 * ReactDOM.render(<App />, document.getElementById('root'));
 * ```
 */
const App: React.FC = () => {
  // User profile state (persisted to localStorage)
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>(
    'userProfile',
    null,
  );

  // Onboarding completion state (persisted to localStorage)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage<boolean>(
    'hasCompletedOnboarding',
    false,
  );

  /**
   * Logs out the current user.
   * Clears the user profile from state and localStorage.
   */
  const logout = () => setUserProfile(null);

  const activeUser = userProfile;

  return (
    <UserProvider value={{ user: activeUser, logout }}>
      <HashRouter>
        <div className="min-h-screen bg-blue-50/50 font-sans">
          <Routes>
            {/* ====================================================================
              PUBLIC ROUTES
              Always accessible, no authentication required
            ==================================================================== */}
            <Route
              path="/google-callback"
              element={
                <GoogleCallback
                  onLoginComplete={(profile) => {
                    setUserProfile(profile);
                    // Don't mark onboarding as complete - user will go through onboarding after login
                  }}
                />
              }
            />

            {/* ====================================================================
              LOGIN ROUTE
              First step - user logs in before onboarding
            ==================================================================== */}
            <Route
              path="/login"
              element={
                activeUser ? (
                  !hasCompletedOnboarding ? (
                    <Navigate to="/onboarding" replace />
                  ) : (
                    <Navigate to="/home" replace />
                  )
                ) : (
                  <Login onLoginComplete={setUserProfile} />
                )
              }
            />

            {/* ====================================================================
              ONBOARDING FLOW
              Shown after login for first-time users
            ==================================================================== */}
            {activeUser && !hasCompletedOnboarding && (
              <Route
                path="*"
                element={
                  <Onboarding
                    onOnboardingComplete={(profile) => {
                      // Save onboarding data temporarily in localStorage
                      localStorage.setItem('onboardingData', JSON.stringify(profile));
                      setHasCompletedOnboarding(true);
                      // Redirect to home via router
                      window.location.hash = '#/home';
                    }}
                  />
                }
              />
            )}

            {/* ====================================================================
              FALLBACK FOR LOGGED OUT USERS
              Redirects to login if not logged in
            ==================================================================== */}
            {!activeUser && (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}

            {/* ====================================================================
              PROTECTED ROUTES
              Only accessible when user is authenticated
            ==================================================================== */}
            {activeUser && (
              <Route element={<AppLayout />}>
                {/* Default redirect to home */}
                <Route path="/" element={<Navigate to="/home" />} />

                {/* Main application pages */}
                <Route path="/home" element={<HomeDashboard />} />
                <Route path="/real-life" element={<IaChat />} />
                <Route path="/real-life/:scenarioSlug" element={<IaChat />} />
                <Route path="/guided-learning" element={<GuidedLearning />} />
                <Route path="/guided-learning/:topicSlug" element={<IaChat />} />
                <Route path="/library" element={<IaLibrary />} />
                <Route path="/profile" element={<MyProfile />} />

                {/* ================================================================
                  NEW ROUTE STRUCTURE (v3.1.0) - URL-based navigation
                  ================================================================ */}

                {/* Chat de Texto */}
                <Route path="/chat/text" element={<TextChatDirect />} />
                <Route path="/chat/text/:scenario" element={<TextChatWithScenario />} />

                {/* Chat de Voz (Sem Avatar) - More descriptive name */}
                <Route path="/chat/voice-only" element={<VoiceOnlyChat />} />

                {/* Chat com Avatar - More descriptive name */}
                <Route path="/chat/with-avatar" element={<WithAvatarChat />} />

                {/* ================================================================
                  BACKWARD COMPATIBILITY REDIRECTS (v3.1.0)
                  Redirects from old route names to new URL structure
                  ================================================================ */}
                <Route path="/livekit-chat" element={<Navigate to="/chat/voice-only" replace />} />
                <Route path="/livekit-video" element={<Navigate to="/chat/with-avatar" replace />} />
                <Route path="/text-chat" element={<Navigate to="/chat/text" replace />} />
                <Route path="/avatar-chat" element={<Navigate to="/chat/with-avatar" replace />} />
                <Route path="/audio-chat" element={<Navigate to="/chat/voice-only" replace />} />

                {/* Redirect old /chat/audio and /chat/avatar to new descriptive URLs */}
                <Route path="/chat/audio" element={<Navigate to="/chat/voice-only" replace />} />
                <Route path="/chat/avatar" element={<Navigate to="/chat/with-avatar" replace />} />

                {/* Redirect old audio/avatar scenario routes (scenarios are text-only now) */}
                <Route path="/chat/audio/:scenario" element={<Navigate to="/chat/voice-only" replace />} />
                <Route path="/chat/avatar/:scenario" element={<Navigate to="/chat/with-avatar" replace />} />
              </Route>
            )}
          </Routes>

          {/* Bottom navigation bar - only shown when logged in */}
          {activeUser && <BottomNav />}
        </div>
      </HashRouter>
    </UserProvider>
  );
};

export default App;
