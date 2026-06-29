import React, { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useLiveKitRoom } from "../hooks/useLiveKitRoom";
import {
  generateLiveKitToken,
  LIVEKIT_CONFIG,
  LiveKitEntitlementError,
} from "../services/livekitTokenService";
import { useUser } from "../context/UserContext";
import { Star, Volume2, History, ChevronRight, Clock, X, Brain, Sparkles, PartyPopper, Trophy, ChevronDown, ChevronUp, ArrowRight, Lightbulb, Bot, Mic, MicOff, Video, VideoOff, MessageSquare, Maximize2, Minimize2, PhoneOff, User, Timer } from "lucide-react";
import avatarVideo from "../video/avatar-video.mp4";
import {
  conversationService,
  Conversation,
  Message,
} from "../services/conversationService";
import { getConversationFeedback } from "../services/geminiService";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useGamification } from "../gamification/hooks/useGamification";
import { calculateXpFromDuration } from "../gamification/core/xpCalculator";
import { DEFAULT_GAMIFICATION_CONFIG } from "../gamification/gamification.config";
import SessionSummaryModal from "../gamification/components/SessionSummaryModal";
import { EntitlementDecision, useEntitlements } from "../hooks/useEntitlements";
import { EntitlementPaywallModal } from "./access/EntitlementPaywallModal";

/**
 * Helper function to get consistent user ID from Auth ctx
 */
const getUserId = (user: { id?: string; name?: string } | null): string => {
  if (!user) return "guest";
  return user.id || user.name || "guest";
};

const SESSION_ENTITLEMENT_CHUNK_SECONDS = 5;

/* ================= CONNECTING SPINNER ICON (lucide) ================= */

/* ================= FANCY CONNECTING SPINNER ================= */

