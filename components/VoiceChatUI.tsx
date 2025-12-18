import React, { useRef, useEffect, useState } from 'react';
import { useLiveKitRoom } from '../hooks/useLiveKitRoom';
import { generateLiveKitToken, LIVEKIT_CONFIG } from '../services/livekitTokenService';
import { ConnectionState } from 'livekit-client';
import { useUser } from '../context/UserContext';

import axios from 'axios';

const VoiceChatUI: React.FC = () => {
  const user = useUser();
  const {
    isConnected,
    connectionState,
    error,
    agentTranscript,
    userTranscript,
    isAgentSpeaking,
    participants,
    connect,
    disconnect,
    toggleMicrophone,
    startLocalPreview,
    stopLocalPreview,
    isPreviewActive,
    videoElementKey,
  } = useLiveKitRoom();

  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const [avatarVideoUrl, setAvatarVideoUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Camera state
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Open camera - fixed version
  const openCamera = async () => {
    setCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      streamRef.current = stream;
      
      // Wait for video element to be ready
      const videoEl = localVideoRef.current;
      if (videoEl) {
        videoEl.srcObject = stream;
        
        // Make sure video plays
        videoEl.onloadedmetadata = () => {
          videoEl.play().catch(e => console.log('Play error:', e));
        };
      }
      
      setCameraOn(true);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Could not access camera. Please allow camera permission.');
    } finally {
      setCameraLoading(false);
    }
  };

  // Close camera
  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setCameraOn(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      disconnect();
    };
  }, [disconnect]);

  useEffect(() => {
    if (isConnected && audioRef.current) {
      console.log('Connected to room, audio should be handled by LiveKit');
    }
  }, [isConnected]);

  const handleConnect = async () => {
    setIsGeneratingToken(true);
    setTokenError(null);

    try {
      const roomName = LIVEKIT_CONFIG.roomName;
      const token = await generateLiveKitToken({
        apiKey: LIVEKIT_CONFIG.apiKey,
        apiSecret: LIVEKIT_CONFIG.apiSecret,
        identity: user.name || 'User',
        roomName: roomName,
      });
      await connect(LIVEKIT_CONFIG.serverUrl, token);
    } catch (e) {
      console.error('Failed to generate token or connect:', e);
      setTokenError(e instanceof Error ? e.message : 'Failed to generate token');
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const getButtonState = () => {
    if (isGeneratingToken) {
      return { text: 'Generating Token...', color: 'bg-yellow-500', animate: true };
    }
    if (connectionState === ConnectionState.Connecting) {
      return { text: 'Connecting...', color: 'bg-yellow-500', animate: true };
    }
    if (!isConnected) {
      return { text: 'Start Voice Session', color: 'bg-orange-600', animate: false };
    }
    if (isAgentSpeaking) {
      return { text: 'Agent Speaking...', color: 'bg-purple-500', animate: true };
    }
    return { text: 'Listening...', color: 'bg-green-500', animate: true };
  };

  const buttonState = getButtonState();

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4">
      <div className="relative w-full max-w-3xl h-[82vh] bg-black rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="relative flex-1 w-full h-full bg-black">
          <video
            id="bey-avatar-video"
            key={videoElementKey}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectFit: 'cover' }}
          />

          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute top-4 left-4 bg-black/40 text-white text-xs px-3 py-1 rounded-full backdrop-blur">LiveKit Audio Agent</div>

          <div className="absolute top-4 right-4 flex items-center space-x-2">
            {participants.slice(0, 4).map((p, idx) => (
              <div
                key={idx}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 flex items-center justify-center text-xs font-semibold text-gray-700 shadow-md ${
                  p.isSpeaking ? 'ring-2 ring-emerald-400' : ''
                }`}
                title={p.identity || 'Participant'}
              >
                {(p.identity && p.identity.length > 0 ? p.identity.charAt(0).toUpperCase() : '?')}
              </div>
            ))}
            {participants.length > 4 && (
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/40 flex items-center justify-center text-xs text-white">+{participants.length - 4}</div>
            )}
          </div>

          {/* LOCAL CAMERA PREVIEW - Bigger like Google Meet */}
          <div className="absolute bottom-32 right-4 w-36 h-28 md:w-48 md:h-36 bg-gray-900 rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/20">
            {/* Video element - always present */}
            <video
              ref={localVideoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
              style={{ 
                display: cameraOn ? 'block' : 'none',
                transform: 'scaleX(-1)' // Mirror effect like in video calls
              }}
            />
            
            {/* Placeholder when camera is off */}
            {!cameraOn && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-600 flex items-center justify-center mb-2">
                  <span className="text-white text-xl md:text-2xl font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <span className="text-gray-400 text-xs">Camera off</span>
              </div>
            )}

            {/* Loading indicator */}
            {cameraLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Green dot when camera is on */}
            {cameraOn && (
              <div className="absolute top-2 left-2 bg-green-500 w-3 h-3 rounded-full border-2 border-white shadow"></div>
            )}

            {/* Name label */}
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {user.name || 'You'}
            </div>
          </div>

          {/* OPEN/CLOSE CAMERA BUTTON */}
          <div className="absolute bottom-32 right-44 md:right-56">
            {!cameraOn ? (
              <button
                onClick={openCamera}
                disabled={cameraLoading}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg transition flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>{cameraLoading ? 'Opening...' : 'Open Camera'}</span>
              </button>
            ) : (
              <button
                onClick={closeCamera}
                className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg transition flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span>Close Camera</span>
              </button>
            )}
          </div>

          {/* Transcript bubble */}
          <div className="absolute left-4 bottom-28 max-w-[50%] bg-white/10 backdrop-blur border border-white/10 text-white text-sm px-4 py-3 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/90 truncate">
                <strong className="text-white">Agent:</strong> {agentTranscript || '...'}
              </div>
              <div className="text-xs text-white/80 ml-3">{isAgentSpeaking ? 'Speaking' : ''}</div>
            </div>
            <div className="text-xs text-white/70 mt-2 truncate">
              <strong className="text-white">You:</strong> {userTranscript || '...'}
            </div>
          </div>

          {/* Control bar */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-6 w-[92%] md:w-2/3 bg-white/6 backdrop-blur border border-white/8 rounded-full px-4 py-3 flex items-center justify-between shadow-2xl">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMicrophone}
                className="flex flex-col items-center justify-center text-white hover:text-white/90 focus:outline-none"
                title="Toggle Microphone"
              >
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v11m0 0l3-3m-3 3l-3-3" />
                  </svg>
                </div>
                <span className="text-[11px] mt-1 text-white/80">Mic</span>
              </button>

              <div className="hidden md:flex flex-col items-start ml-2">
                <div className="text-xs font-semibold text-white">{user.name || 'You'}</div>
                <div className="text-[11px] text-white/70">{isConnected ? 'In Call' : 'Idle'}</div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={isConnected ? handleDisconnect : handleConnect}
                disabled={isGeneratingToken || connectionState === ConnectionState.Connecting}
                className={`flex items-center space-x-2 px-4 py-3 rounded-full text-white font-medium transition ${isConnected ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-500 hover:bg-emerald-600'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  {isConnected ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L10 8.586 7.707 6.293a1 1 0 10-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 001.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293z" clipRule="evenodd" />
                  ) : (
                    <path d="M2.003 5.884l8-3a1 1 0 01.994 0l8 3A1 1 0 0119 6.764v6.472a1 1 0 01-.676.948l-8 3a1 1 0 01-.648 0l-8-3A1 1 0 011 13.236V6.764a1 1 0 011.003-.88z" />
                  )}
                </svg>
                <span className="text-sm">{isConnected ? 'End Call' : 'Start Call'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-14 bg-black/60 text-white flex items-center justify-between px-4">
          <div className="text-sm">{isConnected ? `Connected — ${participants.length} participants` : 'Not connected'}</div>
          <div className="flex items-center space-x-3">
            <div className="text-xs opacity-80">{connectionState}</div>
            <div className="text-xs opacity-90">Audio Only</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceChatUI;