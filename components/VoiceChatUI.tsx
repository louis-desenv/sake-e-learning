import React, { useRef, useEffect, useState } from 'react';
import { useLiveKitRoom } from '../hooks/useLiveKitRoom';
import { generateLiveKitToken, LIVEKIT_CONFIG } from '../services/livekitTokenService';
import { useUser } from '../context/UserContext';

/* ================= FREE SVG ICONS ================= */

const CameraIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CameraOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
  </svg>
);

const MicIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0M12 19v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const ChatIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.24 1.01l-2.21 2.2z" />
  </svg>
);

const HangUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 010-1.36C3.46 8.61 7.53 7 12 7s8.54 1.61 11.71 4.72c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28a11.27 11.27 0 00-2.66-1.85.996.996 0 01-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
  </svg>
);

/* ================= FANCY CONNECTING SPINNER ================= */

const ConnectingSpinner = () => (
  <div className="flex flex-col items-center justify-center space-y-6">
    
    {/* Multi-ring spinner */}
    <div className="relative w-32 h-32">
      
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-2xl animate-pulse" />
      
      {/* Ring 1 - outer (slow) */}
      <div 
        className="absolute inset-0 rounded-full border-4 border-purple-500/20"
        style={{
          borderTopColor: '#a855f7',
          borderRightColor: '#7c3aed',
          animation: 'spin 3s linear infinite',
        }}
      />
      
      {/* Ring 2 - middle (medium, reverse) */}
      <div 
        className="absolute inset-4 rounded-full border-4 border-purple-500/20"
        style={{
          borderTopColor: '#c084fc',
          borderLeftColor: '#8b5cf6',
          animation: 'spin 2s linear infinite reverse',
        }}
      />
      
      {/* Ring 3 - inner (fast) */}
      <div 
        className="absolute inset-8 rounded-full border-4 border-purple-500/20"
        style={{
          borderTopColor: '#e9d5ff',
          borderBottomColor: '#a855f7',
          animation: 'spin 1s linear infinite',
        }}
      />
      
      {/* Center icon with pulse */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 w-10 h-10 rounded-full bg-purple-500 animate-ping opacity-40" />
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>
      
    </div>
    
    {/* Status text with animated dots */}
    <div className="text-center">
      <p className="text-white text-xl font-medium tracking-wide flex items-center justify-center">
        Preparing your session
        <span className="flex ml-1 space-x-1">
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      </p>
      <p className="text-white/50 text-sm mt-3">
        Loading avatar, please wait...
      </p>
    </div>
    
    {/* Progress bar (fake, for visual feedback) */}
    <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-purple-500 to-purple-300 rounded-full"
        style={{
          animation: 'progress 2s ease-in-out infinite',
        }}
      />
    </div>
    
  </div>
);

/* ================= MAIN COMPONENT ================= */

const VoiceChatUI: React.FC = () => {
  const user = useUser();

  const {
    isConnected,
    agentTranscript,
    userTranscript,
    participants,
    connect,
    disconnect,
    toggleMicrophone,
    videoElementKey,
  } = useLiveKitRoom();

  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [micOn, setMicOn] = useState(true);

  // ✅ NEW: Avatar ready state
  const [avatarReady, setAvatarReady] = useState(false);

  // Local camera preview
  const [cameraOn, setCameraOn] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ✅ Derived state: Show spinner when connected but avatar not ready
  const showSpinner = isConnected && !avatarReady;

  // ✅ Derived state: Call is fully ready (connected + avatar loaded)
  const isCallReady = isConnected && avatarReady;

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      alert('Camera permission denied');
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const handleToggleMic = () => {
    toggleMicrophone();
    setMicOn(!micOn);
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      disconnect();
    };
  }, [disconnect]);

  const handleConnect = async () => {
    setIsGeneratingToken(true);
    setAvatarReady(false); // Reset avatar state
    try {
      const token = await generateLiveKitToken({
        apiKey: LIVEKIT_CONFIG.apiKey,
        apiSecret: LIVEKIT_CONFIG.apiSecret,
        identity: user.name || 'User',
        roomName: LIVEKIT_CONFIG.roomName,
      });
      await connect(LIVEKIT_CONFIG.serverUrl, token);
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setAvatarReady(false);
  };

  // ✅ Handler for avatar video ready
  const handleAvatarReady = () => {
    // Small delay for smoother transition
    setTimeout(() => {
      setAvatarReady(true);
    }, 300);
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">

      {/* ✅ LIVEKIT AVATAR VIDEO — DO NOT CHANGE ID */}
      <video
        id="bey-avatar-video"
        key={videoElementKey}
        autoPlay
        playsInline
        muted
        onCanPlay={handleAvatarReady}
        onPlaying={handleAvatarReady}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Soft vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none" />

      {/* ================= FANCY SPINNER OVERLAY ================= */}
      {showSpinner && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <ConnectingSpinner />
        </div>
      )}

      {/* Participants (only show when call ready) */}
      {isCallReady && (
        <div className="absolute top-4 right-4 flex space-x-2 z-30 animate-fade-in">
          {participants.slice(0, 4).map((p, i) => (
            <div
              key={i}
              className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-xs font-bold"
            >
              {p.identity?.[0]?.toUpperCase() || '?'}
            </div>
          ))}
        </div>
      )}

      {/* Self preview (only show when call ready) */}
      {isCallReady && (
        <div className="absolute bottom-40 left-6 w-32 h-40 rounded-xl overflow-hidden bg-gray-900 shadow-xl z-30 animate-fade-in">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{
              display: cameraOn ? 'block' : 'none',
              transform: 'scaleX(-1)',
            }}
          />
          {!cameraOn && (
            <div className="w-full h-full flex flex-col items-center justify-center text-white text-sm">
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mb-2 text-lg font-bold">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-gray-400 text-xs">Camera off</span>
            </div>
          )}
        </div>
      )}

      {/* Transcript (only show when call ready) */}
      {isCallReady && (agentTranscript || userTranscript) && (
        <div className="absolute bottom-40 right-6 max-w-sm bg-black/50 backdrop-blur text-white text-sm px-4 py-3 rounded-xl z-30 animate-fade-in">
          <div><strong>Agent:</strong> {agentTranscript || '...'}</div>
          <div className="opacity-70 mt-1"><strong>You:</strong> {userTranscript || '...'}</div>
        </div>
      )}

      {/* ================= CONTROLS ================= */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-24 flex items-center space-x-4 z-40">

        {/* BEFORE CONNECT → START CALL BUTTON */}
        {!isConnected && (
          <button
            onClick={handleConnect}
            disabled={isGeneratingToken}
            className={`
              w-16 h-16 rounded-full 
              flex items-center justify-center 
              shadow-xl text-white 
              transition-all duration-200
              ${isGeneratingToken 
                ? 'bg-purple-900 opacity-60 cursor-not-allowed' 
                : 'bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 hover:scale-105'
              }
            `}
          >
            {isGeneratingToken ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <PhoneIcon className="w-7 h-7" />
            )}
          </button>
        )}

        {/* AFTER CALL READY → FULL CONTROLS */}
        {isCallReady && (
          <div className="flex items-center space-x-4 animate-fade-in">
            
            {/* Camera */}
            <button
              onClick={cameraOn ? closeCamera : openCamera}
              className={`
                w-14 h-14 rounded-full 
                flex items-center justify-center 
                shadow-lg text-white 
                transition-all duration-200 
                hover:scale-105
                ${cameraOn ? 'bg-purple-600' : 'bg-purple-800'}
              `}
            >
              {cameraOn ? (
                <CameraIcon className="w-6 h-6" />
              ) : (
                <CameraOffIcon className="w-6 h-6" />
              )}
            </button>

            {/* Mic */}
            <button
              onClick={handleToggleMic}
              className={`
                w-14 h-14 rounded-full 
                flex items-center justify-center 
                shadow-lg text-white 
                transition-all duration-200 
                hover:scale-105
                ${micOn ? 'bg-purple-600' : 'bg-purple-800'}
              `}
            >
              <MicIcon className="w-6 h-6" />
            </button>

            {/* Chat */}
            <button
              className="
                w-14 h-14 rounded-full 
                bg-purple-700 
                flex items-center justify-center 
                shadow-lg text-white 
                transition-all duration-200 
                hover:scale-105
              "
            >
              <ChatIcon className="w-6 h-6" />
            </button>

            {/* Hang Up */}
            <button
              onClick={handleDisconnect}
              className="
                w-16 h-16 rounded-full 
                bg-gradient-to-br from-red-500 to-red-600
                flex items-center justify-center 
                shadow-xl text-white 
                transition-all duration-200 
                hover:from-red-400 hover:to-red-500
                hover:scale-105
              "
            >
              <HangUpIcon className="w-7 h-7" />
            </button>

          </div>
        )}

      </div>

      {/* ================= STYLES ================= */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes progress {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>

    </div>
  );
};

export default VoiceChatUI;