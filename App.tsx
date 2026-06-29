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
import { useTranslation } from 'react-i18next';
import { loadLanguagePack } from './i18n';
import { resolveInterfaceLang } from './utils/langUtils';
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
import ResetPassword from './pages/ResetPassword';
import AvailablePlans from './pages/AvailablePlans';
import UsageDashboard from './dev-tools/UsageDashboard';


// New Chat Route Wrappers (v3.1.0)
import TextChatDirect from './pages/chat/TextChatDirect';
import TextChatWithScenario from './pages/chat/TextChatWithScenario';
import VoiceOnlyChat from './pages/chat/VoiceOnlyChat';
import WithAvatarChat from './pages/chat/WithAvatarChat';

// UI Components
import BottomNav from './components/BottomNav';
import PageTransition from './components/PageTransition';
import AudioOnlyChat from './components/AudioOnlyChat';
import FeatureTour from './components/FeatureTour';
import { isUnrestrictedTestAccount } from './utils/testAccounts';
import { GOOGLE_LOGIN_TOUR_PENDING_KEY, requestFeatureTourOnNextMount } from './utils/featureTourState';
import { Home as HomeIconLucide } from 'lucide-react';
import {
  isResetReminderEnabled,
  RESET_REMINDER_SETTINGS_EVENT,
} from './gamification/hooks/useDailyResetReminder';
import { isLocalOnlyFeatureEnabled } from './utils/localOnlyFeatures';

// Gamification
import { GamificationProvider } from './gamification/context/GamificationContext';

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
  const { t } = useTranslation();
  const location = useLocation();
  const showHomeButton = location.pathname !== '/home' && location.pathname !== '/';

  return (
    <>
      {/* Botão voltar para o início ocultado / comentado por favor:
      {showHomeButton && (
        <Link
          to="/home"
          aria-label={t('navigation.backToHome')}
          className="fixed top-4 left-4 z-50 flex items-center space-x-2 px-3 py-2 rounded-full shadow-lg transition-all duration-300 group"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
        >
          <HomeIconLucide size={15} strokeWidth={1.75} className="group-hover:text-purple-400 transition-colors" />
          <span className="font-semibold text-xs hidden sm:inline">{t('navigation.home')}</span>
        </Link>
      )}
      */}

      {/* Main content area with page transitions */}
      <div className="w-full min-h-screen md:min-h-0 md:h-screen flex flex-col pb-20 md:pb-0 overflow-x-hidden">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </div>
    </>
  );
};

interface AppChromeProps {
  activeUser: UserProfile | null;
  hasCompletedOnboarding?: boolean;
}

