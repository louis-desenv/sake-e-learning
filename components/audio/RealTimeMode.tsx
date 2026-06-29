import React, { useState, useEffect, useRef } from 'react';
import { useLiveKitRoom } from '../../hooks/useLiveKitRoom';
import { generateLiveKitToken, LIVEKIT_CONFIG } from '../../services/livekitTokenService';
import { useUser } from '../../context/UserContext';
import { AudioVisualizer } from './AudioVisualizer';
import { ConnectionState } from 'livekit-client';
import { conversationService } from '../../services/conversationService';
import { useTranslation } from 'react-i18next';

/* ================= ICONS ================= */

const MicIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0M12 19v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const HangUpIcon = () => (
  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.956.956 0 010-1.36C3.46 8.61 7.53 7 12 7s8.54 1.61 11.71 4.72c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28a11.27 11.27 0 00-2.66-1.85.996.996 0 01-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
  </svg>
);

/* ================= CONNECTING SPINNER ================= */

const ConnectingSpinner = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
    {/* Multi-ring spinner */}
    <div className="relative w-32 h-32">
      {/* Glow */}
      <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-2xl animate-pulse" />

      {/* Ring 1 */}
      <div
        className="absolute inset-0 rounded-full border-4 border-purple-500/20"
        style={{
          borderTopColor: '#a855f7',
          borderRightColor: '#7c3aed',
          animation: 'spin 3s linear infinite',
        }}
      />

      {/* Ring 2 */}
      <div
        className="absolute inset-4 rounded-full border-4 border-purple-500/20"
        style={{
          borderTopColor: '#c084fc',
          borderLeftColor: '#8b5cf6',
          animation: 'spin 2s linear infinite reverse',
        }}
      />

      {/* Ring 3 */}
      <div
        className="absolute inset-8 rounded-full border-4 border-purple-500/20"
        style={{
          borderTopColor: '#e9d5ff',
          borderBottomColor: '#a855f7',
          animation: 'spin 1s linear infinite',
        }}
      />

      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 w-10 h-10 rounded-full bg-purple-500 animate-ping opacity-40" />
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white">
            <MicIcon />
          </div>
        </div>
      </div>
    </div>

    {/* Status text */}
    <div className="text-center">
      <p className="text-white text-xl font-medium tracking-wide flex items-center justify-center">
        {t('audio.connectingToAI')}
        <span className="flex ml-1 space-x-1">
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>
      </p>
      <p className="text-white/50 text-sm mt-3">{t('audio.preparingSession')}</p>
    </div>

    {/* Progress bar */}
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
};

/* ================= MAIN COMPONENT ================= */

interface RealTimeModeProps {
  onToggleSettings: () => void;
  scenario?: {
    id: string;
    slug: string;
    title: string;
  };
}

