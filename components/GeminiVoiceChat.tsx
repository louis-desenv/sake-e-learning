/**
 * Gemini Voice Chat Component - MELHORADO
 *
 * Voice-only chat using Gemini Live API directly.
 * - Estados melhor gerenciados
 * - Ícones lucide-react (sem emojis)
 * - Botão de mutar microfone
 * - UX/UI refinada
 *
 * @version 1.1.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { getConversationFeedback } from '../services/geminiService';
import { useUser } from '../context/UserContext';
import { SimpleWaveVisualizer } from './audio/SimpleWaveVisualizer';
import { Mic, MicOff, PhoneOff, Volume2, History, X, ChevronRight, Clock, Star, Sparkles, Brain, PartyPopper, Trophy, ChevronDown, ChevronUp, ArrowRight, Lightbulb, Mic2 } from 'lucide-react';
import { conversationService, Conversation, Message } from '../services/conversationService';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { EntitlementDecision, useEntitlements } from '../hooks/useEntitlements';
import { EntitlementPaywallModal } from './access/EntitlementPaywallModal';

// ============================================================================
// TYPES & ENUMS
// ============================================================================

type SessionState = 'IDLE' | 'CONNECTING' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';
const VOICE_ENTITLEMENT_CHUNK_SECONDS = 5;

// ============================================================================
// ICONS
// ============================================================================

const MicIcon = () => (
  <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0M12 19v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Helper function to get consistent user ID from Auth ctx
 */
const getUserId = (user: { id?: string; name?: string } | null): string => {
  if (!user) return 'guest';
  return user.id || user.name || 'guest';
};

/**
 * GeminiVoiceChat - Voice chat com UX/UI melhorada
 */
