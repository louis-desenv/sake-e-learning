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
    videoElementKey, // 🔴 NEW: Get the video key from the hook
  } = useLiveKitRoom();

  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const [avatarVideoUrl, setAvatarVideoUrl] = useState<string | null>(null);
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
      return { text: 'Start Voice Session', color: 'bg-orange-600', animate: false };
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
    <div className="flex flex-col items-center justify-center p-4 h-full">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 space-y-4">
        {/* TOP AREA: now shows avatar video when connected */}
        <div className="h-80 relative">
          {isConnected ? (
            <div className="w-full h-full rounded-lg bg-black flex items-center justify-center overflow-hidden">
              {/* 🔴 UPDATED: Added key prop to force re-render on reconnection */}
              <video
                id="bey-avatar-video"
                key={videoElementKey} // This forces React to create a new element on each connection
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{
                  // 🔴 NEW: Additional styles to ensure proper rendering
                  objectFit: 'cover',
                  backgroundColor: '#000',
                }}
                // 🔴 NEW: Add error handling
                onError={(e) => {
                  console.error('Video element error:', e);
                }}
                onLoadStart={() => {
                  console.log('Video load started');
                }}
                onLoadedData={() => {
                  console.log('Video data loaded');
                }}
                onPlay={() => {
                  console.log('Video started playing');
                }}
              />
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-xs text-white rounded">
                Connected to LiveKit Agent + Avatar
                {/* 🔴 NEW: Show video key for debugging */}
                <span className="ml-1 opacity-50">(v{videoElementKey})</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-full rounded-lg bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🔊</div>
                <p className="text-sm text-gray-600">Ready to connect</p>
                {/* 🔴 NEW: Show when video element will refresh */}
                <p className="text-xs text-gray-400 mt-1">Video ready (v{videoElementKey})</p>
              </div>
            </div>
          )}
        </div>

        <div className="text-center h-20 p-2 border-t border-b border-gray-200 flex flex-col justify-center">
          <p className="text-lg text-gray-500 font-medium">
            <span className="font-bold text-gray-800">You: </span>
            {userTranscript || <span className="italic">...</span>}
          </p>
          <p className="text-lg text-blue-600 font-medium">
            <span className="font-bold">Agent: </span>
            {agentTranscript || <span className="italic">...</span>}
          </p>
        </div>

        {(error || tokenError) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-center text-sm">{error || tokenError}</p>
          </div>
        )}

        <button
          onClick={isConnected ? handleDisconnect : handleConnect}
          disabled={isGeneratingToken || connectionState === ConnectionState.Connecting}
          className={`w-full py-4 px-6 text-white font-bold rounded-xl text-lg transition-all duration-300 transform hover:scale-105 ${buttonState.color} ${
            isConnected ? 'shadow-lg' : 'shadow-md'
          } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
        >
          <div className="flex items-center justify-center space-x-3">
            {buttonState.animate && <span className="animate-pulse">●</span>}
            <span>{isConnected ? 'Disconnect' : buttonState.text}</span>
          </div>
        </button>
        <p className="text-xs text-center text-gray-400 mt-2">
          Connects to LiveKit room with GPT agent from agent.js.
        </p>

        {/* Participants List */}
        {isConnected && participants.length > 0 && (
          <details className="mt-4">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Room Participants ({participants.length})
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <ul className="space-y-1">
                {participants.map((p, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.isSpeaking ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    ></span>
                    <span>{p.identity || 'Unknown'}</span>
                    {p === participants.find((part) => part.isLocal) && (
                      <span className="text-gray-400">(you)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        )}

        {/* 🔴 NEW: Debug info (remove this in production) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="text-xs text-gray-400 cursor-pointer">Debug Info</summary>
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
              <p>Video Element Key: {videoElementKey}</p>
              <p>Connection State: {connectionState}</p>
              <p>Is Connected: {isConnected.toString()}</p>
              <p>Is Agent Speaking: {isAgentSpeaking.toString()}</p>
              <p>Participants Count: {participants.length}</p>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default VoiceChatUI;