export const RealTimeMode: React.FC<RealTimeModeProps> = ({ onToggleSettings, scenario }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const {
    isConnected,
    agentTranscript,
    userTranscript,
    participants,
    connect,
    disconnect,
    toggleMicrophone,
  } = useLiveKitRoom();

  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [avatarReady, setAvatarReady] = useState(false);
  
  // Timing logs
  const connectionStartTime = useRef<number | null>(null);

  // Conversation tracking
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const conversationStartTime = useRef<Date | null>(null);
  const lastSavedUserTranscript = useRef<string>('');
  const lastSavedAgentTranscript = useRef<string>('');
  const hasUserSpoken = useRef(false);

  // Simulate audio level (in real implementation, use Web Audio API)
  useEffect(() => {
    if (!isConnected || !micOn) {
      setAudioLevel(0);
      return;
    }

    const interval = setInterval(() => {
      // Simulated audio level - replace with real AudioContext
      setAudioLevel(Math.random() * (isConnected ? 60 : 0));
    }, 100);

    return () => clearInterval(interval);
  }, [isConnected, micOn]);

  // Save messages to Supabase when transcripts change - also creates conversation on first user message
  useEffect(() => {
    // Create conversation on first user message
    if (userTranscript && !currentConversationId && !hasUserSpoken.current) {
      hasUserSpoken.current = true;
      const createConv = async () => {
        const userId = user?.name || 'guest';
        const scenarioName = scenario?.slug || 'real-life';
        const conversation = await conversationService.createConversation(userId, scenarioName);
        if (conversation) {
          setCurrentConversationId(conversation.id);
          conversationStartTime.current = new Date();
          console.log('[DEBUG] Conversation created on first user message:', conversation.id, 'scenario:', scenarioName);
          
          // Save agent welcome message if exists
          if (agentTranscript) {
            await conversationService.addMessage(conversation.id, 'assistant', agentTranscript, 'welcome');
            lastSavedAgentTranscript.current = agentTranscript;
            console.log('[DEBUG] Agent welcome message saved');
          }
        }
      };
      createConv();
      return;
    }

    if (!currentConversationId) return;

    // Save user message
    if (userTranscript && userTranscript !== lastSavedUserTranscript.current) {
      lastSavedUserTranscript.current = userTranscript;
      conversationService.addMessage(currentConversationId, 'user', userTranscript)
        .then(() => console.log('[DEBUG] User message saved'))
        .catch(err => console.error('[DEBUG] Error saving user message:', err));
    }

    // Save agent message
    if (agentTranscript && agentTranscript !== lastSavedAgentTranscript.current) {
      lastSavedAgentTranscript.current = agentTranscript;
      conversationService.addMessage(currentConversationId, 'assistant', agentTranscript)
        .then(() => console.log('[DEBUG] Agent message saved'))
        .catch(err => console.error('[DEBUG] Error saving agent message:', err));
    }
  }, [userTranscript, agentTranscript, currentConversationId]);

  const handleAvatarReady = () => {
    if (avatarReady) return;
    const elapsed = connectionStartTime.current ? Date.now() - connectionStartTime.current : 0;
    console.log('[Avatar] ✅ Avatar video ready! Total time:', elapsed, 'ms');
    setTimeout(() => {
      setAvatarReady(true);
    }, 300);
  };

  const handleConnect = async () => {
    setIsGeneratingToken(true);
    setAvatarReady(false);
    connectionStartTime.current = Date.now();
    console.log('[Avatar] ⏱️ Starting connection...');
    try {
      console.log('[Avatar] Generating token for room:', LIVEKIT_CONFIG.roomName);
      const token = await generateLiveKitToken({
        apiKey: LIVEKIT_CONFIG.apiKey,
        apiSecret: LIVEKIT_CONFIG.apiSecret,
        identity: user.name || 'User',
        roomName: LIVEKIT_CONFIG.roomName,
      });
      console.log('[Avatar] ✅ Token generated in', Date.now() - connectionStartTime.current, 'ms');
      
      await connect(LIVEKIT_CONFIG.serverUrl, token);
      console.log('[Avatar] ✅ Connected to LiveKit in', Date.now() - connectionStartTime.current, 'ms');
    } catch (error) {
      console.error('[Avatar] ❌ Error connecting:', error);
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleDisconnect = async () => {
    // End conversation in Supabase
    if (currentConversationId && conversationStartTime.current) {
      const durationSeconds = Math.floor(
        (new Date().getTime() - conversationStartTime.current.getTime()) / 1000
      );
      await conversationService.endConversation(currentConversationId, durationSeconds);
      console.log('[DEBUG] Conversation ended, duration:', durationSeconds, 'seconds');
    }
    disconnect();
    setCurrentConversationId(null);
    setAvatarReady(false);
    conversationStartTime.current = null;
  };

  const handleToggleMic = () => {
    toggleMicrophone();
    setMicOn(!micOn);
  };

  return (
    <>
      {/* CONNECTING OVERLAY - Show while generating token OR waiting for avatar */}
      {(isGeneratingToken || (isConnected && !avatarReady)) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <ConnectingSpinner />
        </div>
      )}

      {/* BEY AVATAR VIDEO - Visible element for avatar video */}
      <div className="absolute inset-0 z-0">
        <video
          id="bey-avatar-video"
          autoPlay
          playsInline
          muted
          onCanPlay={handleAvatarReady}
          onPlaying={handleAvatarReady}
          className="w-full h-full object-contain bg-black"
        />
      </div>

      {/* PARTICIPANTS (top-right) */}
      {isConnected && participants.length > 0 && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-30 animate-fade-in">
          {participants.slice(0, 4).map((p, i) => {
            const colors = [
              'bg-purple-600 ring-purple-400/40',
              'bg-indigo-600 ring-indigo-400/40',
              'bg-violet-600 ring-violet-400/40',
              'bg-fuchsia-600 ring-fuchsia-400/40',
            ];
            return (
              <div
                key={i}
                title={p.identity || '?'}
                className={`w-9 h-9 rounded-full ${colors[i % colors.length]} ring-2 ring-offset-1 ring-offset-black/50 flex items-center justify-center text-xs font-bold text-white shadow-lg backdrop-blur`}
              >
                {p.identity?.[0]?.toUpperCase() || '?'}
              </div>
            );
          })}
          {participants.length > 4 && (
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white/70">
              +{participants.length - 4}
            </div>
          )}
        </div>
      )}

      {/* TRANSCRIPT (bottom-right) */}
      {isConnected && (agentTranscript || userTranscript) && (
        <div className="absolute bottom-40 right-6 max-w-sm bg-black/50 backdrop-blur-md text-white text-sm px-4 py-3 rounded-xl z-30 animate-fade-in border border-white/10">
          <div><strong>{t('audio.agent')}</strong> {agentTranscript || '...'}</div>
          <div className="opacity-70 mt-1"><strong>{t('audio.you')}</strong> {userTranscript || '...'}</div>
        </div>
      )}

      {/* CONTROLS */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-24 flex items-center space-x-4 z-40">

        {/* BEFORE CONNECT → START BUTTON */}
        {!isConnected && (
          <div className="flex flex-col items-center space-y-4">
            {/* Tooltip */}
            <div className="relative bg-gray-700 rounded-2xl px-6 py-3 shadow-2xl">
              <p className="text-white text-base font-medium">{t('audio.tapToStart')}</p>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-700" />
            </div>

            {/* Start button */}
            <button
              onClick={handleConnect}
              disabled={isGeneratingToken}
              className={`
                w-20 h-20 rounded-full flex items-center justify-center
                shadow-2xl text-white transition-all duration-200
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
        )}

        {/* AFTER CONNECT → FULL CONTROLS */}
        {isConnected && (
          <div className="flex items-center space-x-4 animate-fade-in">
            {/* Mic toggle */}
            <button
              onClick={handleToggleMic}
              className={`
                w-14 h-14 rounded-full flex items-center justify-center
                shadow-lg text-white transition-all duration-200 hover:scale-105
                ${micOn ? 'bg-purple-600' : 'bg-purple-800'}
              `}
            >
              <MicIcon />
            </button>

            {/* Settings */}
            <button
              onClick={onToggleSettings}
              className="
                w-14 h-14 rounded-full bg-purple-700
                flex items-center justify-center shadow-lg text-white
                transition-all duration-200 hover:scale-105
              "
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Hang up */}
            <button
              onClick={handleDisconnect}
              className="
                w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600
                flex items-center justify-center shadow-xl text-white
                transition-all duration-200 hover:from-red-400 hover:to-red-500 hover:scale-105
              "
            >
              <HangUpIcon />
            </button>
          </div>
        )}
      </div>

      {/* STYLES */}
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
    </>
  );
};

export default RealTimeMode;
