import React, { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        BeyondPresence: any;
    }
}

const BeyAvatar = ({ apiKey, avatarId = 'default', textToSpeak = '' }) => {
    const containerRef = useRef(null);
    const beySession = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [currentText, setCurrentText] = useState('');

    // Load SDK dynamically if not available
    useEffect(() => {
        const initAvatar = async () => {
            if (!containerRef.current) return;

            try {
                console.log("Initializing Bey Avatar with key:", apiKey);
                console.log("Using avatarId:", avatarId);
                const session = new window.BeyondPresence({
                    apiKey: apiKey,
                    container: containerRef.current,
                    avatarId: avatarId,
                });

                console.log("Session object:", session);
                await session.initialize();
                await session.start();

                beySession.current = session;
                setIsReady(true);
                console.log("Bey Avatar Visuals Ready");

                // Find the video element created by Bey and MUTE it.
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

        const checkSDK = () => {
            if (window.BeyondPresence) {
                initAvatar();
            } else {
                console.log("BeyondPresence SDK not available after loading");
            }
        };

        if (!window.BeyondPresence) {
            console.log("Loading BeyondPresence SDK...");
            const script = document.createElement('script');
            script.src = 'https://bey.dev/sdk.js';
            script.async = true;
            script.onload = () => {
                console.log("SDK loaded successfully");
                checkSDK();
            };
            script.onerror = () => {
                console.error("Failed to load SDK from bey.dev/sdk.js");
                // Try alternative URL
                const altScript = document.createElement('script');
                altScript.src = 'https://cdn.bey.dev/sdk.js';
                altScript.async = true;
                altScript.onload = () => {
                    console.log("SDK loaded from alternative URL");
                    checkSDK();
                };
                altScript.onerror = () => {
                    console.error("Failed to load SDK from all URLs");
                };
                document.head.appendChild(altScript);
            };
            document.head.appendChild(script);
        } else {
            checkSDK();
        }

        return () => {
            if (beySession.current) {
                beySession.current.stop();
            }
        };
    }, [apiKey, avatarId]);

    useEffect(() => {
        if (textToSpeak && textToSpeak !== currentText && beySession.current && isReady) {
            console.log("Speaking text:", textToSpeak);
            setCurrentText(textToSpeak);
            beySession.current.speak(textToSpeak);
        }
    }, [textToSpeak, currentText, isReady]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
            <div ref={containerRef} className="bey-container" style={{ width: '100%', height: '100%' }} />
            {!isReady && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🤖</div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Loading avatar...</p>
                </div>
            )}
        </div>
    );
};

export default BeyAvatar;