const AppChrome: React.FC<AppChromeProps> = ({ activeUser, hasCompletedOnboarding }) => {
  const location = useLocation();
  const hideAppChrome = ['/login', '/google-callback', '/reset-password'].includes(location.pathname);

  if (hideAppChrome || !activeUser || !hasCompletedOnboarding) return null;

  return (
    <>
      <BottomNav />
      <FeatureTour />
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
  const { t, i18n } = useTranslation();
  // User profile state (persisted to localStorage)
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile | null>(
    'userProfile',
    null,
  );
  const [resetReminderEnabled, setResetReminderEnabledState] = React.useState(isResetReminderEnabled);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, []);

  React.useEffect(() => {
    const syncResetReminderPreference = () => {
      setResetReminderEnabledState(isResetReminderEnabled());
    };

    window.addEventListener(RESET_REMINDER_SETTINGS_EVENT, syncResetReminderPreference);
    window.addEventListener('storage', syncResetReminderPreference);
    return () => {
      window.removeEventListener(RESET_REMINDER_SETTINGS_EVENT, syncResetReminderPreference);
      window.removeEventListener('storage', syncResetReminderPreference);
    };
  }, []);

  React.useEffect(() => {
    if (userProfile && userProfile.hasCompletedOnboarding) {
      const langCode = resolveInterfaceLang({
        nativeLanguage: userProfile.nativeLanguage,
        interfaceLanguage: userProfile.interfaceLanguage,
      });
      loadLanguagePack(langCode);
    }
  }, [userProfile]);

  /**
   * Logs out the current user.
   * Clears the user profile from state and localStorage.
   */
  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('authToken');
    setUserProfile(null);
  };

  // Listener global para token JWT expirado/inválido (401 vindo da API de gamificação).
  // Faz logout automático para que o usuário possa fazer login novamente com um token novo.
  React.useEffect(() => {
    const handleUnauthorized = () => {
      console.warn('[App] Sessão expirada. Fazendo logout automático...');
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeUser = React.useMemo(() => {
    if (userProfile && isUnrestrictedTestAccount(userProfile.email)) {
      return {
        ...userProfile,
        activePlan: { type: 'super', cycle: 'annual', startDate: new Date().toISOString() }
      } as UserProfile;
    }
    return userProfile;
  }, [userProfile]);
  const hasCompletedOnboarding = activeUser?.hasCompletedOnboarding;

  React.useEffect(() => {
    if (!activeUser || !hasCompletedOnboarding) return;
    if (activeUser.hasSeenFeatureTour === true) {
      sessionStorage.removeItem(GOOGLE_LOGIN_TOUR_PENDING_KEY);
      return;
    }
    if (sessionStorage.getItem(GOOGLE_LOGIN_TOUR_PENDING_KEY) !== 'true') return;

    requestFeatureTourOnNextMount();
    sessionStorage.removeItem(GOOGLE_LOGIN_TOUR_PENDING_KEY);
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('flowspeak:open-tour'));
    }, 250);
  }, [activeUser, hasCompletedOnboarding]);


  return (
    <UserProvider value={{ user: activeUser, logout, updateUser: setUserProfile }}>
      <GamificationProvider
        userId={activeUser?.id ?? activeUser?.name ?? null}
        bypassAccess={isUnrestrictedTestAccount(activeUser?.email)}
        enableResetReminder={!!(activeUser?.hasCompletedOnboarding && resetReminderEnabled && isLocalOnlyFeatureEnabled())}
      >
      <HashRouter>
        <div className="min-h-screen font-sans" style={{
          background: 'var(--bg-base)',
          color: 'var(--text-primary)',
          display: 'flex',
          justifyContent: 'center',
          /* subtle vignette on desktop */
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(124,92,255,0.07) 0%, transparent 70%)',
        }}>
          <div className="w-full min-h-screen flex flex-col md:flex-row relative" style={{
            background: 'var(--bg-base)',
            boxShadow: '0 0 80px rgba(0,0,0,0.6)',
          }}>
            {/* Sidebar navigation on desktop, bottom nav on mobile */}
            <AppChrome activeUser={activeUser} hasCompletedOnboarding={hasCompletedOnboarding} />
            {/* Oculta o menu durante o onboarding se necessário:
            activeUser && !window.location.hash.includes('onboarding') && <BottomNav />
            */}

            {/* Page content wrapper */}
            <div style={{ flex: 1, minWidth: 0 }}>
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

              <Route
                path="/reset-password"
                element={isLocalOnlyFeatureEnabled() ? <ResetPassword /> : <Navigate to="/login" replace />}
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
                      userName={activeUser?.name}
                      onOnboardingComplete={(profile) => {
                        if (activeUser.hasSeenFeatureTour !== true) {
                          sessionStorage.setItem(GOOGLE_LOGIN_TOUR_PENDING_KEY, 'true');
                          requestFeatureTourOnNextMount();
                        }
                        // Update the user profile with onboarding data and set hasCompletedOnboarding to true
                        setUserProfile({ ...activeUser, ...profile, hasCompletedOnboarding: true } as UserProfile);
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
              {activeUser && hasCompletedOnboarding && (
                <Route element={<AppLayout />}>
                  {/* Default redirect to home */}
                  <Route path="/" element={<Navigate to="/home" />} />

                  {/* Main application pages */}
                  <Route path="/home" element={<HomeDashboard />} />
                  <Route path="/plans" element={<AvailablePlans />} />
                  <Route path="/real-life" element={<IaChat />} />
                  <Route path="/real-life/:scenarioSlug" element={<IaChat />} />
                  <Route path="/guided-learning" element={<GuidedLearning />} />
                  <Route path="/guided-learning/:topicSlug" element={<IaChat />} />
                  <Route path="/library" element={<IaLibrary />} />
                  <Route path="/profile" element={<MyProfile />} />
                  {import.meta.env.DEV && (
                    <Route path="/usage-dashboard" element={<UsageDashboard />} />
                  )}


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
            </div>
          </div>
        </div>
      </HashRouter>
      </GamificationProvider>
    </UserProvider>
  );
};

export default App;
