/**
 * Beyond Presence Avatar Component
 *
 * React component for integrating the Beyond Presence AI avatar system.
 * Dynamically loads the Beyond Presence SDK and manages avatar lifecycle.
 *
 * @fileoverview This component handles the initialization and management of
 * Beyond Presence AI avatars, including dynamic SDK loading, avatar session
 * management, text-to-speech functionality, and video element control.
 *
 * @dependencies react
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// ============================================================================
// GLOBAL TYPE DECLARATIONS
// ============================================================================

/**
 * Extend Window interface to include Beyond Presence SDK.
 * The SDK is loaded dynamically from an external CDN.
 *
 * @interface Window
 * @property {any} BeyondPresence - The Beyond Presence SDK constructor
 */
declare global {
    interface Window {
        BeyondPresence: any;
    }
}

// ============================================================================
// PROP TYPES
// ============================================================================

/**
 * Props for the BeyAvatar component.
 *
 * @interface BeyAvatarProps
 */
interface BeyAvatarProps {
  /** Beyond Presence API key for authentication */
  apiKey: string;
  /** Avatar ID to load from the Beyond Presence service (default: 'default') */
  avatarId?: string;
  /** Text content for the avatar to speak via TTS */
  textToSpeak?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Beyond Presence AI avatar component.
 *
 * Dynamically loads the Beyond Presence SDK, initializes an avatar session,
 * manages the avatar lifecycle, and provides text-to-speech functionality.
 * The avatar video is automatically muted to prevent audio conflicts.
 *
 * @component BeyAvatar
 * @param {BeyAvatarProps} props - Component props
 * @returns {JSX.Element} Avatar container with Beyond Presence integration
 *
 * @example
 * ```tsx
 * <BeyAvatar
 *   apiKey="your-api-key"
 *   avatarId="avatar-123"
 *   textToSpeak="Hello, how are you?"
 * />
 * ```
 *
 * @remarks
 * - SDK is loaded dynamically from bey.dev/sdk.js with fallback to CDN
 * - Video element is automatically muted to prevent double audio playback
 * - Avatar session is cleaned up on component unmount
 * - speak() method is called when textToSpeak prop changes
 * - Shows loading indicator while SDK initializes
 */
const BeyAvatar = ({ apiKey, avatarId = 'default', textToSpeak = '' }: BeyAvatarProps) => {
    const { t } = useTranslation();
    /** Reference to the avatar container DOM element */
    const containerRef = useRef<HTMLDivElement>(null);

    /** Reference to the active Beyond Presence session instance */
    const beySession = useRef<any>(null);

    /** Whether the avatar SDK has been initialized and is ready */
    const [isReady, setIsReady] = useState(false);

    /** Current text being spoken to prevent duplicate speak calls */
    const [currentText, setCurrentText] = useState('');

    /**
     * Initializes the Beyond Presence avatar session.
     * Creates session, initializes SDK, starts avatar, and mutes video element.
     *
     * @async
     * @function initAvatar
     * @throws Will log error if SDK fails to initialize or avatar fails to load
     */
    const initAvatar = async () => {
        if (!containerRef.current) return;

        try {
            console.log("Initializing Bey Avatar with key:", apiKey);
            console.log("Using avatarId:", avatarId);

            // Create Beyond Presence session with provided configuration
            const session = new window.BeyondPresence({
                apiKey: apiKey,
                container: containerRef.current,
                avatarId: avatarId,
            });

            console.log("Session object:", session);

            // Initialize and start the avatar session
            await session.initialize();
            await session.start();

            beySession.current = session;
            setIsReady(true);
            console.log("Bey Avatar Visuals Ready");

            // Find the video element created by Beyond Presence and MUTE it
            // This prevents audio conflicts since audio is handled separately
            const videoEl = containerRef.current.querySelector('video');
            if (videoEl) {
                videoEl.muted = true;
                videoEl.volume = 0;
                console.log("Video element muted successfully");
            } else {
                console.log("No video element found to mute");
            }
        } catch (err) {
            console.error("Error loading avatar:", err);
            console.error("Full error:", err);
        }
    };

    /**
     * Checks if Beyond Presence SDK is available and initializes avatar.
     * Handles both pre-loaded and dynamically-loaded SDK scenarios.
     *
     * @function checkSDK
     */
    const checkSDK = () => {
        if (window.BeyondPresence) {
            initAvatar();
        } else {
            console.log("BeyondPresence SDK not available after loading");
        }
    };

    /**
     * Effect: Load Beyond Presence SDK dynamically.
     * SDK is not bundled - loaded from CDN to reduce bundle size.
     * Attempts primary URL, falls back to alternative CDN on failure.
     *
     * @remarks
     * - Uses script injection to load SDK asynchronously
     * - Primary URL: https://bey.dev/sdk.js
     * - Fallback URL: https://cdn.bey.dev/sdk.js
     * - Cleans up by stopping session on unmount
     */
    useEffect(() => {
        // If SDK is already loaded, initialize immediately
        if (!window.BeyondPresence) {
            console.log("Loading BeyondPresence SDK...");

            // Create and inject script element for primary SDK URL
            const script = document.createElement('script');
            script.src = 'https://bey.dev/sdk.js';
            script.async = true;

            // Handle successful SDK load
            script.onload = () => {
                console.log("SDK loaded successfully");
                checkSDK();
            };

            // Handle primary URL load failure - try fallback CDN
            script.onerror = () => {
                console.error("Failed to load SDK from bey.dev/sdk.js");

                // Try alternative CDN URL
                const altScript = document.createElement('script');
                altScript.src = 'https://cdn.bey.dev/sdk.js';
                altScript.async = true;

                altScript.onload = () => {
                    console.log("SDK loaded from alternative URL");
                    checkSDK();
                };

                // Both URLs failed
                altScript.onerror = () => {
                    console.error("Failed to load SDK from all URLs");
                };

                document.head.appendChild(altScript);
            };

            document.head.appendChild(script);
        } else {
            // SDK already available in global scope
            checkSDK();
        }

        /**
         * Cleanup function: Stop avatar session on unmount.
         * Prevents memory leaks and stops ongoing TTS playback.
         */
        return () => {
            if (beySession.current) {
                beySession.current.stop();
            }
        };
    }, [apiKey, avatarId]);

    /**
     * Effect: Speak text when textToSpeak prop changes.
     * Triggers avatar TTS only when text is different and avatar is ready.
     *
     * @remarks
     * - Compares new text with currentText to prevent duplicate speak calls
     * - Only triggers when isReady is true (avatar fully loaded)
     * - Updates currentText after initiating speech to prevent re-triggers
     */
    useEffect(() => {
        if (textToSpeak && textToSpeak !== currentText && beySession.current && isReady) {
            console.log("Speaking text:", textToSpeak);
            setCurrentText(textToSpeak);
            beySession.current.speak(textToSpeak);
        }
    }, [textToSpeak, currentText, isReady]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
            {/* Container where Beyond Presence will render the avatar video */}
            <div ref={containerRef} className="bey-container" style={{ width: '100%', height: '100%' }} />

            {/* Loading state indicator while SDK initializes */}
            {!isReady && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🤖</div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{t('common.loadingAvatar')}</p>
                </div>
            )}
        </div>
    );
};

export default BeyAvatar;