const GeminiVoiceChat: React.FC<{
  onSessionStart?: () => void;
  onAgentSpeakingChange?: (speaking: boolean) => void;
  onSessionEnd?: (durationSeconds: number) => void;
  timerSlot?: React.ReactNode;
  isTimeExpired?: boolean;
}> = ({ onSessionStart, onAgentSpeakingChange, onSessionEnd, timerSlot, isTimeExpired }) => {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const { consume: consumeEntitlement } = useEntitlements();
  const userId = getUserId(user);
  const {
    isSessionActive,
    isAwaitingResponse,
    userTranscript,
    aiTranscript,
    isAgentSpeaking,
    error,
    startSession,
    endSession,
    chatHistory,
    isMicMuted,
    toggleMicMute,
  } = useGeminiLive();

  // Local state
  const [audioLevel, setAudioLevel] = useState(0);
  const [simulatedAgentLevel, setSimulatedAgentLevel] = useState(0);
  const [isInCall, setIsInCall] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const endSessionRef = useRef<(() => void) | null>(null);

  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousHistoryLength = useRef(0);
  const conversationStartTime = useRef<Date | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Full History List State
  const [historyConversations, setHistoryConversations] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedConversationId, setExpandedConversationId] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Record<string, Message[]>>({});
  const [historyFullscreen, setHistoryFullscreen] = useState(false);

  // Feedback State
  const [lastFeedback, setLastFeedback] = useState<{ positive: string; toImprove: string; specificCorrections?: any[] } | null>(null);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [showFeedbackDetails, setShowFeedbackDetails] = useState(false);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const userMessageCountRef = useRef(0);
  const [blockedEntitlement, setBlockedEntitlement] = useState<EntitlementDecision | null>(null);

  // ===== ESTADOS =====

  /**
   * Determina o estado atual da sessão
   */
  const getSessionState = (): SessionState => {
    if (!isSessionActive) return 'IDLE';
    if (isAgentSpeaking) return 'SPEAKING';
    if (isAwaitingResponse && userTranscript.length > 0) return 'PROCESSING';
    return 'LISTENING';
  };

  const sessionState = getSessionState();

  // Notify parent when agent speaking state changes
  useEffect(() => {
    onAgentSpeakingChange?.(sessionState === 'SPEAKING');
  }, [sessionState, onAgentSpeakingChange]);

  // Simular ondas quando a IA fala
  useEffect(() => {
    if (sessionState === 'SPEAKING') {
      const interval = setInterval(() => {
        // Simula variação de áudio da IA falando
        const baseLevel = 40;
        const variation = Math.random() * 40 - 10; // Entre 30 e 70
        setSimulatedAgentLevel(baseLevel + variation);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setSimulatedAgentLevel(0);
    }
  }, [sessionState]);

  // ===== EFFECTS =====

  /**
   * Determina o nível de áudio para o visualizador
   * Usa o áudio do usuário quando escutando, simula quando a IA fala
   */
  const getVisualizerLevel = () => {
    if (sessionState === 'SPEAKING') {
      return simulatedAgentLevel;
    }
    return audioLevel;
  };

  /**
   * Update audio level from analyser node
   */
  useEffect(() => {
    if (!analyserRef.current || !isSessionActive) {
      setAudioLevel(0);
      return;
    }

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average);
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSessionActive]);

  /**
   * Update endSession ref whenever it changes
   */
  useEffect(() => {
    endSessionRef.current = endSession;
  }, [endSession]);

  /**
   * Cleanup on unmount - ALWAYS end session
   */
  useEffect(() => {
    return () => {
      // Save duration silently if we had an open session
      if (conversationIdRef.current && conversationStartTime.current) {
        const durationSeconds = Math.floor((new Date().getTime() - conversationStartTime.current.getTime()) / 1000);
        conversationService.endConversation(conversationIdRef.current, durationSeconds).catch(err => {
          console.error('[GeminiVoiceChat] Error silently ending conversation on unmount:', err);
        });
      }

      // Always call endSession from ref to avoid closure bug
      if (endSessionRef.current) {
        endSessionRef.current();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // ===== HISTORY EFFECTS =====

  // Scroll to bottom of history
  useEffect(() => {
    if (showHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, userTranscript, aiTranscript, showHistory]);

  // Save new messages to Supabase
  useEffect(() => {
    const saveNewMessages = async () => {
      // Return early if no new messages
      if (chatHistory.length <= previousHistoryLength.current) {
        return;
      }

      // 1. Lock the history length IMMEDIATELY (sync) to prevent React Strict Mode 
      // or fast concurrent renders from processing the same messages while we `await`.
      const prevLen = previousHistoryLength.current;
      const newMessages = chatHistory.slice(prevLen);
      previousHistoryLength.current = chatHistory.length;

      let workingConversationId = currentConversationId;

      // Lazy load conversation ID just like TextChatUI
      if (!workingConversationId) {
        if (userId === 'guest') {
          console.warn(`[GeminiVoiceChat] Missing user context, cannot create conversation.`);
          previousHistoryLength.current = prevLen; // Revert lock
          return;
        }

        try {
          const conversation = await conversationService.createConversation(userId, 'free-conversation', 'voice-only');
          if (conversation) {
            workingConversationId = conversation.id;
            setCurrentConversationId(conversation.id);
            conversationIdRef.current = conversation.id;
            console.log('[GeminiVoiceChat] Lazy Conversation created:', conversation.id, 'scenario: free-conversation');
          }
        } catch (err) {
          console.error('[GeminiVoiceChat] Error creating lazy conversation:', err);
          previousHistoryLength.current = prevLen; // Revert lock
          return;
        }
      }

      if (!workingConversationId) {
        console.warn(`[GeminiVoiceChat] Saving ${newMessages.length} messages delayed: DB Creation failed`);
        previousHistoryLength.current = prevLen; // Revert lock
        return;
      }

      console.log(`[GeminiVoiceChat] Saving ${newMessages.length} new messages to DB non-blocking...`);

      // Fire and forget all messages to avoid blocking the WebAudio ScriptProcessorNode event loop
      Promise.all(newMessages.map(msg => {
        const role = msg.sender === 'user' ? 'user' : 'assistant';
        let messageType = msg.sender === 'user' ? 'user' : 'system';

        // Dynamically classify the very first AI message as 'welcome' to avoid duplicate explicit saves
        if (msg.sender === 'ai' && msg.id === chatHistory.find(m => m.sender === 'ai')?.id) {
          messageType = 'welcome';
        }

        return conversationService.addMessage(
          workingConversationId!,
          role,
          msg.text,
          messageType as any,
          'free-conversation',
          'voice-only'
        ).catch(err => {
          console.error('[GeminiVoiceChat] Exception saving message to Supabase:', err);
        });
      }));
    };

    saveNewMessages();

    // Feedback Trigger Logic
    const userMsgs = chatHistory.filter(m => m.sender === 'user');
    if (userMsgs.length > 0 && userMsgs.length > userMessageCountRef.current && userMsgs.length % 2 === 0) {
      userMessageCountRef.current = userMsgs.length;
      // triggerFeedback(); // Disabled for voice chat/avatar
    }
  }, [chatHistory, currentConversationId, userId]);

  useEffect(() => {
    if (isTimeExpired && isInCall) {
      handleEndSession();
    }
  }, [isTimeExpired, isInCall]);

  const consumeVoiceChunk = async () => {
    const decision = await consumeEntitlement('voice_chat', VOICE_ENTITLEMENT_CHUNK_SECONDS);
    if (!decision) return false;
    if (decision.status !== 'allowed') {
      setBlockedEntitlement(decision);
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!isInCall || !isSessionActive) return;

    const intervalId = window.setInterval(async () => {
      const allowed = await consumeVoiceChunk();
      if (!allowed) {
        await handleEndSession();
      }
    }, VOICE_ENTITLEMENT_CHUNK_SECONDS * 1000);

    return () => window.clearInterval(intervalId);
  }, [isInCall, isSessionActive, consumeEntitlement]);

  const triggerFeedback = async () => {
    setIsFeedbackLoading(true);
    try {
      const history = chatHistory.slice(-10).map(m => `${m.sender === 'user' ? 'User' : 'Tutor'}: ${m.text}`);
      const feedback = await getConversationFeedback(history);
      setLastFeedback(feedback);
      setShowFeedbackOverlay(true);
      
      // Mute microphone when feedback appears so user's voice is not processed during TTS read aloud
      toggleMicMute(true);

      // Trigger Confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Auto-hide after 10 seconds, stopping TTS and restoring microphone
      setTimeout(() => {
        setShowFeedbackOverlay(prev => {
          if (prev) {
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
            toggleMicMute(false);
          }
          return false;
        });
      }, 10000);

      // TTS for Voice Feedback
      if (window.speechSynthesis) {
        const feedbackText = `Quick insight! ${feedback.vocePercebeuIsso}. Suggestion: ${feedback.euPercebiAlgo}`;

        const utterance = new SpeechSynthesisUtterance(feedbackText);
        utterance.lang = 'en-US';
        utterance.rate = 0.9; // Slightly slower for clarity
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error('[GeminiVoiceChat] Error triggering feedback:', err);
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  const handleCloseFeedback = () => {
    setShowFeedbackOverlay(false);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    toggleMicMute(false);
  };

  // Stop any active TTS reading on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Load conversations when history panel opens
  useEffect(() => {
    if (showHistory && userId !== 'guest') {
      loadConversationsByScenario();
    }
  }, [showHistory, userId, user?.activePlan?.type, user?.isInTrial]);

  const loadConversationsByScenario = async () => {
    console.log('[GeminiVoiceChat] loadConversationsByScenario called. userId:', userId);
    if (userId === 'guest') {
      console.warn('[GeminiVoiceChat] Aborting history load - User is guest');
      return;
    }

    setLoadingHistory(true);
    try {
      console.log(`[GeminiVoiceChat] Fetching from Supabase... -> getConversationsByScenario(userId: ${userId}, scenario: free-conversation)`);
      const data = await conversationService.getConversationsByScenario(userId, 'free-conversation', 20, {
        plan: user?.activePlan?.type,
        isTrial: user?.isInTrial,
      });
      console.log('[GeminiVoiceChat] Supabase returned data:', data);
      setHistoryConversations(data);
    } catch (error) {
      console.error('[GeminiVoiceChat] Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    if (conversationMessages[conversationId]) return;
    const data = await conversationService.getConversationWithMessages(conversationId);
    if (data) {
      setConversationMessages(prev => ({ ...prev, [conversationId]: data.messages }));
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return t('common.durationFormat0', { defaultValue: '0m' });
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return t('common.durationFormat', { m: mins, sec: secs, defaultValue: `${mins}m ${secs}s` });
    return t('common.durationFormatSec', { sec: secs, defaultValue: `${secs}s` });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ===== HANDLERS =====

  /**
   * Handle session start
   */
  const handleStartSession = async () => {
    const allowed = await consumeVoiceChunk();
    if (!allowed) return;

    setIsInCall(true);

    previousHistoryLength.current = 0;
    setCurrentConversationId(null);
    conversationIdRef.current = null;
    conversationStartTime.current = new Date(); // Inicia o contador AGORA, e não quando salvar a 1ª mensagem!

    const success = await startSession((analyser) => {
      analyserRef.current = analyser;
    });

    if (success !== false) {
      toggleMicMute(false);
      onSessionStart?.();
    } else {
      setIsInCall(false);
    }
  };

  /**
   * Handle session end
   */
  const handleEndSession = async () => {
    setIsInCall(false);
    analyserRef.current = null;
    toggleMicMute(false);

    let durationSeconds = 0;
    if (conversationStartTime.current) {
       durationSeconds = Math.floor((new Date().getTime() - conversationStartTime.current.getTime()) / 1000);
    }

    // Call hook's endSession synchronously first to close WebSocket & release Mic
    endSession();

    // Notify parent to stop timers and clean up layout
    onSessionEnd?.(durationSeconds);

    // Save duration if conversation exists in DB asynchronously without blocking UI transition
    const savedConversationId = currentConversationId;
    if (savedConversationId) {
      conversationService.endConversation(savedConversationId, durationSeconds).catch((err) => {
        console.error('[GeminiVoiceChat] Error ending conversation on click:', err);
      });
      conversationIdRef.current = null;
      setCurrentConversationId(null);
    }

    loadConversationsByScenario().catch(err => console.error(err));
  };

  /**
   * Toggle microphone mute
   */
  const handleToggleMute = () => {
    toggleMicMute();
  };

  // ===== RENDER =====

  return (
    <>
    <div className="w-full h-full flex items-center justify-center bg-gray-50 p-2 md:p-4 bv-chat-theme">
      {/* Card container */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg border-t-4 border-t-cyan-500 flex flex-col overflow-hidden transition-all hover:shadow-xl h-full md:h-auto">

        {/* Header */}
        <div className="p-4 md:p-6 pb-2 flex items-center justify-between border-b border-gray-50/50">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-cyan-50 rounded-full text-cyan-600">
              <Mic2 className="w-8 h-8" />
            </div>
            <div className="flex items-center gap-4">
              <div>
                <h3 className="font-bold text-xl text-gray-800">{t('chat.justSpeak')}</h3>
                <p className="text-sm text-gray-500">{t('chat.tapBelow')}</p>
              </div>
              {timerSlot && <div className="hidden sm:block ml-2">{timerSlot}</div>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {timerSlot && <div className="sm:hidden">{timerSlot}</div>}
            {/* History Button (Always available, like real-life) */}
            <button
              onClick={() => setShowHistory(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-gray-100 hover:bg-gray-200 shadow-sm border border-gray-200"
              title={t('chat.historyTitle')}
            >
              <History className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 md:p-8 space-y-3 md:space-y-8 min-h-0 sm:min-h-[320px] md:min-h-[500px] relative bg-white overflow-hidden">
          {/* Animated waves background */}
          <div className="absolute inset-4 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 overflow-hidden">
            <SimpleWaveVisualizer
              isInCall={isInCall}
              isListening={sessionState === 'LISTENING'}
              isAgentSpeaking={sessionState === 'SPEAKING'}
              audioLevel={getVisualizerLevel()}
              theme="cyan"
            />
          </div>

          {/* Vignette */}
          <div className="absolute inset-4 pointer-events-none rounded-2xl bg-gradient-to-t from-white/30 via-transparent to-transparent" />

          {/* ===== ANTES DE CONECTAR ===== */}
          {sessionState === 'IDLE' && (
            <>

              {/* Centered microphone button */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-8 sm:bottom-20 z-40">
                <div className="flex flex-col items-center space-y-2">
                  {/* Tooltip balloon */}
                  <div className="relative bg-white rounded-xl px-3 sm:px-5 py-2 shadow-md border border-gray-200">
                    <p className="text-gray-700 text-xs font-medium">
                      {t('chat.tapToStart')}
                    </p>
                    {/* Arrow pointing down */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-6 border-t-white" />
                  </div>

                  {/* Microphone button */}
                  <button
                    onClick={handleStartSession}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg text-white transition-all duration-300 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 hover:scale-105"
                  >
                    <MicIcon />
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="absolute bottom-4 left-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </>
          )}

          {/* ===== DURANTE SESSÃO ===== */}
          {sessionState !== 'IDLE' && (
            <>
              {/* Top-left label */}
              {/* Top-left label */}
              <div className="absolute top-5 left-5 sm:top-8 sm:left-8 bg-white/80 text-gray-700 text-xs px-3 py-1 rounded-full backdrop-blur z-10 flex items-center gap-2 shadow-sm border border-gray-200">
                <div className={`w-2 h-2 rounded-full ${sessionState === 'LISTENING' ? 'bg-green-500 animate-pulse' : sessionState === 'SPEAKING' ? 'bg-cyan-500' : 'bg-yellow-500'}`} />
                Tutor IA
              </div>

              {/* Status indicator (top-right) - COM ÍCONES */}
              <div className="absolute top-5 right-5 sm:top-8 sm:right-8 flex items-center space-x-2 z-10">
                <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-gray-200">
                  {sessionState === 'LISTENING' && (
                    <>
                      <Mic className="w-3 h-3 text-green-500" />
                      <span className="text-gray-700 text-xs">{t('chat.listening')}</span>
                    </>
                  )}
                  {sessionState === 'PROCESSING' && (
                    <>
                      <div className="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-700 text-xs">{t('chat.processing')}</span>
                    </>
                  )}
                  {sessionState === 'SPEAKING' && (
                    <>
                      <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
                      <span className="text-gray-700 text-xs">{t('chat.speaking')}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Transcript - Clean Subtitle Style (Turn-based) */}
              <div className="absolute left-0 right-0 bottom-20 sm:bottom-24 px-5 sm:px-8 z-30 pointer-events-none flex flex-col items-center">

                {/* Active Transcript Container */}
                <div className="w-full max-w-sm sm:max-w-md max-h-[150px] overflow-y-auto bg-white/50 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/40 shadow-sm transition-all duration-300">

                  {/* Combined View showing only the active speaker clearly */}
                  {sessionState === 'SPEAKING' ? (
                    <div className="animate-fade-in-up">
                      <div className="flex items-center gap-2 mb-1 text-blue-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">{t('chat.tutor', { defaultValue: 'Tutor' })}</span>
                      </div>
                      <p className="text-gray-800 text-sm font-medium leading-relaxed">
                        {aiTranscript || "..."}
                      </p>
                    </div>
                  ) : (
                    <div className="animate-fade-in-up">
                      <div className="flex items-center gap-2 mb-1 text-cyan-600 justify-end">
                        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">{t('chat.you')}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                      </div>
                      <p className="text-gray-700 text-sm text-right leading-relaxed">
                        {userTranscript || <span className="text-gray-400 italic">{t('chat.listeningSubtitle')}</span>}
                      </p>
                    </div>
                  )}

                </div>
              </div>

              {/* Control bar - Simplificado */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-5 flex items-center gap-3 z-20">

                {/* Mute button */}
                <button
                  onClick={handleToggleMute}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[var(--bg-card-alt)] backdrop-blur border border-[var(--border-mid)] flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                  title={isMicMuted ? 'Unmute' : 'Mute'}
                >
                  {isMicMuted ? <MicOff className="w-5 h-5 text-red-500" /> : <Mic className="w-5 h-5 text-[var(--text-primary)]" />}
                </button>

                {/* End call button */}
                <button
                  onClick={handleEndSession}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                >
                  <PhoneOff className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Feedback Overlay */}
              <AnimatePresence>
                {showFeedbackOverlay && lastFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 50 }}
                    className="absolute inset-x-8 top-1/2 -translate-y-1/2 z-50"
                  >
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-cyan-100 overflow-hidden">
                      <div className="bg-cyan-500 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                          <Brain size={18} />
                          <span className="font-bold text-sm">{t('chat.tutorInsight')}</span>
                        </div>
                        <button 
                          onClick={handleCloseFeedback}
                          className="text-white/80 hover:text-white"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      
                      <div className="p-6 space-y-4">
                        <div className="animate-in fade-in slide-in-from-left-4 duration-500 delay-150">
                          <div className="flex items-center gap-2 text-cyan-600 font-bold text-xs uppercase tracking-widest mb-2">
                            {t('chat.doingGreat')}
                          </div>
                          <p className="text-gray-800 text-sm leading-relaxed italic">
                            "{lastFeedback.positive}"
                          </p>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-left-4 duration-500 delay-300">
                          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-2">
                            <Sparkles size={14} />
                            {t('chat.quickTip')}
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {lastFeedback.toImprove}
                          </p>
                        </div>

                        {/* Expandable Details for Gemini Voice Chat */}
                        {lastFeedback.specificCorrections && lastFeedback.specificCorrections.length > 0 && (
                          <div className="pt-2">
                            <button 
                              onClick={() => setShowFeedbackDetails(!showFeedbackDetails)}
                              className="flex items-center gap-1 text-[10px] font-bold text-cyan-600 uppercase tracking-widest hover:text-cyan-800 transition-colors"
                            >
                              {showFeedbackDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              {t('chat.viewSpecificMistakes')}
                            </button>

                            <AnimatePresence>
                              {showFeedbackDetails && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden mt-3 space-y-3"
                                >
                                  {lastFeedback.specificCorrections.map((corr, cIdx) => (
                                    <div key={cIdx} className="bg-cyan-50/50 border border-cyan-100 rounded-lg p-3 space-y-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-red-500 line-through text-[10px] opacity-70 italic font-medium">
                                          "{corr.original}"
                                        </span>
                                        <ArrowRight size={12} className="text-cyan-400" />
                                        <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">
                                          "{corr.corrected}"
                                        </span>
                                      </div>
                                      <div className="flex items-start gap-1.5 text-[9px] text-cyan-800 leading-tight">
                                        <Lightbulb size={12} className="shrink-0 text-amber-500" />
                                        <span>{corr.explanation}</span>
                                      </div>
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}

                        <button 
                          onClick={handleCloseFeedback}
                          className="w-full mt-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-colors"
                        >
                          {t('chat.gotItThanks')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isFeedbackLoading && (
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-cyan-100 shadow-sm flex items-center gap-2 animate-pulse">
                  <Brain size={14} className="text-cyan-500" />
                  <span className="text-[10px] font-bold text-cyan-600 uppercase">{t('chat.analyzingPerformance')}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* --- HISTORY MODAL (TextChatUI Visuals) --- */}
      {showHistory && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${historyFullscreen ? 'p-0 md:pl-[240px]' : 'p-4 md:pl-[240px]'}`}>
          <div className={`bg-white shadow-2xl w-full flex flex-col overflow-hidden ${historyFullscreen ? 'h-full rounded-2xl' : 'rounded-2xl max-w-2xl max-h-[90vh]'}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 min-w-0">
                <History className="w-5 h-5 text-gray-500" />
                <span className="sm:hidden">{t('chat.historyShortTitle', { defaultValue: 'Histórico' })}</span>
                <span className="hidden sm:inline">{t('chat.historyTitle')}</span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHistoryFullscreen(!historyFullscreen)}
                  className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
                  title={historyFullscreen ? t('voiceChat.exitFullscreen') : t('voiceChat.fullscreen')}
                >
                  {historyFullscreen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
                </div>
              ) : historyConversations.length === 0 && chatHistory.length === 0 ? (
                <div className="text-center py-8 flex flex-col items-center justify-center h-full text-gray-400">
                  <History className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">{t('chat.noConversations')}</p>
                  <p className="text-sm">{t('chat.historyWillAppear')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Active Current Conversation Item (if any) */}
                  {chatHistory.length > 0 && currentConversationId && (
                    <div className="bg-purple-50 flex flex-col rounded-xl border border-purple-200 overflow-hidden shadow-sm max-h-[400px]">
                      <div className="bg-purple-100/50 px-4 py-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                          <span className="font-medium text-purple-800 text-sm">{t('chat.currentSession')}</span>
                        </div>
                        <span className="text-xs text-purple-600 font-semibold">{chatHistory.length} {t('chat.msgs')}</span>
                      </div>
                      <div className="p-4 space-y-3 overflow-y-auto bg-white border-t border-purple-100 flex-1">
                        {chatHistory.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${msg.sender === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}>
                              <div className={`text-[10px] ${msg.sender === 'user' ? 'text-purple-200' : 'text-gray-500'} mb-1 ml-1 font-medium select-none`}>
                                {msg.sender === 'user' ? t('chat.youHistory') : t('chat.aiTutorHistory')}
                              </div>
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} className="h-2" />
                      </div>
                    </div>
                  )}

                  {/* Past Conversations List */}
                  {historyConversations
                    .filter(conv => conv.id !== currentConversationId)
                    .map((conv) => (
                      <div key={conv.id} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                        {/* Header */}
                        <div
                          className="bg-gray-100 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => {
                            if (expandedConversationId === conv.id) {
                              setExpandedConversationId(null);
                            } else {
                              setExpandedConversationId(conv.id);
                              loadConversationMessages(conv.id);
                            }
                          }}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 capitalize">{conv.scenario.replace(/-/g, ' ')}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {formatDate(conv.started_at)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDuration(conv.duration_seconds)}</span>
                              <span className="text-gray-300">•</span>
                              <span>{conversationMessages[conv.id]?.length ?? conv.message_count ?? 0} {t('chat.messages')}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                /* Note: download function not implemented yet in this component */
                                alert(t('chat.downloadComingSoon'));
                              }}
                              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-gray-200 rounded-lg transition-colors"
                              title={t('chat.downloadConversation')}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7,10 12,15 17,10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            </button>
                            <ChevronRight className={`h-5 w-5 text-gray-500 transition-transform ${expandedConversationId === conv.id ? 'rotate-90' : ''}`} />
                          </div>
                        </div>

                        {/* Messages */}
                        {expandedConversationId === conv.id && (
                          <div className="p-4 space-y-3 max-h-96 overflow-y-auto bg-white border-t border-gray-200 custom-scrollbar">
                            {conversationMessages[conv.id]?.length === 0 ? (
                              <p className="text-gray-400 text-sm text-center py-2">{t('chat.loadingMessages')}</p>
                            ) : (
                              conversationMessages[conv.id]?.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                                    }`}>
                                    <div className={`text-[10px] ${msg.role === 'user' ? 'text-purple-200' : 'text-gray-500'} mb-1 ml-1 font-medium select-none`}>
                                      {msg.role === 'user' ? t('chat.youHistory') : t('chat.aiTutorHistory')}
                                    </div>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    <EntitlementPaywallModal
      decision={blockedEntitlement}
      onClose={() => setBlockedEntitlement(null)}
    />
    </>
  );
};

export default GeminiVoiceChat;
