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
    name: apiUser.name,
    level: onboardingData?.level || EnglishLevel.BEGINNER,
    goals: onboardingData?.goals || [LearningGoal.CONVERSATION],
    interests: onboardingData?.interests || 'General English',
    nativeLanguage: onboardingData?.nativeLanguage || ('Portuguese' as any),
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
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Name field for registration

  // UI state
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  /**
   * Handles form submission for login or registration.
   *
   * @async
   * @param {React.FormEvent} e - Form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Registration flow
        const registerName = name || getOnboardingData()?.name || '';
        const response = await authService.register(registerName, email, password);
        if (response.success && response.user) {
          // Switch to login mode with success message
          setIsSignUp(false);
          setError('');
          alert('Conta criada com sucesso! Faça login para continuar.');
        } else {
          setError(response.message || 'Registration failed');
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
          onLoginComplete(mapUserToProfile(response.user));
        } else {
          setError(response.message || 'Login failed');
        }
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      setError(err.response?.data?.message || 'An error occurred. check connection.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initiates Google OAuth login flow.
   * Redirects the browser to Google's authentication page.
   */
  const handleGoogleLogin = () => {
    authService.googleLogin();
  };

  /**
   * Toggles between login and registration modes.
   */
  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6">
        {/* Logo and title */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/logo-sakae.png"
              alt="Sakae Logo"
              className="h-32 sm:h-40 md:h-48 w-auto object-contain drop-shadow-md"
            />
          </div>
          {/* <p className="text-gray-600">Learn English with AI</p> */}
        </div>

        {/* Error message display */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
            {error}
          </div>
        )}

        {/* Google OAuth button */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 bg-white text-gray-500 text-sm">or</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Login/Registration form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field (registration only) */}
          {isSignUp && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Your full name"
              />
            </div>
          )}

          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your email"
            />
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter your password"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
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
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </button>
        </div>

        {/* Terms of service notice */}
        <div className="text-center text-xs text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
};

export default Login;
