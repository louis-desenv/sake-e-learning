import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { UserProfile } from '../types';
import { EnglishLevel, LearningGoal } from '../types';

interface GoogleCallbackProps {
    onLoginComplete: (profile: UserProfile) => void;
}

const GoogleCallback: React.FC<GoogleCallbackProps> = ({ onLoginComplete }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Concurrency Guard: Prevent double execution
    const processing = React.useRef(false);

    // Helper to decode JWT manually
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

    useEffect(() => {
        if (processing.current) return;

        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (token) {
            processing.current = true;
            localStorage.setItem('auth_token', token);

            // Decode token to get real user name
            const claims = parseJwt(token);
            console.log("Decoded Claims:", claims);

            // 'unique_name' is the standard mapping for ClaimTypes.Name in JWT
            const realName = claims.unique_name || claims.name || 'Google User';
            console.log("Extracted Name:", realName);

            const googleUser: UserProfile = {
                name: realName,
                level: EnglishLevel.INTERMEDIATE,
                goals: [LearningGoal.TRAVEL],
                interests: 'Travel',
                nativeLanguage: 'Portuguese' as any
            };

            onLoginComplete(googleUser);
            navigate('/home');
        } else if (error) {
            processing.current = true;
            console.error("Google Auth Error:", error);
            navigate('/'); // Back to login
        }
    }, [searchParams, navigate, onLoginComplete]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-700">Authenticating...</h2>
                <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
        </div>
    );
};

export default GoogleCallback;