const ConnectingSpinner = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Multi-ring spinner */}
      <div className="relative w-32 h-32">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-2xl animate-pulse" />

        {/* Ring 1 - outer (slow) */}
        <div
          className="absolute inset-0 rounded-full border-4 border-purple-500/20"
          style={{
            borderTopColor: "#a855f7",
            borderRightColor: "#7c3aed",
            animation: "spin 3s linear infinite",
          }}
        />

        {/* Ring 2 - middle (medium, reverse) */}
        <div
          className="absolute inset-4 rounded-full border-4 border-purple-500/20"
          style={{
            borderTopColor: "#c084fc",
            borderLeftColor: "#8b5cf6",
            animation: "spin 2s linear infinite reverse",
          }}
        />

        {/* Ring 3 - inner (fast) */}
        <div
          className="absolute inset-8 rounded-full border-4 border-purple-500/20"
          style={{
            borderTopColor: "#e9d5ff",
            borderBottomColor: "#a855f7",
            animation: "spin 1s linear infinite",
          }}
        />

        {/* Center icon with pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 w-10 h-10 rounded-full bg-purple-500 animate-ping opacity-40" />
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <Video className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Status text with animated dots */}
      <div className="text-center">
        <p className="text-[var(--text-primary)] text-xl font-medium tracking-wide flex items-center justify-center">
          {t('voiceChat.preparingSession')}
          <span className="flex ml-1 space-x-1">
            <span
              className="w-2 h-2 bg-[var(--accent-purple)] rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-2 h-2 bg-[var(--accent-purple)] rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-2 h-2 bg-[var(--accent-purple)] rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </span>
        </p>
        <p className="text-[var(--text-muted)] text-sm mt-3">
          {t('voiceChat.loadingAvatar')}
        </p>
      </div>

      {/* Progress bar for connection feedback */}
      <div className="w-48 h-1 bg-[var(--border-subtle)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-purple2)] rounded-full"
          style={{
            animation: "progress 2s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */

interface VoiceChatUIProps {
  timeLimitSeconds?: number | null;
  awardXp?: boolean;
  recordUsage?: boolean;
  featureToRecord?: 'voice_chat' | 'avatar_chat';
  onSessionStarted?: () => void;
  onSessionEnded?: (durationSeconds: number) => void;
}

const VoiceChatUI: React.FC<VoiceChatUIProps> = ({
  timeLimitSeconds,
  awardXp = true,
  recordUsage = true,
  featureToRecord = 'voice_chat',
  onSessionStarted,
  onSessionEnded,
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const { consume: consumeEntitlement } = useEntitlements();
  const userId = getUserId(user);

  const { addXp, level, totalXp, xpToNextLevel } = useGamification();
  const [sessionSummary, setSessionSummary] = useState<{ xp: number; duration: number } | null>(null);
  const [blockedEntitlement, setBlockedEntitlement] = useState<EntitlementDecision | null>(null);

  // Active session refs
  const currentConversationIdRef = useRef<string | null>(null);
  const conversationStartTime = useRef<Date | null>(null);

  const {
    isConnected,
    agentTranscript,
    userTranscript,
    participants,
    connect,
    disconnect,
    toggleMicrophone,
    videoElementKey,
    audioTrackReady,
    videoTrackReady,
    isAgentSpeaking,
  } = useLiveKitRoom({
    onMessageComplete: (role, text, timestamp) => {
      setSessionHistory((prev) => {
        const newEntry = { role, text, timestamp: timestamp ?? Date.now() };
        // Keep history sorted chronologically by timestamp
        return [...prev, newEntry].sort((a, b) => a.timestamp - b.timestamp);
      });
      if (role === 'user') {
        const newCount = userMessageCount + 1;
        setUserMessageCount(newCount);
        if (newCount > 0 && newCount % 2 === 0) {
          // triggerFeedback(); // Disabled for voice chat/avatar
        }
      }
    },
  });

  const triggerFeedback = async () => {
    setIsFeedbackLoading(true);
    try {
      // Get last 10 messages for context
      const historyStrings = sessionHistory.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Tutor'}: ${m.text}`);
      const feedback = await getConversationFeedback(historyStrings);
      setLastFeedback(feedback);
      setShowFeedbackOverlay(true);
      
      // Trigger Confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#8b5cf6', '#6366f1', '#10b981']
      });

      // Auto-hide after 12 seconds
      setTimeout(() => setShowFeedbackOverlay(false), 12000);

      // TTS for Voice Feedback
      if (window.speechSynthesis) {
        const feedbackText = `Tutor Insight! ${feedback.vocePercebeuIsso}. Something to work on: ${feedback.euPercebiAlgo}`;
        const utterance = new SpeechSynthesisUtterance(feedbackText);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error('[VoiceChatUI] Error triggering feedback:', err);
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [micOn, setMicOn] = useState(true);

  // Avatar ready state
  const [avatarReady, setAvatarReady] = useState(false);

  // Timing logs
  const connectionStartTime = useRef<number | null>(null);
  const sessionReadyNotifiedRef = useRef(false);

  // Local camera preview
  const [cameraOn, setCameraOn] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Modals and settings
  const [activeModal, setActiveModal] = useState<"points" | "audio" | null>(
    null,
  );
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [userPoints, setUserPoints] = useState(1250);

  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [historyConversations, setHistoryConversations] = useState<
    Conversation[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedConversationId, setExpandedConversationId] = useState<
    string | null
  >(null);
  const [conversationMessages, setConversationMessages] = useState<
    Record<string, Message[]>
  >({});
  const [historyFullscreen, setHistoryFullscreen] = useState(false);

  // Feedback State
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [sessionHistory, setSessionHistory] = useState<{ role: string; text: string; timestamp: number }[]>([]);
  const [lastFeedback, setLastFeedback] = useState<{ vocePercebeuIsso: string; euPercebiAlgo: string; proximoDesafio: string; specificCorrections?: any[] } | null>(null);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [showFeedbackDetails, setShowFeedbackDetails] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const callContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      try {
        const target = callContainerRef.current || document.documentElement;
        if (target.requestFullscreen) {
          await target.requestFullscreen();
        }
        setIsFullscreen(true);
      } catch {
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Sync fullscreen state with browser ESC key
  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  // Derived state: Show spinner when connected but avatar not ready
  const showSpinner = isConnected && !avatarReady;

  // Derived state: Call is fully ready (connected + avatar loaded)
  const isCallReady = isConnected && avatarReady;

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      alert(t('voiceChat.cameraDenied'));
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const handleToggleMic = () => {
    toggleMicrophone();
    setMicOn(!micOn);
  };

  const consumeSessionChunk = useCallback(async () => {
    const decision = await consumeEntitlement(featureToRecord, SESSION_ENTITLEMENT_CHUNK_SECONDS);
    if (!decision) return false;
    if (decision.status !== 'allowed') {
      setBlockedEntitlement(decision);
      return false;
    }
    return true;
  }, [consumeEntitlement, featureToRecord]);

  useEffect(() => {
    if (isConnected && cameraOn && streamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = streamRef.current;
      localVideoRef.current.play().catch(err => {
        console.error("[VoiceChatUI] Error playing local video stream in effect:", err);
      });
    }
  }, [isConnected, cameraOn]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      disconnect();
    };
  }, [disconnect]);

  const handleConnect = async () => {
    const allowed = await consumeSessionChunk();
    if (!allowed) return;

    setIsGeneratingToken(true);
    setAvatarReady(false); // Reset avatar state
    sessionReadyNotifiedRef.current = false;
    conversationStartTime.current = null;
    connectionStartTime.current = Date.now();
    console.log("[Avatar] ⏱️ Starting connection...");
    try {
      // Criar a conversa no banco ANTES de gerar o token
      let conversationId: string | undefined;
      if (userId !== "guest") {
        const conv = await conversationService.createConversation(
          userId,
          "free-conversation",
          "avatar",
        );
        if (conv) {
          currentConversationIdRef.current = conv.id;
          conversationId = conv.id;
        }
      }

      // Gerar token com conversationId no metadata
      const token = await generateLiveKitToken({
        apiKey: LIVEKIT_CONFIG.apiKey,
        apiSecret: LIVEKIT_CONFIG.apiSecret,
        identity: user.name || "User",
        roomName: LIVEKIT_CONFIG.roomName,
        conversationId,
      });
      console.log(
        "[Avatar] ✅ Token generated in",
        Date.now() - connectionStartTime.current,
        "ms",
      );

      await connect(LIVEKIT_CONFIG.serverUrl, token);
      console.log(
        "[Avatar] ✅ Connected to LiveKit in",
        Date.now() - connectionStartTime.current,
        "ms",
      );
    } catch (error) {
      if (error instanceof LiveKitEntitlementError) {
        setBlockedEntitlement(error.entitlement);
      } else {
        console.error("[Avatar] Failed to generate token or connect:", error);
      }

      currentConversationIdRef.current = null;
    } finally {
      setIsGeneratingToken(false);
    }
  };

  const handleDisconnect = async () => {
    const durationSeconds = conversationStartTime.current
      ? Math.floor((Date.now() - conversationStartTime.current.getTime()) / 1000)
      : 0;

    // Save duration if we have a valid session
    if (currentConversationIdRef.current) {
      try {
        await conversationService.endConversation(
          currentConversationIdRef.current,
          durationSeconds,
        );
      } catch (err) {
        console.error("[VoiceChatUI] Error ending conversation or recording usage:", err);
      }

      // Calcula e atribui o XP ganho na sessão de fala com o Avatar
      const xpGained = awardXp && level > 1
        ? calculateXpFromDuration(durationSeconds, DEFAULT_GAMIFICATION_CONFIG, true, true)
        : 0;

      if (xpGained > 0) {
        addXp(xpGained, {
          type: 'voice-avatar',
          label: 'Sessão com Avatar Ultra-realista',
          reason: 'Praticou conversação avançada com o avatar realista.'
        });
      }

      if (durationSeconds > 0) {
        setSessionSummary({ xp: xpGained, duration: durationSeconds });
      }

      currentConversationIdRef.current = null;
    }

    onSessionEnded?.(durationSeconds);
    conversationStartTime.current = null;
    sessionReadyNotifiedRef.current = false;
    await disconnect();
    setAvatarReady(false);

    if (userId !== "guest") {
      loadConversationsByScenario();
    }
  };

  useEffect(() => {
    if (!isCallReady) return;

    const intervalId = window.setInterval(async () => {
      const allowed = await consumeSessionChunk();
      if (!allowed) {
        await handleDisconnect();
      }
    }, SESSION_ENTITLEMENT_CHUNK_SECONDS * 1000);

    return () => window.clearInterval(intervalId);
  }, [isCallReady, consumeSessionChunk]);

  // Handler for avatar/session ready. The LiveKit agent can respond before a video
  // track is published, so audio/transcript activity must also release the loading UI.
  const handleAvatarReady = useCallback(() => {
    if (sessionReadyNotifiedRef.current) return;
    sessionReadyNotifiedRef.current = true;
    conversationStartTime.current = new Date();
    const elapsed = connectionStartTime.current
      ? Date.now() - connectionStartTime.current
      : 0;
    console.log("[Avatar] ✅ Avatar video ready! Total time:", elapsed, "ms");
    setAvatarReady(true);
    onSessionStarted?.();
  }, [onSessionStarted]);

  // Sync avatarReady with videoTrackReady from hook (fallback if onPlaying doesn't fire)
  useEffect(() => {
    if (videoTrackReady) {
      handleAvatarReady();
    }
  }, [videoTrackReady, handleAvatarReady]);

  useEffect(() => {
    if (!isConnected || avatarReady || videoTrackReady) return;

    const hasAgentActivity =
      audioTrackReady ||
      participants.length > 1 ||
      agentTranscript.trim().length > 0 ||
      userTranscript.trim().length > 0;

    if (!hasAgentActivity) return;

    const readyTimer = window.setTimeout(() => {
      handleAvatarReady();
    }, 1200);

    return () => window.clearTimeout(readyTimer);
  }, [
    isConnected,
    avatarReady,
    videoTrackReady,
    audioTrackReady,
    participants.length,
    agentTranscript,
    userTranscript,
    handleAvatarReady,
  ]);

  // ── TIMER LOGIC ──────────────────────────────────────────────────────────
  const [secondsActive, setSecondsActive] = useState<number>(0);
  const timerRafRef = useRef<number | null>(null);
  const callStartTimeRef = useRef<number | null>(null);
  // Graceful exit — set true when limit reached; triggers soft disconnect after agent finishes
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [gracePeriodCountdown, setGracePeriodCountdown] = useState<number | null>(null);
  const gracePeriodIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isCallReady) {
      callStartTimeRef.current = Date.now();
      setSecondsActive(0);
      setIsTimeUp(false);
      setGracePeriodCountdown(null);

      const tick = () => {
        if (!callStartTimeRef.current) return;
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setSecondsActive(elapsed);

        if (timeLimitSeconds && elapsed >= timeLimitSeconds) {
          setIsTimeUp(true);
          return; // Stop ticking; graceful exit effect takes over
        }
        timerRafRef.current = requestAnimationFrame(tick);
      };

      timerRafRef.current = requestAnimationFrame(tick);
    } else {
       if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
       setSecondsActive(0);
       setIsTimeUp(false);
       setGracePeriodCountdown(null);
       if (gracePeriodIntervalRef.current) clearInterval(gracePeriodIntervalRef.current);
    }

    return () => {
      if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
    };
  }, [isCallReady, timeLimitSeconds]);

  // Graceful Exit: wait for agent to stop speaking, then countdown 3s before disconnecting
  useEffect(() => {
    if (!isTimeUp) return;
    if (isAgentSpeaking) return; // Keep waiting while agent speaks
    if (gracePeriodIntervalRef.current) return; // Already counting

    let count = 3;
    setGracePeriodCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(interval);
        gracePeriodIntervalRef.current = null;
        setGracePeriodCountdown(null);
        handleDisconnect();
      } else {
        setGracePeriodCountdown(count);
      }
    }, 1000);
    gracePeriodIntervalRef.current = interval;

    return () => {
      clearInterval(interval);
      gracePeriodIntervalRef.current = null;
    };
  }, [isTimeUp, isAgentSpeaking]);
  // ─────────────────────────────────────────────────────────────────────────


  // ============================================================================
  // HISTORY LOGIC
  // ============================================================================

  // Load conversations when history panel opens
  useEffect(() => {
    if (showHistory && userId !== "guest") {
      loadConversationsByScenario();
    }
  }, [showHistory, userId, user?.activePlan?.type, user?.isInTrial]);

  const loadConversationsByScenario = async () => {
    if (userId === "guest") return;

    setLoadingHistory(true);
    try {
      // Buscar do bd pela Categoria "avatar"
      const data = await conversationService.getConversationsByCategory(
        userId,
        "avatar",
        50,
        {
          plan: user?.activePlan?.type,
          isTrial: user?.isInTrial,
        },
      );

      // Filtrar pelo cenário "free-conversation" no frontend
      const avatarFreeConversations = data.filter(
        (conv) => conv.scenario === "free-conversation",
      );

      setHistoryConversations(avatarFreeConversations);
    } catch (error) {
      console.error("[VoiceChatUI] Error loading history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    if (conversationMessages[conversationId]) return;
    const data =
      await conversationService.getConversationWithMessages(conversationId);
    if (data) {
      setConversationMessages((prev) => ({
        ...prev,
        [conversationId]: data.messages,
      }));
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
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* CARD — Shown always: idle, loading and connected (inline, no fullscreen takeover) */}
      <div
        ref={callContainerRef}
        className={`w-full h-full flex items-start sm:items-center justify-center bg-[var(--bg-base)] p-2 sm:p-4 relative z-40 ${
          isFullscreen ? 'fixed inset-0 z-[200] !items-stretch !p-0 bg-black' : ''
        }`}
      >
          <div className={`bv-card flex flex-col overflow-hidden relative ${
            isFullscreen
              ? 'h-[100dvh] w-screen max-w-none rounded-none border-0 bg-black'
              : `w-full max-w-3xl ${isConnected ? 'h-full min-h-[480px]' : 'min-h-[560px] max-h-full sm:h-auto'}`
          }`}>
            <div className={`${isFullscreen && isConnected ? 'hidden' : 'p-3 sm:p-6 sm:pb-2 flex items-center justify-between border-b border-[var(--border-subtle)]'}`}>
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                <div className="p-2 sm:p-3 bg-[var(--bg-card-alt)] rounded-full text-[var(--accent-purple2)] shrink-0">
                  <Bot className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg sm:text-xl text-[var(--text-primary)] leading-tight">
                      {t('voiceChat.justAvatar')}
                    </h3>
                    <p className="hidden min-[380px]:block text-xs sm:text-sm text-[var(--text-muted)] leading-snug">
                      {isConnected ? t('voiceChat.callInProgress', { defaultValue: 'Sessão em andamento' }) : t('voiceChat.tapBelow')}
                    </p>
                  </div>
                  {timeLimitSeconds !== null && timeLimitSeconds !== undefined && (
                    <div className={`hidden sm:flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors min-w-[70px] ${
                      timeLimitSeconds <= 60
                        ? 'bg-red-500/15 border border-red-500/30 text-red-500 animate-pulse shadow-sm'
                        : 'bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 shadow-sm'
                    }`}>
                      <Timer size={14} />
                      <span className="font-mono tabular-nums">
                        {Math.floor(timeLimitSeconds / 60)}:{(timeLimitSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {!showSpinner && timeLimitSeconds !== null && timeLimitSeconds !== undefined && (
                  <div className={`sm:hidden flex items-center justify-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold transition-colors min-w-[62px] ${
                    timeLimitSeconds <= 60
                      ? 'bg-red-500/15 border border-red-500/30 text-red-500 animate-pulse shadow-sm'
                      : 'bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 shadow-sm'
                  }`}>
                    <Timer size={14} />
                    <span className="font-mono tabular-nums">
                      {Math.floor(timeLimitSeconds / 60)}:{(timeLimitSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
                {/* History Button (Always available, like real-life) */}
                {!showSpinner && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-[var(--bg-card-alt)] hover:bg-[var(--bg-card-hover)] shadow-sm border border-[var(--border-subtle)]"
                    title={t('chat.historyTitle')}
                  >
                    <History className="h-5 w-5 text-[var(--text-secondary)]" />
                  </button>
                )}
              </div>
            </div>

            {/* Body — shared between idle and connected states */}
            <div className="flex-1 flex flex-col items-center justify-start sm:justify-center p-4 pt-6 sm:p-8 space-y-3 sm:space-y-8 min-h-0 relative bg-[var(--bg-card)] overflow-y-auto overflow-x-hidden">
              {/* Background decoration (idle only) */}
              {!isConnected && (
                <div className="absolute inset-3 sm:inset-4 rounded-2xl bg-gradient-to-br from-[var(--bg-card-alt)] to-[var(--bg-base)] overflow-hidden opacity-40" />
              )}

              {/* ── IDLE STATE — preview video + start button ── */}
              {!isConnected && (
                <div className="relative z-40 flex min-h-0 w-full flex-1 flex-col items-center justify-start sm:justify-center p-1 sm:p-6">
                  {/* Video Container - Responsive */}
                  <div className="relative w-[64vw] max-w-[230px] min-[380px]:w-[60vw] sm:w-full sm:max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-2 sm:border-4 border-[var(--border-subtle)] ring-2 sm:ring-4 ring-purple-950/20 mb-4 sm:mb-8">
                    <video
                      src={avatarVideo}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col items-center space-y-3">
                    <div className="hidden sm:block relative bg-[var(--bg-card-alt)] rounded-xl px-3 sm:px-5 py-2 shadow-md border border-[var(--border-subtle)]">
                      <p className="text-[var(--text-secondary)] text-xs font-medium">
                        {t('voiceChat.tapToStart')}
                      </p>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-l-transparent border-r-6 border-r-transparent border-t-6 border-t-[var(--bg-card-alt)]" />
                    </div>
                    <button
                      onClick={handleConnect}
                      disabled={isGeneratingToken}
                      className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg text-white transition-all duration-300 ${
                        isGeneratingToken
                          ? 'bg-gray-700 cursor-not-allowed'
                          : 'bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-purple2)] hover:scale-105'
                      }`}
                    >
                      {isGeneratingToken ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Mic className="w-9 h-9" />
                      )}
                    </button>
                    <p className="sm:hidden text-[11px] font-semibold text-[var(--text-muted)]">
                      {t('voiceChat.tapToStart')}
                    </p>
                  </div>
                </div>
              )}

              {/* ── CONNECTED STATE — inline video card ── */}
              {isConnected && (
                <div className="absolute inset-0 bg-black overflow-hidden">

                  {/* LiveKit avatar video */}
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

                  {/* 1️⃣ Spinner — conectando (antes do áudio chegar) */}
                  <AnimatePresence>
                    {showSpinner && (
                      <motion.div
                        key="spinner-connecting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 z-40 flex items-center justify-center bg-black"
                      >
                        <ConnectingSpinner />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Session preparation state shown while the avatar video is still loading. */}
                  <AnimatePresence>
                    {isCallReady && !videoTrackReady && (
                      <motion.div
                        key="avatar-audio-mode"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 z-10 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.24),rgba(0,0,0,0.92)_62%)] px-6"
                      >
                        <div className="max-w-sm text-center">
                          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/15 ring-1 ring-purple-300/25">
                            <Bot className="h-10 w-10 text-purple-200" />
                          </div>
                          <div className="text-lg font-semibold text-white">
                            {t('voiceChat.avatarAudioModeTitle')}
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-white/70">
                            {t('voiceChat.avatarAudioModeDesc')}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Soft vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none" />

                  {/* Timer pill */}
                  {isCallReady && (() => {
                    const limitSecs = timeLimitSeconds ?? 600;
                    const remaining = Math.max(0, limitSecs - secondsActive);
                    const isUrgent = remaining <= 60;
                    return (
                      <div className="absolute top-4 sm:top-5 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md border border-white/20 shadow-2xl text-white px-3 py-1.5 sm:px-5 sm:py-2 rounded-full font-mono text-sm sm:text-base font-bold z-30 flex items-center justify-center min-w-[80px] sm:min-w-[110px] gap-1.5 tabular-nums">
                        <Clock size={15} className={isUrgent ? 'text-red-400 animate-pulse' : 'text-white'} />
                        <span className={isUrgent ? 'text-red-400' : ''}>
                          {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Participants badge */}
                  {isCallReady && (
                    <div className="absolute top-4 right-4 hidden sm:flex items-center gap-1.5 z-30">
                      {participants.slice(0, 3).map((p, i) => {
                        const colors = ['bg-purple-600','bg-indigo-600','bg-violet-600'];
                        return (
                          <div key={i} title={p.identity || '?'}
                            className={`w-8 h-8 rounded-full ${colors[i % colors.length]} ring-2 ring-offset-1 ring-offset-black/50 flex items-center justify-center text-xs font-bold text-white shadow-lg backdrop-blur`}>
                            {p.identity?.[0]?.toUpperCase() || '?'}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Graceful exit overlay — shown when time is up, waits for agent to finish */}
                  {isTimeUp && (
                    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm">
                      <div className="bg-gray-900/90 border border-purple-500/40 rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-2xl max-w-xs mx-4 text-center">
                        {isAgentSpeaking ? (
                          <>
                            <div className="flex gap-1.5 items-center mb-1">
                              {[0,1,2].map(i => (
                                <span key={i} className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                              ))}
                            </div>
                            <p className="text-white font-semibold text-sm">Aguardando o avatar terminar...</p>
                            <p className="text-gray-400 text-xs">A sessão encerrará em instantes</p>
                          </>
                        ) : gracePeriodCountdown !== null ? (
                          <>
                            <div className="text-5xl font-black text-purple-400 font-mono leading-none">{gracePeriodCountdown}</div>
                            <p className="text-white font-semibold text-sm">Encerrando sessão...</p>
                            <p className="text-gray-400 text-xs">Sessão será salva automaticamente</p>
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Self camera preview (bottom-left) */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute bottom-20 left-3 z-30 hidden sm:block"
                    style={{ width: 140, height: 98 }}
                  >
                    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border border-purple-500/40 bg-gray-900">
                      <video ref={localVideoRef} autoPlay muted playsInline
                        className="w-full h-full object-cover"
                        style={{ display: cameraOn ? 'block' : 'none', transform: 'scaleX(-1)' }}
                      />
                      {!cameraOn && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 gap-1">
                          <div className="w-9 h-9 rounded-full bg-purple-700/80 flex items-center justify-center">
                            <User className="w-4 h-4 text-purple-200" />
                          </div>
                          <span className="text-gray-500 text-[9px] font-medium">{t('voiceChat.cameraOff')}</span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1">
                        <span className="text-white text-[9px] font-semibold truncate block">{user?.name || 'Você'}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Live subtitle */}
                  {isCallReady && !showChatPanel && (agentTranscript || userTranscript) && (
                    <div className="absolute bottom-20 left-3 right-3 sm:left-auto sm:bottom-24 sm:right-4 sm:max-w-xs max-h-24 overflow-y-auto bg-black/50 backdrop-blur-md text-white text-xs px-3 py-2.5 rounded-xl z-30 border border-white/10">
                      <div className="font-semibold text-purple-300 mb-0.5">{t('voiceChat.agent')}</div>
                      <div className="text-white/90 leading-relaxed">{agentTranscript || '...'}</div>
                      {userTranscript && (
                        <>
                          <div className="font-semibold text-cyan-300 mt-1.5 mb-0.5">{t('voiceChat.you')}</div>
                          <div className="text-white/70 leading-relaxed">{userTranscript}</div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── Control bar ── */}
                  {!showSpinner && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-4 sm:bottom-5 z-40">
                    <div className="flex items-center gap-2 bg-gray-950/80 backdrop-blur-xl border border-white/10 rounded-full px-3 py-2.5 sm:px-4 sm:py-3 shadow-2xl">

                      {/* Mic */}
                      <button onClick={handleToggleMic} title={micOn ? 'Mute' : 'Unmute'}
                        className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
                          micOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 hover:bg-red-400 text-white'
                        }`}>
                        {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                      </button>

                      {/* Camera */}
                      <button onClick={cameraOn ? closeCamera : openCamera} title={cameraOn ? 'Desligar câmera' : 'Ligar câmera'}
                        className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full hidden sm:flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
                          cameraOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/10 hover:bg-white/20 text-white/50'
                        }`}>
                        {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                      </button>

                      <div className="hidden sm:block w-px h-7 bg-white/15 mx-1" />

                      {/* Transcript toggle */}
                      <button onClick={() => setShowChatPanel(!showChatPanel)} title={showChatPanel ? 'Fechar transcrição' : 'Ver transcrição'}
                        className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
                          showChatPanel ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}>
                        <MessageSquare className="w-5 h-5" />
                        {sessionHistory.length > 0 && !showChatPanel && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-purple-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                            {sessionHistory.length > 9 ? '9+' : sessionHistory.length}
                          </span>
                        )}
                      </button>

                      {/* Fullscreen toggle */}
                      <button onClick={toggleFullscreen} title={isFullscreen ? 'Sair do fullscreen' : 'Expandir'}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95">
                        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                      </button>

                      <div className="hidden sm:block w-px h-7 bg-white/15 mx-1" />

                      {/* Hang up */}
                      <button onClick={handleDisconnect} title="Encerrar chamada"
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-900/40 transition-all duration-200 hover:scale-105 active:scale-95">
                        <PhoneOff className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  )}

                  {/* Transcript side panel */}
                  <AnimatePresence>
                    {showChatPanel && (
                      <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-gray-950/90 backdrop-blur-lg border-l border-white/10 z-50 flex flex-col shadow-2xl"
                      >
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bot size={16} className="text-purple-400" />
                            <span className="font-semibold text-white text-sm">Transcrição</span>
                          </div>
                          <button onClick={() => setShowChatPanel(false)}
                            className="w-9 h-9 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center">
                            <X size={16} />
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {sessionHistory.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 text-xs">
                              <History size={22} className="mb-2 opacity-50" />
                              <p>Nenhuma mensagem ainda.</p>
                            </div>
                          ) : (
                            sessionHistory.map((msg, index) => {
                              const isUser = msg.role === 'user';
                              return (
                                <div key={index} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                  <span className="text-[10px] text-gray-400 mb-1 px-1">
                                    {isUser ? t('voiceChat.you') : t('voiceChat.agent')}
                                  </span>
                                  <div className={`rounded-2xl px-3.5 py-2 text-sm max-w-[85%] leading-relaxed ${
                                    isUser ? 'bg-[#9333ea] text-white rounded-tr-none' : 'bg-white/10 text-gray-100 rounded-tl-none'
                                  }`}>
                                    {msg.text}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              )}

              {/* ── LOADING SPINNER (connecting, before avatar ready) ── */}
              <AnimatePresence>
                {showSpinner && !isConnected && (
                  <motion.div
                    key="spinner-idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--bg-base)]/80 backdrop-blur-sm"
                  >
                    <ConnectingSpinner />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
      </div>

      {/* MODALS (Global) */}
      {/* Points Modal */}
      {activeModal === "points" && createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[150] p-4 md:pl-[240px]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                {t('voiceChat.progress')}
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="text-5xl font-bold text-purple-600 mb-2">
                  {userPoints}
                </div>
                <div className="text-gray-600">{t('voiceChat.totalPoints')}</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-purple-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-purple-700">12</div>
                  <div className="text-sm text-gray-600">{t('voiceChat.level')}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-green-700">8</div>
                  <div className="text-sm text-gray-600">{t('voiceChat.conversationsToday')}</div>
                </div>
              </div>
              <div className="text-center text-sm text-gray-500">
                {t('voiceChat.practiceTime')}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Audio Settings Modal */}
      {activeModal === "audio" && createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[150] p-4 md:pl-[240px]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                {t('voiceChat.settings')}
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">{t('voiceChat.enableSound')}</span>
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${ttsEnabled ? "bg-purple-600" : "bg-gray-300"}`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${ttsEnabled ? "translate-x-6" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
              <hr />
              <p className="text-sm text-gray-600">
                {t('voiceChat.moreSettings')}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

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

      {/* History Panel Modal */}
      {showHistory && createPortal(
        <div
          className={`fixed inset-0 bg-black/60 flex items-center justify-center z-[150] ${historyFullscreen ? "p-0 md:pl-[240px]" : "p-4 md:pl-[240px]"}`}
        >
          <div
            className={`bg-white shadow-2xl w-full flex flex-col overflow-hidden ${historyFullscreen ? "h-full rounded-2xl" : "rounded-2xl max-w-2xl min-h-[50vh] max-h-[90vh]"}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">
                <span className="sm:hidden">{t('chat.historyShortTitle', { defaultValue: 'Histórico' })}</span>
                <span className="hidden sm:inline">{t('chat.historyTitle')}</span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHistoryFullscreen(!historyFullscreen)}
                  className="w-10 h-10 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
                  title={
                    historyFullscreen ? t('voiceChat.exitFullscreen') : t('voiceChat.fullscreen')
                  }
                >
                  {historyFullscreen ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-10 h-10 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar flex-grow">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : historyConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                  <History className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="font-medium">
                    {t('chat.noHistory', { defaultValue: 'Nenhuma conversa ainda.' })}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {t('chat.historyWillAppear', { defaultValue: 'O histórico aparecerá aqui...' })}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyConversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="border rounded-xl p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className="flex items-center justify-between cursor-pointer"
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
                            <span className="font-bold text-gray-800 capitalize">
                              {conv.scenario.replace(/-/g, " ")}
                            </span>
                            <span className="text-xs text-gray-400">
                              • {formatDate(conv.started_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDuration(conv.duration_seconds)}
                            </span>
                            <span>
                              • {conversationMessages[conv.id]?.length ?? conv.message_count ?? 0}{" "}
                              {t('chat.messagesCount', { defaultValue: 'mensagens' })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(t('chat.downloadComingSoon'));
                            }}
                            className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
                            title={t('chat.downloadPdf', { defaultValue: 'Baixar PDF' })}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" />
                            </svg>
                          </button>
                          <ChevronRight
                            className={`w-5 h-5 text-gray-400 transition-transform ${expandedConversationId === conv.id ? "rotate-90" : ""}`}
                          />
                        </div>
                      </div>

                      {/* Expanded Messages */}
                      {expandedConversationId === conv.id && (
                        <div className="mt-4 pt-4 border-t space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                          {conversationMessages[conv.id]?.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-4 italic">
                              {t('chat.noMessages', { defaultValue: 'Sem mensagens nesta conversa.' })}
                            </p>
                          ) : (
                            conversationMessages[conv.id]?.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                              >
                                <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                                  {msg.role === "user" ? t('voiceChat.you') : t('voiceChat.agent')}
                                </span>
                                <div
                                  className={`p-3 rounded-2xl max-w-[85%] text-sm ${msg.role === "user" ? "bg-purple-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"}`}
                                >
                                  <p className="whitespace-pre-wrap">
                                    {msg.content}
                                  </p>
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
        </div>,
        document.body
      )}

      {/* ── SESSION SUMMARY MODAL ── */}
      {sessionSummary && (
        <SessionSummaryModal
          xpGained={sessionSummary.xp}
          durationSeconds={sessionSummary.duration}
          isVoice={true}
          isAvatar={true}
          currentLevel={level}
          currentXp={totalXp}
          xpToNextLevel={xpToNextLevel}
          onDismiss={() => {
            setSessionSummary(null);
            setSessionHistory([]);
          }}
        />
      )}
      <EntitlementPaywallModal
        decision={blockedEntitlement}
        onClose={() => setBlockedEntitlement(null)}
      />
    </>
  );
};

export default VoiceChatUI;
