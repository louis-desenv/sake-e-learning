import React, { useRef, useEffect, useState } from 'react';
import { useLiveKitRoom } from '../hooks/useLiveKitRoom';
import { generateLiveKitToken, LIVEKIT_CONFIG } from '../services/livekitTokenService';
import { ConnectionState } from 'livekit-client';
import { useUser } from '../context/UserContext';

import axios from 'axios';

const AudioOnlyChat: React.FC = () => {
  const { user } = useUser();
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
    videoElementKey, // Keep for compatibility but won't use
  } = useLiveKitRoom();

  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle audio tracks from the agent
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
      console.log('Using room name:', roomName);

      const token = await generateLiveKitToken({
        apiKey: LIVEKIT_CONFIG.apiKey,
        apiSecret: LIVEKIT_CONFIG.apiSecret,
        identity: user.name || 'User',
        roomName: roomName,
      });

      console.log('Generated LiveKit token for:', user.name, 'in room:', roomName);
      console.log('Connecting to server:', LIVEKIT_CONFIG.serverUrl);

      await connect(LIVEKIT_CONFIG.serverUrl, token);
      console.log('Successfully connected to room');
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
      return { text: 'Start Audio Session', color: 'bg-orange-600', animate: false };
    }
    if (isAgentSpeaking) {
      return { text: 'Agent Speaking...', color: 'bg-purple-500', animate: true };
    }
    return { text: 'Listening...', color: 'bg-green-500', animate: true };
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const buttonState = getButtonState();

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4">
      {/* Card container scaled for desktop, full-screen feel for mobile */}
      <div className="relative w-full max-w-3xl h-[82vh] bg-black rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {/* Audio-only background - no avatar video */}
        <div className="relative flex-1 w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Audio Conversation</h2>
            <p className="text-lg opacity-80">Agent & Browser - 2 Participants</p>
          </div>

          {/* Soft gradient overlay */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Top-left label and participants (top-right) */}
          <div className="absolute top-4 left-4 bg-black/40 text-white text-xs px-3 py-1 rounded-full backdrop-blur">LiveKit Audio Agent</div>

          <div className="absolute top-4 right-4 flex items-center space-x-2">
            {participants.slice(0, 4).map((p, idx) => (
              <div
                key={idx}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 flex items-center justify-center text-xs font-semibold text-gray-700 shadow-md ${p.isSpeaking ? 'ring-2 ring-emerald-400' : ''
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

          {/* Transcript bubble (bottom center) - refined */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-28 max-w-[86%] md:max-w-[56%] bg-white/8 backdrop-blur border border-white/10 text-white text-sm px-4 py-3 rounded-2xl">
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

          {/* Control bar (centered bottom) - modern icons + labels */}
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

        {/* Bottom small footer for status */}
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

export default AudioOnlyChat;
