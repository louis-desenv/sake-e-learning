/**
 * Audio Only Chat Component - ORIGINAL + MELHORIAS
 *
 * Design original com:
 * - Tela preta inicial "Just Speak" (igual VoiceChatUI)
 * - Ondas animadas no background
 * - Toggle Fullscreen / Card mode
 *
 * @version 3.2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { useLiveKitRoom } from '../hooks/useLiveKitRoom';
import { generateLiveKitToken, LIVEKIT_CONFIG } from '../services/livekitTokenService';
import { ConnectionState } from 'livekit-client';
import { useUser } from '../context/UserContext';

// Importações
import { AudioVisualizer } from './audio/AudioVisualizer';

// Ícone de microfone
const MicIcon = () => (
  <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0M12 19v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

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
    videoElementKey,
  } = useLiveKitRoom();

  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Audio level para visualizer (0 quando conectado = sem glow)
  const [audioLevel, setAudioLevel] = useState(0);

  // Audio level: animado na tela inicial, zero quando conectado
  useEffect(() => {
    if (isConnected) {
      setAudioLevel(0); // Sem glow durante chamada
      return;
    }
    // Tela inicial: animar um pouco para ter glow
    const interval = setInterval(() => {
      setAudioLevel(Math.random() * 30 + 10);
    }, 100);
    return () => clearInterval(interval);
  }, [isConnected]);

  /**
   * Handles connection to LiveKit room.
   */
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

  /**
   * Handles disconnection from LiveKit room.
   */
  const handleDisconnect = async () => {
    await disconnect();
  };

  /**
   * Cleanup effect on unmount.
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 p-4">
      {/* Card container */}
      <div className="relative w-full max-w-3xl h-[82vh] bg-black rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {/* Background */}
        <div className="relative flex-1 w-full h-full bg-gradient-to-br from-blue-900 to-purple-900">

          {/* Ondas animadas */}
          <div className="absolute inset-0 opacity-30">
            <AudioVisualizer
              isConnected={isConnected}
              isListening={false}
              isAgentSpeaking={isAgentSpeaking}
              audioLevel={audioLevel}
              theme="blue"
              bars={50}
              speed={0.5}
            />
          </div>

          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* ===== ANTES DE CONECTAR - Tela preta com Just Speak ===== */}
          {!isConnected && (
            <>
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-40 p-8 pt-16 text-center">
                <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-2xl">
                  Just Speak
                </h1>
                <p className="text-white/80 text-lg">
                  Tap below and start speaking...
                </p>
              </div>

              {/* Botão de microfone centralizado (igual VoiceChatUI) */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-24 z-40">
                <div className="flex flex-col items-center space-y-4">
                  {/* Balão com tooltip */}
                  <div className="relative bg-gray-700 rounded-2xl px-6 py-3 shadow-2xl">
                    <p className="text-white text-base font-medium">
                      Tap to start conversation
                    </p>
                    {/* Seta apontando para baixo */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-700" />
                  </div>

                  {/* Botão de microfone */}
                  <button
                    onClick={handleConnect}
                    disabled={isGeneratingToken}
                    className={`
                      w-20 h-20 rounded-full
                      flex items-center justify-center
                      shadow-2xl text-white
                      transition-all duration-200
                      ${isGeneratingToken
                        ? 'bg-gray-700 opacity-60 cursor-not-allowed'
                        : 'bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 hover:scale-105'
                      }
                    `}
                  >
                    {isGeneratingToken ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MicIcon />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ===== DEPOIS DE CONECTAR - Interface original ===== */}
          {isConnected && (
            <>
              {/* Top-left label */}
              <div className="absolute top-4 left-4 bg-black/40 text-white text-xs px-3 py-1 rounded-full backdrop-blur z-10">
                LiveKit Audio Agent
              </div>

              {/* Participants (top-right) */}
              <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
                {participants.slice(0, 4).map((p, idx) => (
                  <div
                    key={idx}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 flex items-center justify-center text-xs font-semibold text-gray-700 shadow-md ${p.isSpeaking ? 'ring-2 ring-emerald-400' : ''}`}
                    title={p.identity || 'Participant'}
                  >
                    {(p.identity && p.identity.length > 0 ? p.identity.charAt(0).toUpperCase() : '?')}
                  </div>
                ))}
                {participants.length > 4 && (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/40 flex items-center justify-center text-xs text-white">
                    +{participants.length - 4}
                  </div>
                )}
              </div>

              {/* Transcript bubble */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-28 max-w-[86%] md:max-w-[56%] bg-white/8 backdrop-blur border border-white/10 text-white text-sm px-4 py-3 rounded-2xl z-10">
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
              <div className="absolute left-1/2 -translate-x-1/2 bottom-6 w-[92%] md:w-2/3 bg-white/6 backdrop-blur border border-white/8 rounded-full px-4 py-3 flex items-center justify-between shadow-2xl z-20">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={toggleMicrophone}
                    className="flex flex-col items-center justify-center text-white hover:text-white/90 focus:outline-none"
                    title="Toggle Microphone"
                  >
                    <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0M12 19v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
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
                    onClick={handleDisconnect}
                    className="flex items-center space-x-2 px-4 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L10 8.586 7.707 6.293a1 1 0 10-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 001.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">End Call</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom footer */}
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
