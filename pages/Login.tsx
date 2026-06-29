/**
 * Login Page Component
 *
 * Authentication page supporting email/password login and Google OAuth.
 * Handles both user registration and sign-in with form validation.
 *
 * @fileoverview This component provides the authentication interface with support
 * for traditional email/password authentication and Google OAuth. It integrates
 * with the backend API and manages the authentication flow.
 *
 * @dependencies react, ../types, ../services/api
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React, { useState, useEffect } from 'react';
import type { UserProfile, ApiUserDto } from '../types';
import { EnglishLevel, LearningGoal } from '../types';
import { authService } from '../services/api';
import { useTranslation } from 'react-i18next';
import { Check, X, AlertTriangle, Mail, LockKeyhole, Eye, EyeOff, Loader2 } from 'lucide-react';
import { requestFeatureTourOnNextMount } from '../utils/featureTourState';
import { isLocalOnlyFeatureEnabled } from '../utils/localOnlyFeatures';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Props for the Login component.
 *
 * @interface LoginProps
 */
interface LoginProps {
  /** Callback invoked when user successfully logs in or registers */
  onLoginComplete: (profile: UserProfile) => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Retrieves onboarding data from localStorage.
 * Used to pre-fill registration form with previously entered information.
 *
 * @function getOnboardingData
 * @returns {Partial<UserProfile> | null} Onboarding data if available, null otherwise
 *
 * @private
 */
const getOnboardingData = (): Partial<UserProfile> | null => {
  try {
    const data = localStorage.getItem('onboardingData');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

/**
 * Gets the account creation success message based on the browser's language.
 */
const getAccountCreatedMessage = (): string => {
  const lang = (navigator.language || 'en').toLowerCase();
  if (lang.startsWith('pt')) {
    return 'Conta criada com sucesso! Fa├ºa login para continuar.';
  }
  if (lang.startsWith('es')) {
    return '┬íCuenta creada con ├®xito! Inicie sesi├│n para continuar.';
  }
  if (lang.startsWith('fr')) {
    return 'Compte cr├®├® avec succ├¿s ! Connectez-vous pour continuer.';
  }
  if (lang.startsWith('de')) {
    return 'Konto erfolgreich erstellt! Melden Sie sich an, um fortzufahren.';
  }
  if (lang.startsWith('it')) {
    return 'Account creato con successo! Accedi per continuare.';
  }
  return 'Account created successfully! Log in to continue.';
};


/**
 * Transforms API user DTO to full user profile.
 * Merges backend user data with onboarding preferences.
 *
 * @function mapUserToProfile
 * @param {ApiUserDto} apiUser - User data from backend API
 * @returns {UserProfile} Complete user profile with learning preferences
 *
 * @private
 *
 * @example
 * ```ts
 * const apiUser = { id: 1, name: 'John', email: 'john@example.com', isActive: true };
 * const profile = mapUserToProfile(apiUser);
 * // Returns: { name: 'John', level: EnglishLevel.BEGINNER, ... }
 * ```
 */
const mapUserToProfile = (apiUser: ApiUserDto): UserProfile => {
  // Try to use onboarding data for preferences
  const onboardingData = getOnboardingData();

  return {
    id: apiUser.id?.toString(),
    name: apiUser.name,
    email: apiUser.email,
    hasPassword: apiUser.hasPassword,
    level: (apiUser.englishLevel as EnglishLevel) || onboardingData?.level || EnglishLevel.BEGINNER,
    goals: (apiUser.learningGoals as LearningGoal[]) || onboardingData?.goals || [LearningGoal.CONVERSATION],
    interests: onboardingData?.interests || 'General English',
    nativeLanguage: (apiUser.nativeLanguage as any) || onboardingData?.nativeLanguage || ('Portuguese' as any),
    activePlan: apiUser.activePlan,
    isInTrial: apiUser.isInTrial,
    trialEndDate: apiUser.trialEndDate,
    hasUsedTrial: apiUser.hasUsedTrial,
    hasCompletedOnboarding: apiUser.hasCompletedOnboarding,
    hasSeenFeatureTour: apiUser.hasSeenFeatureTour,
    featureTourCompletedAtUtc: apiUser.featureTourCompletedAtUtc,
    dailyGoal: (apiUser.dailyGoal as any) || onboardingData?.dailyGoal,
  };
};


// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Authentication page with login and registration forms.
 * Supports email/password authentication and Google OAuth.
 *
 * @component Login
 * @param {LoginProps} props - Component props
 * @returns {JSX.Element} Authentication interface
 *
 * @example
 * ```tsx
 * <Login
 *   onLoginComplete={(profile) => {
 *     // Store user and redirect to app
 *     setUserProfile(profile);
 *     navigate('/home');
 *   }}
 * />
 * ```
 */
const Login: React.FC<LoginProps> = ({ onLoginComplete }) => {
  const { t } = useTranslation();
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Name field for registration

  // UI state
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotDevLink, setForgotDevLink] = useState('');
  const [passwordSetupRequired, setPasswordSetupRequired] = useState(false);
  const [passwordSetupLoading, setPasswordSetupLoading] = useState(false);
  const [passwordSetupMessage, setPasswordSetupMessage] = useState('');
  const [passwordSetupDevLink, setPasswordSetupDevLink] = useState('');
  const localOnlyFeaturesEnabled = isLocalOnlyFeatureEnabled();

  /**
   * Pre-fills name field from onboarding data if available.
   * Runs on component mount.
   */
  useEffect(() => {
    const onboardingData = getOnboardingData();
    if (onboardingData?.name) {
      setName(onboardingData.name);
    }
  }, []);

  const getMappedError = (msg: string | undefined): string => {
    if (!msg) return '';
    const normalized = msg.toLowerCase();
    if (
      normalized.includes('invalid') ||
      normalized.includes('inv├ílid') ||
      normalized.includes('senha incorreta') ||
      normalized.includes('credenciais') ||
      normalized.includes('credentials')
    ) {
      return t('login.invalidCredentials', { defaultValue: 'Invalid email or password.' });
    }
    return msg;
  };

  /**
   * Handles form submission for login or registration.
   *
   * @async
   * @param {React.FormEvent} e - Form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPasswordSetupRequired(false);
    setPasswordSetupMessage('');
    setPasswordSetupDevLink('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Registration flow
        const registerName = name || getOnboardingData()?.name || '';
        const response = await authService.register(registerName, email, password);
        if (response.success && response.user) {
          setError('');
          setShowSuccessModal(true);
        } else {
          setError(response.message || t('login.registerFailed', { defaultValue: 'Registration failed' }));
        }
      } else {
        // Login flow
        const response = await authService.login(email, password);
        if (response.success && response.user) {
          // Store auth token if provided
          if (response.token) {
            localStorage.setItem('auth_token', response.token);
          }
          // Complete login with user profile
          const profile = mapUserToProfile(response.user);
          if (profile.hasCompletedOnboarding && profile.hasSeenFeatureTour !== true) {
            requestFeatureTourOnNextMount();
          }
          onLoginComplete(profile);
        } else {
          setError(getMappedError(response.message) || t('login.loginFailed', { defaultValue: 'Login failed' }));
        }
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      const responseData = err.response?.data;
      if (localOnlyFeaturesEnabled && responseData?.reasonCode === 'password_not_set') {
        setPasswordSetupRequired(true);
        setForgotEmail(email);
        setError('');
        return;
      }

      setError(getMappedError(responseData?.message) || t('login.genericError', { defaultValue: 'An error occurred. Check your connection.' }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initiates Google OAuth login flow.
   * Redirects the browser to Google's authentication page.
   */
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    authService.googleLogin();
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setForgotLoading(true);
    setForgotMessage('');
    setForgotDevLink('');

    try {
      const response = await authService.forgotPassword(forgotEmail || email);
      setForgotMessage(response.message || t('login.forgotSuccess', { defaultValue: 'If the email is registered, we will send password reset instructions.' }));
      if (response.resetUrl) {
        setForgotDevLink(response.resetUrl);
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setForgotMessage(t('login.genericError', { defaultValue: 'An error occurred. Check your connection.' }));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSendPasswordSetupLink = async () => {
    setPasswordSetupLoading(true);
    setPasswordSetupMessage('');
    setPasswordSetupDevLink('');

    try {
      const response = await authService.forgotPassword(email);
      setPasswordSetupMessage(response.message || t('login.passwordSetupSent', { defaultValue: 'If the email is registered, we will send instructions to create a password.' }));
      if (response.resetUrl) {
        setPasswordSetupDevLink(response.resetUrl);
      }
    } catch (err: any) {
      console.error('Password setup link error:', err);
      setPasswordSetupMessage(t('login.genericError', { defaultValue: 'An error occurred. Check your connection.' }));
    } finally {
      setPasswordSetupLoading(false);
    }
  };

  /**
   * Toggles between login and registration modes.
   */
  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setForgotMessage('');
    setPasswordSetupRequired(false);
    setPasswordSetupMessage('');
    setPasswordSetupDevLink('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6 text-gray-800">
        {/* Logo and title */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/logo-sakae.png"
              alt={t('login.sakaeLogoAlt')}
              className="h-32 sm:h-40 md:h-48 w-auto object-contain drop-shadow-md"
            />
          </div>
          {/* <p className="text-gray-600">Learn English with AI</p> */}
          <h1 className="text-2xl font-extrabold text-gray-900">
            {isSignUp
              ? t('login.titleSignUp', { defaultValue: 'Create your account' })
              : t('login.titleSignIn', { defaultValue: 'Sign in to FlowSpeak' })}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {isSignUp
              ? t('login.subtitleSignUp', { defaultValue: 'Create an account to save your progress and access your practice.' })
              : t('login.subtitleSignIn', { defaultValue: 'Continue your AI-powered English practice.' })}
          </p>
        </div>



        {/* Google OAuth button */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={googleLoading}
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md text-gray-800 font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 mr-3 animate-spin text-gray-500" />
          ) : (
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          {googleLoading
            ? t('login.processing', { defaultValue: 'Processing...' })
            : t('login.continueWithGoogle', { defaultValue: 'Continue with Google' })}
        </button>

        {/* Divider */}
        <div className="flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 bg-white text-gray-500 text-sm font-semibold">{t('login.or', { defaultValue: 'or' })}</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Login/Registration form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field (registration only) */}
          {isSignUp && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('login.name', { defaultValue: 'Name' })}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                placeholder={t('login.namePlaceholder', { defaultValue: 'Your full name' })}
              />
            </div>
          )}

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('login.email', { defaultValue: 'Email' })}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setPasswordSetupRequired(false);
                setPasswordSetupMessage('');
                setPasswordSetupDevLink('');
              }}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white"
              placeholder={t('login.emailPlaceholder', { defaultValue: 'Enter your email' })}
            />
          </div>

          {/* Password field */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t('login.password', { defaultValue: 'Password' })}
              </label>
              {!isSignUp && localOnlyFeaturesEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotMessage('');
                    setForgotDevLink('');
                    setShowForgotModal(true);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  {t('login.forgotPassword', { defaultValue: 'Forgot password?' })}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                placeholder={t('login.passwordPlaceholder', { defaultValue: 'Enter your password' })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label={showPassword
                  ? t('login.hidePassword', { defaultValue: 'Hide password' })
                  : t('login.showPassword', { defaultValue: 'Show password' })}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {passwordSetupRequired && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-900">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {t('login.passwordNotSetTitle', { defaultValue: 'Esta conta foi criada com Google' })}
                  </p>
                  <p className="mt-1 leading-relaxed text-blue-800">
                    {t('login.passwordNotSetDesc', { defaultValue: 'Continue com Google agora ou receba um link para criar uma senha e entrar também com email e senha.' })}
                  </p>
                  {passwordSetupMessage && (
                    <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-blue-800">
                      {passwordSetupMessage}
                      {passwordSetupDevLink && (
                        <a
                          href={passwordSetupDevLink}
                          className="mt-2 block break-all font-bold text-blue-700 underline"
                        >
                          {t('login.devResetLink', { defaultValue: 'Local test link' })}
                        </a>
                      )}
                    </p>
                  )}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleSendPasswordSetupLink}
                      disabled={passwordSetupLoading || !email}
                      className="rounded-xl bg-blue-600 px-4 py-2.5 font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {passwordSetupLoading
                        ? t('login.processing', { defaultValue: 'Processing...' })
                        : t('login.sendPasswordSetupLink', { defaultValue: 'Criar senha por email' })}
                    </button>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={googleLoading}
                      className="rounded-xl bg-white px-4 py-2.5 font-bold text-blue-700 ring-1 ring-blue-200 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {t('login.continueWithGoogle', { defaultValue: 'Continuar com Google' })}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
          >
            {loading ? t('login.processing', { defaultValue: 'Processing...' }) : isSignUp ? t('login.createAccount', { defaultValue: 'Create Account' }) : t('login.signIn', { defaultValue: 'Sign In' })}
          </button>
        </form>

        {/* Toggle between login and registration */}
        <div className="text-center">
          <button
            onClick={toggleSignUp}
            type="button"
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            {isSignUp
              ? t('login.hasAccount', { defaultValue: 'Already have an account? Sign In' })
              : t('login.noAccount', { defaultValue: "Don't have an account? Create Account" })}
          </button>
        </div>

        {/* Terms of service notice */}
        <div className="text-center text-xs text-gray-500">
          {t('login.terms', { defaultValue: 'By continuing, you agree to our Terms of Service and Privacy Policy.' })}
        </div>

        {/* DEV ONLY ÔÇö bypass login for local testing */}
        {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
          <button
            type="button"
            onClick={() => {
              onLoginComplete({
                id: 'dev-user-001',
                name: 'Dev User',
                email: 'dev-test@sakae.com',
                level: EnglishLevel.BEGINNER,
                goals: [LearningGoal.CONVERSATION],
                interests: 'Testing',
                nativeLanguage: 'Portuguese' as any,
              });
            }}
            className="w-full py-2 rounded-xl border-2 border-dashed border-orange-400 text-orange-500 text-sm font-semibold hover:bg-orange-50 transition-colors"
          >
            ­ƒøá´©Å Dev Login (local only)
          </button>
        )}

        {/* Custom Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200 relative">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setIsSignUp(false);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4 animate-bounce">
                <Check size={32} strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {t('login.successModalTitle', { defaultValue: 'Account Created!' })}
              </h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                {t('login.successModalDesc', { defaultValue: 'Your account was successfully created! Log in now using the credentials you just registered.' })}
              </p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setIsSignUp(false); // Switch to sign in view with email/password pre-filled
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl active:scale-98 text-sm cursor-pointer"
              >
                {t('login.successModalBtn', { defaultValue: 'Log in to my account' })}
              </button>
            </div>
          </div>
        )}

        {localOnlyFeaturesEnabled && showForgotModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200 relative">
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer"
                aria-label={t('common.close', { defaultValue: 'Close' })}
              >
                <X size={20} />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <LockKeyhole size={28} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {t('login.forgotTitle', { defaultValue: 'Reset your password' })}
              </h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {t('login.forgotDescription', { defaultValue: 'Enter your email and we will send a link to create a new password.' })}
              </p>

              <form onSubmit={handleForgotPassword} className="mt-6 space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                    placeholder={t('login.emailPlaceholder', { defaultValue: 'Enter your email' })}
                  />
                </div>

                {forgotMessage && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800 leading-relaxed">
                    {forgotMessage}
                    {forgotDevLink && (
                      <a
                        href={forgotDevLink}
                        className="mt-2 block break-all font-bold text-blue-700 underline"
                      >
                        {t('login.devResetLink', { defaultValue: 'Local test link' })}
                      </a>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {forgotLoading
                    ? t('login.processing', { defaultValue: 'Processing...' })
                    : t('login.forgotSubmit', { defaultValue: 'Send link' })}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Custom Error Modal */}
        {error && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200 relative">
              <button
                onClick={() => setError('')}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4 animate-pulse">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {t('login.errorModalTitle', { defaultValue: 'An Error Occurred' })}
              </h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                {error}
              </p>
              <button
                onClick={() => setError('')}
                className="w-full py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-all active:scale-98 text-sm cursor-pointer"
              >
                {t('login.errorModalBtn', { defaultValue: 'Close' })}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
