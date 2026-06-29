/**
 * Google OAuth Callback Page
 *
 * Handles OAuth callback from Google authentication.
 * Processes the token from URL params and creates user session.
 *
 * @fileoverview This page handles the Google OAuth callback, extracting the token
 * from URL parameters, decoding user information, and creating a user session.
 *
 * @dependencies react, react-router-dom, ../types
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { UserProfile } from '../types';
import { EnglishLevel, LearningGoal } from '../types';
import { authService } from '../services/api';
import { mapApiUserToProfile } from '../utils/authMapping';
import { GOOGLE_LOGIN_TOUR_PENDING_KEY, requestFeatureTourOnNextMount } from '../utils/featureTourState';

// ============================================================================
// PROP TYPES
// ============================================================================

/**
 * Props for the GoogleCallback component.
 *
 * @interface GoogleCallbackProps
 */
interface GoogleCallbackProps {
  /** Callback function called when login completes successfully */
  onLoginComplete: (profile: UserProfile) => void;
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

/**
 * Google OAuth callback handler component.
 *
 * Processes the OAuth callback from Google, extracting the JWT token from URL
 * parameters, decoding user information, and creating a user session.
 *
 * @component GoogleCallback
 * @param {GoogleCallbackProps} props - Component props
 * @returns {JSX.Element} Loading spinner during processing
 *
 * @example
 * ```tsx
 * <GoogleCallback
 *   onLoginComplete={(profile) => {
 *     setUserProfile(profile);
 *     navigate('/home');
 *   }}
 * />
 * ```
 *
 * @remarks
 * - Uses useRef to prevent double execution (concurrency guard)
 * - Parses JWT manually to extract user name from 'unique_name' claim
 * - Falls back to 'name' claim if 'unique_name' is not present
 * - Defaults to Intermediate level and Travel goals for new users
 * - Redirects to login on error, home on success
 */
const GoogleCallback: React.FC<GoogleCallbackProps> = ({ onLoginComplete }) => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Concurrency Guard: Prevent double execution
    const processing = React.useRef(false);

    /**
     * Parses a JWT token manually to extract claims.
     * Handles base64url decoding and JSON parsing.
     *
     * @function parseJwt
     * @param {string} token - JWT token to parse
     * @returns {Object} Decoded JWT claims or empty object on error
     */
    const parseJwt = (token: string) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error("JWT Parse Error", e);
            return {};
        }
    };

    /**
     * Process OAuth callback on mount.
     * Extracts token, decodes user info, creates session, redirects.
     */
    useEffect(() => {
        if (processing.current) return;

        const processCallback = async () => {
            const token = searchParams.get('token');
            const error = searchParams.get('error');

            if (token) {
                processing.current = true;
                localStorage.setItem('auth_token', token);

                // Decode token as a fallback; the backend profile is the source of truth.
                const claims = parseJwt(token);
                console.log("Decoded Claims:", claims);

                // 'unique_name' is the standard mapping for ClaimTypes.Name in JWT
                const realName = claims.unique_name || claims.name || 'Google User';
                const realEmail = claims.email || claims.emailaddress || claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
                console.log("Extracted Name:", realName, "Email:", realEmail);

                let googleUser: UserProfile = {
                    name: realName,
                    email: realEmail,
                    level: EnglishLevel.BEGINNER,
                    goals: [LearningGoal.CONVERSATION],
                    interests: 'General English',
                    nativeLanguage: 'Portuguese' as any
                };

                try {
                    const currentUserResponse = await authService.getCurrentUser();
                    if (currentUserResponse.user) {
                        googleUser = mapApiUserToProfile(currentUserResponse.user);
                    }
                } catch (profileError) {
                    console.warn('Could not load Google user profile after OAuth callback:', profileError);
                }

                if (
                    sessionStorage.getItem(GOOGLE_LOGIN_TOUR_PENDING_KEY) === 'true'
                    && googleUser.hasCompletedOnboarding
                    && googleUser.hasSeenFeatureTour !== true
                ) {
                    requestFeatureTourOnNextMount();
                    sessionStorage.removeItem(GOOGLE_LOGIN_TOUR_PENDING_KEY);
                }

                onLoginComplete(googleUser);
                navigate(googleUser.hasCompletedOnboarding ? '/home' : '/onboarding', { replace: true });
            } else if (error) {
                processing.current = true;
                console.error("Google Auth Error:", error);
                navigate('/login');
            }
        };

        void processCallback();
    }, [searchParams, navigate, onLoginComplete]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-700">{t('googleCallback.authenticating')}</h2>
                <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
        </div>
    );
};

export default GoogleCallback;
