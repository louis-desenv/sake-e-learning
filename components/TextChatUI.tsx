/**
 * Text Chat UI Component
 *
 * Chat interface for text-based conversations with the AI tutor.
 * Supports scenario-based conversations with message history.
 *
 * @fileoverview This component provides a complete chat interface with message
 * history, loading states, and scenario-specific prompts. It handles user input,
 * API communication, and automatic scrolling.
 *
 * @dependencies react, ../services/geminiService, ../types, ../src/prompts/builders/promptBuilder
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { sendChatMessage, getConversationFeedback, generateCustomWelcomeMessage, generateWelcomeMessage, getLocalWelcomeFallback } from '../services/geminiService';
import { ChatScenario, MessageWithCorrections } from '../types';
import { getWelcomeMessage } from '../src/prompts/builders/promptBuilder';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseCorrectionsFromResponse } from '../utils/correctionParser';
import { Sparkles, ArrowRight, Lightbulb, Volume2, VolumeX, Mic, MicOff, Send, Loader2, Brain, History, X, ChevronRight, Clock, Star, PartyPopper, Trophy, ChevronDown, ChevronUp, CircleHelp, Lock, Crown, MessageSquare, AlertTriangle } from 'lucide-react';
import { conversationService, Conversation, Message } from '../services/conversationService';
import { contextService } from '../services/contextService';
import { adaptationService } from '../services/adaptationService';
import { useUser } from '../context/UserContext';
import { EntitlementDecision, useEntitlements } from '../hooks/useEntitlements';
import { EntitlementPaywallModal } from './access/EntitlementPaywallModal';
import {
  TTSService,
  TTSVoice,
  TTSConfig,
  TTSServiceFactory,
  getServiceName,
} from '../services/tts';
import { TopicSlugConfig } from '../constants/topicSlugs';
import { useChatSession } from '../gamification/hooks/useChatSession';
import { useGamification } from '../gamification/hooks/useGamification';
import SessionSummaryModal from '../gamification/components/SessionSummaryModal';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

/**
 * TTS Service Support:
 * - Web Speech API: Browser's built-in TTS (always available)
 * - ElevenLabs: Cloud-based TTS with high-quality voices (requires API key)
 */

// ============================================================================
// CONSTANTS
// ============================================================================

// Helper to strip translations (e.g. for TTS or alternate clean view)
export function stripTranslations(text: string): string {
  return text.replace(/\s*\([^)]+\)/g, '').replace(/\*\*/g, '').trim();
}

interface TextSegment {
  text: string;
  translation?: string;
}

const SettingsTooltip: React.FC<{ text: string }> = ({ text }) => (
  <span className="relative inline-flex group">
    <button
      type="button"
      className="text-gray-400 hover:text-gray-600 focus:text-gray-600 focus:outline-none"
      aria-label={text}
    >
      <CircleHelp className="w-4 h-4" />
    </button>
    <span
      role="tooltip"
      className="pointer-events-none absolute left-1/2 bottom-full z-20 mb-2 w-64 -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-xs font-normal leading-relaxed text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
    >
      {text}
      <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
    </span>
  </span>
);

// Parses text with parenthesized translations into structured segments
export function parseTranslations(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /([^()]+)\s*\(([^)]+)\)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.substring(lastIndex, match.index).replace(/\*\*/g, '') });
    }

    segments.push({
      text: match[1].replace(/\*\*/g, ''),
      translation: match[2].replace(/\*\*/g, '')
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.substring(lastIndex).replace(/\*\*/g, '') });
  }

  return segments;
}

// Avatar URLs
const LOUIS_AVATAR_URL = '/avatars/tutor-avatar.jpg'; // Foto do LinkedIn
const SARAH_AVATAR_URL = 'https://i.pravatar.cc/150?img=47';

// Fixed ElevenLabs voices (FREE voices - not library voices)
const ELEVENLABS_VOICE_LOUIS = {
  id: 'ErXwobaYiN019PkySvjV', // Antoni (free voice)
  name: 'Antoni',
  language: 'en',
  service: TTSService.ELEVENLABS,
  metadata: { gender: 'male', accent: 'american' },
};

const ELEVENLABS_VOICE_SARAH = {
  id: '21m00Tcm4TlvDq8ikWAM', // Rachel (free voice)
  name: 'Rachel',
  language: 'en',
  service: TTSService.ELEVENLABS,
  metadata: { gender: 'female', accent: 'american' },
};

const GOOGLE_VOICE_LOUIS = {
  id: 'en-US-Chirp3-HD-Achird', // Achird (US Male Premium)
  name: 'Adam (US Male)',
  language: 'en-US',
  service: TTSService.GOOGLE_CLOUD,
  metadata: { gender: 'male', accent: 'american' },
};

const GOOGLE_VOICE_SARAH = {
  id: 'en-US-Chirp3-HD-Achernar', // Achernar (US Female Premium)
  name: 'Bella (US Female)',
  language: 'en-US',
  service: TTSService.GOOGLE_CLOUD,
  metadata: { gender: 'female', accent: 'american' },
};

// Google Cloud Brazilian Portuguese voices — used for feedback TTS in pt-BR
const GOOGLE_VOICE_PT_FEMALE = {
  id: 'pt-BR-Neural2-F', // Lower-latency neural voice for feedback playback
  name: 'Sofia (BR Female)',
  language: 'pt-BR',
  service: TTSService.GOOGLE_CLOUD,
  metadata: { gender: 'female', accent: 'brazilian' },
};

const GOOGLE_VOICE_PT_MALE = {
  id: 'pt-BR-Neural2-B', // Lower-latency neural voice for feedback playback
  name: 'Mateus (BR Male)',
  language: 'pt-BR',
  service: TTSService.GOOGLE_CLOUD,
  metadata: { gender: 'male', accent: 'brazilian' },
};

// Fixed Web Speech voices (will be dynamically selected from available voices)
// These are fallback defaults - actual voices will be selected based on availability
const WEB_SPEECH_MALE_DEFAULT = 'Google US English'; // Common male voice name
const WEB_SPEECH_FEMALE_DEFAULT = 'Google US English Female'; // Common female voice name

const MAX_HISTORY_MESSAGES = 10;
const FEEDBACK_TRIGGER_USER_MESSAGES = 6;
const FEEDBACK_HISTORY_MESSAGES = 12;
const SCENARIO_GENERATION_MIN_USER_MESSAGES = 10;
const FREE_TEXT_DAILY_MESSAGE_LIMIT = 10;
const STANDARD_TEXT_DAILY_MESSAGE_LIMIT = 100;
const PRO_TEXT_DAILY_MESSAGE_LIMIT = 500;
const TEXT_MESSAGE_UNITS_PER_EXCHANGE = 1;
const TEXT_USAGE_ALERT_THRESHOLDS = [100, 90, 80, 50] as const;
const WELCOME_FALLBACK_DELAY_MS = 3500;
const TRANSCRIPTION_TIMEOUT_MS = 30000;
const TRANSCRIPTION_MODEL = 'gemini-3-flash-preview';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const getResetCountdownLabel = (): string => {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setDate(now.getDate() + 1);
  nextMidnight.setHours(0, 0, 0, 0);

  const totalSeconds = Math.max(0, Math.floor((nextMidnight.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
};

const formatMessageUsageLabel = (used: number, limit: number, language: string): string => {
  const labelFor = (value: number) => {
    if (language === 'en') {
      return `${value} ${value === 1 ? 'message' : 'messages'}`;
    }

    return `${value} ${value === 1 ? 'mensagem' : 'mensagens'}`;
  };

  return `${labelFor(used)} / ${labelFor(limit)}`;
};

const detectQuestion = (text: string): boolean => {
  const trimmed = text.trim().toLowerCase();
  
  // Se o texto já termina com '?', é uma pergunta
  if (trimmed.endsWith('?')) return true;
  
  // Lista abrangente de palavras de pergunta em Inglês e Português
  const questionWords = [
    // English
    'what', 'where', 'who', 'how', 'why', 'when', 'which', 'whose', 'whom',
    'can', 'could', 'would', 'should', 'will', 'shall', 'may', 'might',
    'do', 'does', 'did', 'is', 'are', 'am', 'was', 'were', 'has', 'have', 'had',
    "isn't", "aren't", "don't", "doesn't", "didn't", "can't", "won't",
    // Portuguese
    'como', 'quem', 'onde', 'quando', 'qual', 'quais', 'quanto', 'quanta', 'quantos', 'quantas',
    'por que', 'porque', 'porquê', 'será', 'sera', 'está', 'esta', 'tem', 'há', 'ha', 'é', 'eh',
    'ne', 'né', 'não é'
  ];

  // Divide o texto em palavras limpas
  const words = trimmed.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').split(/\s+/);
  
  // 1. Se a primeira palavra for um iniciador de pergunta
  if (words.length > 0 && questionWords.includes(words[0])) {
    return true;
  }

  // 2. Se contiver termos clássicos de pergunta no meio do texto
  const questionPhrases = [
    'how are you', 'how is', 'what is', 'what are', 'where is', 'where are',
    'are you', 'is it', 'do you', 'can you', 'should we', 'would you',
    'não é', 'sim ou não', 'yes or no', 'is there', 'are there', 'right?'
  ];
  for (const phrase of questionPhrases) {
    if (trimmed.includes(phrase)) return true;
  }

  // 3. Se contiver palavras interrogativas após uma conjunção ou pausa (ex: "hello, how are you")
  const midQuestionWords = [
    'how', 'what', 'why', 'where', 'who', 'when',
    'como', 'onde', 'porque', 'por que', 'quem', 'quando', 'qual'
  ];
  for (const qw of midQuestionWords) {
    const regex = new RegExp(`\\b${qw}\\b`);
    if (regex.test(trimmed)) {
      // Exclui casos declarativos comuns
      const isNegativeContext = 
        trimmed.includes(`know ${qw}`) || 
        trimmed.includes(`sei ${qw}`) ||
        trimmed.includes(`show ${qw}`) ||
        trimmed.includes(`mostrar ${qw}`) ||
        trimmed.includes(`explain ${qw}`) ||
        trimmed.includes(`explicar ${qw}`);
      
      if (!isNegativeContext) {
        return true;
      }
    }
  }

  return false;
};

const addPunctuation = (text: string): string => {
  let trimmed = text.trim();
  if (!trimmed) return '';

  // Garante a primeira letra maiúscula da sentença
  trimmed = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

  // Capitaliza a primeira letra de cada frase subsequente (após . ? !)
  trimmed = trimmed.replace(/([.!?]\s+)([a-z])/g, (match, separator, char) => {
    return separator + char.toUpperCase();
  });

  // Remove pontuação final genérica temporariamente para reformatar
  const endsWithPunct = /[.!?]$/.test(trimmed);
  let baseText = trimmed;
  if (endsWithPunct) {
    baseText = trimmed.slice(0, -1).trim();
  }

  if (detectQuestion(trimmed)) {
    return baseText + '?';
  }
  
  // Se já tinha pontuação original válida e não é pergunta, mantém
  if (endsWithPunct) {
    return trimmed;
  }
  
  return baseText + '.';
};

const audioBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const getRecentHistory = (messages: MessageWithCorrections[], limit: number): string[] => {
  return messages.slice(-limit).map(
    (m) => `${m.sender === 'user' ? 'User' : 'Tutor'}: ${m.text}`
  );
};

const getLocalDateKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTextDailyUsageKey = (userId: string): string => `sakae_text_chat_daily_usage:${userId}`;

const readTextDailyUsage = (userId: string): { date: string; used: number } => {
  const today = getLocalDateKey();
  if (typeof window === 'undefined') return { date: today, used: 0 };

  try {
    const raw = window.localStorage.getItem(getTextDailyUsageKey(userId));
    if (!raw) return { date: today, used: 0 };

    const parsed = JSON.parse(raw) as { date?: string; used?: number };
    if (parsed.date !== today) return { date: today, used: 0 };

    return {
      date: today,
      used: Math.max(0, Number(parsed.used) || 0),
    };
  } catch {
    return { date: today, used: 0 };
  }
};

const writeTextDailyUsage = (userId: string, used: number): { date: string; used: number } => {
  const usage = { date: getLocalDateKey(), used };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(getTextDailyUsageKey(userId), JSON.stringify(usage));
  }
  return usage;
};

const getTextLimitFallback = (plan?: string | null, isTrial?: boolean): number | null => {
  if (isTrial) return PRO_TEXT_DAILY_MESSAGE_LIMIT;

  switch ((plan || '').toLowerCase()) {
    case 'standard':
      return STANDARD_TEXT_DAILY_MESSAGE_LIMIT;
    case 'pro':
      return PRO_TEXT_DAILY_MESSAGE_LIMIT;
    case 'super':
    case 'top':
      return null;
    default:
      return FREE_TEXT_DAILY_MESSAGE_LIMIT;
  }
};

const getUsageNoticeStorageKey = (userId: string, threshold: number): string =>
  `sakae_text_usage_notice:${userId}:${getLocalDateKey()}:${threshold}`;

const TEXT_USAGE_NOTICES_ENABLED_KEY = 'sakae_text_usage_notices_enabled';

// ============================================================================
// COLOR MAPPING FOR THEMATIC UI
// ============================================================================

/**
 * Maps topic progress colors to themed Tailwind classes.
 * This ensures Tailwind includes all color variants in the build.
 */
const COLOR_MAP: Record<string, {
  text: string;          // Icon color (e.g., 'text-blue-500')
  bgLight: string;       // Light background (e.g., 'bg-blue-50')
  border: string;        // Border color (e.g., 'border-blue-400')
  focusRing: string;     // Focus ring (e.g., 'focus:ring-blue-100')
}> = {
  'bg-blue-500': {
    text: 'text-blue-500',
    bgLight: 'bg-blue-50',
    border: 'border-blue-400',
    focusRing: 'focus:ring-blue-100',
  },
  'bg-blue-400': {
    text: 'text-blue-500',
    bgLight: 'bg-blue-50',
    border: 'border-blue-400',
    focusRing: 'focus:ring-blue-100',
  },
  'bg-green-500': {
    text: 'text-green-500',
    bgLight: 'bg-green-50',
    border: 'border-green-400',
    focusRing: 'focus:ring-green-100',
  },
  'bg-green-400': {
    text: 'text-green-500',
    bgLight: 'bg-green-50',
    border: 'border-green-400',
    focusRing: 'focus:ring-green-100',
  },
  'bg-purple-500': {
    text: 'text-purple-500',
    bgLight: 'bg-purple-50',
    border: 'border-purple-400',
    focusRing: 'focus:ring-purple-100',
  },
  'bg-purple-400': {
    text: 'text-purple-500',
    bgLight: 'bg-purple-50',
    border: 'border-purple-400',
    focusRing: 'focus:ring-purple-100',
  },
  'bg-orange-500': {
    text: 'text-orange-500',
    bgLight: 'bg-orange-50',
    border: 'border-orange-400',
    focusRing: 'focus:ring-orange-100',
  },
  'bg-orange-400': {
    text: 'text-orange-500',
    bgLight: 'bg-orange-50',
    border: 'border-orange-400',
    focusRing: 'focus:ring-orange-100',
  },
  'bg-yellow-400': {
    text: 'text-yellow-500',
    bgLight: 'bg-yellow-50',
    border: 'border-yellow-400',
    focusRing: 'focus:ring-yellow-100',
  },
  'bg-red-400': {
    text: 'text-red-500',
    bgLight: 'bg-red-50',
    border: 'border-red-400',
    focusRing: 'focus:ring-red-100',
  },
  'bg-indigo-400': {
    text: 'text-indigo-500',
    bgLight: 'bg-indigo-50',
    border: 'border-indigo-400',
    focusRing: 'focus:ring-indigo-100',
  },
};

/**
 * Gets themed color classes for a topic configuration.
 * Falls back to blue if no topic config or color not found.
 */
const getThemedColors = (topicConfig?: TopicSlugConfig) => {
  if (!topicConfig?.progressColor) {
    return COLOR_MAP['bg-blue-500'];
  }
  return COLOR_MAP[topicConfig.progressColor] || COLOR_MAP['bg-blue-500'];
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TextChatUIProps {
  scenario?: ChatScenario;
  topicConfig?: TopicSlugConfig;
  backTo?: string;
  customSystemPrompt?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

// Helper function to get consistent user ID
const getUserId = (user: { id?: string; name?: string } | null): string => {
  if (!user) return 'guest';
  return user.id || user.name || 'guest';
};

const TextChatUI: React.FC<TextChatUIProps> = ({ scenario, topicConfig, backTo, customSystemPrompt }) => {
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const { status: entitlementStatus, loading: entitlementLoading, consume: consumeEntitlement } = useEntitlements();
  const userId = getUserId(user);

  // Gamification — track session time and award XP on unmount
  const { addXp, level, totalXp, xpToNextLevel, currentLevelXp, levelXpRange } = useGamification();
  const topicId = topicConfig?.id ?? scenario?.toString() ?? 'unknown';
  const [sessionSummary, setSessionSummary] = useState<{ xp: number; duration: number } | null>(null);
  useChatSession({
    userId,
    topicId,
    onSessionEnd: (xpGained, durationSeconds) => {
      // ✅ FIX B2: onSessionEnd APENAS mostra o modal de resumo.
      // O addXp já foi chamado incrementalmente via onXpGainProgress (incluindo o finalDelta).
      // Chamar addXp aqui também causaria dupla contagem do XP final.
      if (durationSeconds > 0) {
        setSessionSummary({ xp: xpGained, duration: durationSeconds });
      }
    },
    onXpGainProgress: (deltaXp) => {
      // Único lugar onde o XP é creditado — em tempo real a cada 5s
      if (deltaXp > 0) {
        const isScenario = !!scenario;
        addXp(deltaXp, {
          type: isScenario ? 'real-life' : 'learn',
          label: isScenario ? 'Progresso Real-Life' : 'Progresso de Estudo',
          reason: 'Ganhou XP incremental ao interagir ativamente em inglês.'
        });
      }
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<MessageWithCorrections[]>([]);

  const isFreeUser = !user?.activePlan && !user?.isInTrial;
  const feedbackAvailable = !isFreeUser;

  const [dailyTextUsage, setDailyTextUsage] = useState(() => readTextDailyUsage(userId));
  const [blockedEntitlement, setBlockedEntitlement] = useState<EntitlementDecision | null>(null);
  const [paywallModalDecision, setPaywallModalDecision] = useState<EntitlementDecision | null>(null);
  const [usageNotice, setUsageNotice] = useState<{ threshold: number; message: string; tone: 'info' | 'warning' | 'danger' } | null>(null);
  const textEntitlement = entitlementStatus?.features?.text_chat;
  const isBackendTextBlocked = Boolean(textEntitlement && textEntitlement.status !== 'allowed');
  const isLimitReached = isBackendTextBlocked || (blockedEntitlement?.feature === 'text_chat' && blockedEntitlement.status !== 'allowed');
  const [resetCountdownLabel, setResetCountdownLabel] = useState(getResetCountdownLabel);
  const fallbackTextLimit = getTextLimitFallback(user?.activePlan?.type, user?.isInTrial);
  const textUsageLimit = textEntitlement?.limit ?? (blockedEntitlement?.feature === 'text_chat' ? blockedEntitlement.limit : fallbackTextLimit);
  const textUsageUsed = Math.max(
    0,
    dailyTextUsage.used,
    textEntitlement?.used ?? 0,
    blockedEntitlement?.feature === 'text_chat' ? blockedEntitlement.used : 0,
  );
  const displayTextUsageUsed = textUsageLimit === null ? textUsageUsed : Math.min(textUsageUsed, textUsageLimit);
  const textUsagePercent = textUsageLimit && textUsageLimit > 0
    ? Math.min(100, Math.round((displayTextUsageUsed / textUsageLimit) * 100))
    : 0;
  const textUsageLabel = textUsageLimit === null
    ? t('plansPage.unlimited', { defaultValue: 'Ilimitado' })
    : formatMessageUsageLabel(displayTextUsageUsed, textUsageLimit, i18n.language);
  const textUsageCompactLabel = textUsageLimit === null
    ? t('plansPage.unlimited', { defaultValue: 'Ilimitado' })
    : `${displayTextUsageUsed}/${textUsageLimit}`;
  const textUsagePercentLabel = `${textUsagePercent}%`;
  const textUsageProgressColor = textUsagePercent >= 100
    ? '#ef4444'
    : textUsagePercent >= 90
      ? '#f97316'
      : textUsagePercent >= 80
        ? '#f59e0b'
        : 'var(--accent-teal)';
  const getTextLimitDecision = useCallback((): EntitlementDecision => {
    const backendDecision = entitlementStatus?.features?.text_chat;
    if (backendDecision) return backendDecision;
    const fallbackLimit = getTextLimitFallback(user?.activePlan?.type, user?.isInTrial);
    const status = fallbackLimit !== null && dailyTextUsage.used >= fallbackLimit ? 'quota_exhausted' : 'allowed';
    return {
      feature: 'text_chat',
      plan: user?.activePlan?.type || (user?.isInTrial ? 'trial' : 'free'),
      status,
      limit: fallbackLimit,
      used: dailyTextUsage.used,
      remaining: fallbackLimit === null ? null : Math.max(0, fallbackLimit - dailyTextUsage.used),
      resetAtUtc: null,
      requiredPlan: 'standard',
      reasonCode: status === 'quota_exhausted' ? 'daily_limit_reached' : 'allowed',
      paywall: {
        title: t('paywall.limitReached', { defaultValue: 'Limite diario atingido' }),
        message: t('paywall.textChatLockedInline', {
          limit: fallbackLimit ?? FREE_TEXT_DAILY_MESSAGE_LIMIT,
          defaultValue: 'Seu limite de chat de texto acabou por hoje. Ele renova no reset diario, ou voce pode fazer upgrade para continuar agora.',
        }),
        ctaLabel: t('paywall.upgradeToPro', { defaultValue: 'Fazer upgrade para praticar mais' }),
        targetPlan: 'standard',
        canRetryAfterReset: true,
      },
    };
  }, [dailyTextUsage.used, entitlementStatus?.features?.text_chat, t, user?.activePlan?.type, user?.isInTrial]);
  const [isWelcomeLoading, setIsWelcomeLoading] = useState(true);
  const [correctionsEnabled, setCorrectionsEnabled] = useState(true);
  const effectiveCorrectionsEnabled = correctionsEnabled && feedbackAvailable;
  const [isLoading, setIsLoading] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [translationMode, setTranslationMode] = useState<'hover' | 'inline' | 'hidden'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sakae_translation_mode');
      if (saved === 'hover' || saved === 'inline' || saved === 'hidden') {
        return saved;
      }
    }
    return 'hover';
  });
  const [usageNoticesEnabled, setUsageNoticesEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(TEXT_USAGE_NOTICES_ENABLED_KEY) !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('sakae_translation_mode', translationMode);
  }, [translationMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TEXT_USAGE_NOTICES_ENABLED_KEY, String(usageNoticesEnabled));
    }
  }, [usageNoticesEnabled]);

  useEffect(() => {
    setDailyTextUsage(readTextDailyUsage(userId));
    const intervalId = window.setInterval(() => {
      setDailyTextUsage(readTextDailyUsage(userId));
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [userId]);

  useEffect(() => {
    const textDecision = entitlementStatus?.features?.text_chat;
    if (!textDecision || !isFreeUser) return;

    const nextUsage = writeTextDailyUsage(
      userId,
      Math.max(0, textDecision.used),
    );
    setDailyTextUsage(nextUsage);
  }, [entitlementStatus?.features?.text_chat?.used, isFreeUser, userId]);

  useEffect(() => {
    if (!textEntitlement || textEntitlement.status === 'allowed') return;
    setBlockedEntitlement(textEntitlement);
  }, [textEntitlement]);

  useEffect(() => {
    if (!isLimitReached) return;

    setResetCountdownLabel(getResetCountdownLabel());
    const intervalId = window.setInterval(() => {
      setResetCountdownLabel(getResetCountdownLabel());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isLimitReached]);

  useEffect(() => {
    if (!usageNoticesEnabled || typeof window === 'undefined' || textUsageLimit === null || textUsageLimit <= 0 || textUsagePercent <= 0) {
      return;
    }

    const threshold = TEXT_USAGE_ALERT_THRESHOLDS.find((value) => textUsagePercent >= value);
    if (!threshold) return;

    const storageKey = getUsageNoticeStorageKey(userId, threshold);
    if (window.localStorage.getItem(storageKey)) return;

    window.localStorage.setItem(storageKey, '1');
    const isEnglish = i18n.language?.startsWith('en');
    const tone = threshold >= 90 ? 'danger' : threshold >= 80 ? 'warning' : 'info';
    const message = threshold >= 100
      ? (isEnglish ? 'Daily text chat limit reached.' : 'Limite diario de chat de texto atingido.')
      : isEnglish
        ? `You used ${threshold}% of today's text chat limit.`
        : `Voce usou ${threshold}% do limite diario de chat de texto.`;

    setUsageNotice({ threshold, message, tone });
    const timer = window.setTimeout(() => setUsageNotice(null), 6500);
    return () => window.clearTimeout(timer);
  }, [i18n.language, textUsageLimit, textUsagePercent, usageNoticesEnabled, userId]);

  const consumeTextMessageQuota = useCallback(async () => {
    const backendDecision = await consumeEntitlement('text_chat', TEXT_MESSAGE_UNITS_PER_EXCHANGE);
    if (backendDecision) {
      if (backendDecision.status !== 'allowed') {
        setBlockedEntitlement(backendDecision);
        setPaywallModalDecision(backendDecision);
        setDailyTextUsage({
          date: getLocalDateKey(),
          used: backendDecision.used,
        });
        return false;
      }

      const nextUsage = writeTextDailyUsage(
        userId,
        Math.max(backendDecision.used, dailyTextUsage.used),
      );
      setDailyTextUsage(nextUsage);
      return true;
    }

    if (!isFreeUser) {
      return true;
    }

    console.warn('[TextChatUI] Text chat quota could not be verified by the API');
    return false;
  }, [consumeEntitlement, dailyTextUsage.used, isFreeUser, userId]);

  const [expandedFeedback, setExpandedFeedback] = useState<Record<number, boolean>>({});
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

  // Conversation tracking for Supabase
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const conversationStartTime = useRef<Date | null>(null);
  const lastSavedUserMessage = useRef<string>('');
  const lastSavedAiMessage = useRef<string>('');
  const scenarioGenerationAttemptedConversationIdRef = useRef<string | null>(null);

  // Prevent duplicate message sends
  const isSendingRef = useRef(false);

  // TTS States
  const [currentSpeakingId, setCurrentSpeakingId] = useState<number | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [selectedService, setSelectedService] = useState<TTSService>(TTSService.GOOGLE_CLOUD);
  const [webSpeechVoices, setWebSpeechVoices] = useState<TTSVoice[]>([]);
  const [webSpeechMaleVoices, setWebSpeechMaleVoices] = useState<TTSVoice[]>([]);
  const [webSpeechFemaleVoices, setWebSpeechFemaleVoices] = useState<TTSVoice[]>([]);
  const [elevenLabsVoices, setElevenLabsVoices] = useState<TTSVoice[]>([]);
  const [elevenLabsMaleVoices, setElevenLabsMaleVoices] = useState<TTSVoice[]>([]);
  const [elevenLabsFemaleVoices, setElevenLabsFemaleVoices] = useState<TTSVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice | null>(null);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [elevenLabsAvailable, setElevenLabsAvailable] = useState(false);
  const [googleCloudAvailable, setGoogleCloudAvailable] = useState(false);
  const [googleCloudVoices, setGoogleCloudVoices] = useState<TTSVoice[]>([]);
  const [googleCloudMaleVoices, setGoogleCloudMaleVoices] = useState<TTSVoice[]>([]);
  const [googleCloudFemaleVoices, setGoogleCloudFemaleVoices] = useState<TTSVoice[]>([]);

  // Avatar gender state
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('male');

  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Feedback popup states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<{ vocePercebeuIsso: string; euPercebiAlgo: string; proximoDesafio: string; specificCorrections?: any[] } | null>(null);
  const [showModalExamples, setShowModalExamples] = useState(false);
  const [isSpeakingFeedback, setIsSpeakingFeedback] = useState(false);
  const [isTutorResponsePaused, setIsTutorResponsePaused] = useState(false);
  const [autoOpenFeedbackModal, setAutoOpenFeedbackModal] = useState(() => {
    try {
      return localStorage.getItem('sakae_auto_open_feedback_modal') === 'true';
    } catch {
      return false;
    }
  });
  const hasCelebratedActiveFeedbackRef = useRef(false);
  const pendingTutorResponseRef = useRef<{
    message: MessageWithCorrections;
    text: string;
    index: number;
  } | null>(null);
  const releasePendingTutorResponseRef = useRef<() => void>(() => {});

  const getFeedbackTTSOptions = useCallback(() => {
    const langMap: Record<string, string> = { pt: 'pt-BR', es: 'es-ES', en: 'en-US' };
    const language = langMap[i18n.language] ?? i18n.language ?? 'en-US';
    const tutorGender = selectedVoice?.metadata?.gender ?? 'female';
    const voice = language.startsWith('pt')
      ? (tutorGender === 'male' ? GOOGLE_VOICE_PT_MALE : GOOGLE_VOICE_PT_FEMALE)
      : (tutorGender === 'male' ? GOOGLE_VOICE_LOUIS : GOOGLE_VOICE_SARAH);

    return {
      language,
      tutorGender,
      voice,
      config: {
        service: TTSService.GOOGLE_CLOUD,
        voice,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        lang: language,
      } satisfies TTSConfig,
    };
  }, [i18n.language, selectedVoice]);

  const prefetchFeedbackAudio = useCallback((text: string) => {
    if (!googleCloudAvailable) return;

    try {
      const googleService = TTSServiceFactory.create(TTSService.GOOGLE_CLOUD);
      if (!googleService.prefetch) return;

      const { voice, config } = getFeedbackTTSOptions();
      void googleService.prefetch(stripTranslations(text), voice, config)
        .catch((error) => {
          console.warn('[TextChatUI] Feedback TTS prefetch failed:', error);
        });
    } catch (error) {
      console.warn('[TextChatUI] Could not start feedback TTS prefetch:', error);
    }
  }, [getFeedbackTTSOptions, googleCloudAvailable]);

  const generateFeedbackInBackground = useCallback((feedbackMessages: MessageWithCorrections[]) => {
    if (!feedbackAvailable) return;

    const feedbackHistory = getRecentHistory(feedbackMessages, FEEDBACK_HISTORY_MESSAGES);
    const studentLevel = (user as any)?.level || 'Intermediate';

    setIsFeedbackLoading(true);
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Feedback generation timed out')), 20000);
    });

    void Promise.race([
      getConversationFeedback(feedbackHistory, i18n.language, studentLevel),
      timeoutPromise,
    ])
      .then((feedbackData) => {
        if (feedbackData) {
          setActiveFeedback(feedbackData);
          setShowModalExamples(false);
          hasCelebratedActiveFeedbackRef.current = false;
          prefetchFeedbackAudio(
            `${feedbackData.vocePercebeuIsso}. ${feedbackData.euPercebiAlgo}. ${feedbackData.proximoDesafio}`
          );

          if (autoOpenFeedbackModal) {
            setShowFeedbackModal(true);
            hasCelebratedActiveFeedbackRef.current = true;
            confetti({
              particleCount: 120,
              spread: 65,
              origin: { y: 0.6 },
              colors: ['#3b82f6', '#8b5cf6', '#6366f1', '#10b981'],
            });
          }
        } else if (autoOpenFeedbackModal) {
          releasePendingTutorResponseRef.current();
        }
      })
      .catch((error) => {
        console.error('[TextChatUI] Error generating background feedback:', error);
        if (autoOpenFeedbackModal) {
          releasePendingTutorResponseRef.current();
        }
      })
      .finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
        setIsFeedbackLoading(false);
      });
  }, [autoOpenFeedbackModal, feedbackAvailable, i18n.language, prefetchFeedbackAudio, user]);

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    stopSpeech();
    setIsSpeakingFeedback(false);
    setTimeout(() => releasePendingTutorResponseRef.current(), 100);
  };

  // History panel state
  const [showHistory, setShowHistory] = useState(false);
  const [historyFullscreen, setHistoryFullscreen] = useState(false);
  const [historyConversations, setHistoryConversations] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedConversationId, setExpandedConversationId] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Record<string, Message[]>>({});
  const [downloadConfirmation, setDownloadConfirmation] = useState<
    { type: 'current' } | { type: 'history'; conversationId: string } | null
  >(null);

  // RAG Context state
  const [ragContext, setRagContext] = useState<any>(null);
  const [loadingRagContext, setLoadingRagContext] = useState(false);

  // Get scenario string for filtering
  const scenarioString = scenario ? scenario.toString() : (topicConfig?.id || 'real-life');

  // Load RAG context when chat initializes
  useEffect(() => {
    if (userId && scenarioString) {
      loadRAGContext();
    }
  }, [userId, scenarioString]);

  const loadRAGContext = async (): Promise<any | null> => {
    if (!userId) return null;
    setLoadingRagContext(true);
    try {
      const context = await contextService.getRAGContext(userId, scenarioString, undefined, {
        access: {
          plan: user?.activePlan?.type,
          isTrial: user?.isInTrial,
        },
      });
      setRagContext(context);
      console.log('[TextChatUI] RAG Context loaded:', {
        hasProfile: !!context.userProfile,
        recentMessages: context.recentMessages.length,
        previousSummaries: context.previousConversationsSummary.length,
        level: context.learningFocus.currentLevel,
      });
      return context;
    } catch (error) {
      console.error('[TextChatUI] Error loading RAG context:', error);
      return null;
    } finally {
      setLoadingRagContext(false);
    }
  };

  // Load conversations when history panel opens
  useEffect(() => {
    if (showHistory && userId) {
      loadConversationsByScenario();
    }
  }, [showHistory, userId, user?.activePlan?.type, user?.isInTrial, scenarioString]);

  const loadConversationsByScenario = async () => {
    if (!userId) return;
    setLoadingHistory(true);
    try {
      // Get strictly by specific scenario to avoid mixing contexts (e.g. Job Interviews showing in Phone Screen)
      const data = await conversationService.getConversationsByScenario(userId, scenarioString, 20, {
        plan: user?.activePlan?.type,
        isTrial: user?.isInTrial,
      });

      setHistoryConversations(data);
    } catch (error) {
      console.error('[TextChatUI] Error loading history:', error);
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

  // Themed colors based on topic configuration
  const themedColors = useMemo(() => getThemedColors(topicConfig), [topicConfig]);

  // Initialize ElevenLabs and Google Cloud API keys from environment
  useEffect(() => {
    const elevenApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    let bestService = TTSService.WEB_SPEECH;
    
    if (elevenApiKey) {
      TTSServiceFactory.setElevenLabsApiKey(elevenApiKey);
      setElevenLabsAvailable(true);
      bestService = TTSService.ELEVENLABS;
    }
    const googleApiKey = import.meta.env.VITE_GOOGLE_TTS_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY;
    if (googleApiKey) {
      TTSServiceFactory.setGoogleApiKey(googleApiKey);
      setGoogleCloudAvailable(true);
      bestService = TTSService.GOOGLE_CLOUD;
    }
    setSelectedService(bestService);
  }, []);

  // TTS Functions
  const speakText = useCallback(async (text: string, messageId: number) => {
    if (!ttsEnabled || !selectedVoice) {
      console.log('TTS skipped: ttsEnabled=', ttsEnabled, 'selectedVoice=', selectedVoice);
      return;
    }

    // Stop any current speech
    stopSpeech();

    setCurrentSpeakingId(messageId);
    setIsGeneratingSpeech(true);
    setTtsError(null);

    const getVoiceForService = (serviceType: TTSService): TTSVoice | null => {
      if (selectedVoice?.service === serviceType && selectedVoice.id) {
        return selectedVoice;
      }

      if (serviceType === TTSService.GOOGLE_CLOUD) {
        return avatarGender === 'male' ? GOOGLE_VOICE_LOUIS : GOOGLE_VOICE_SARAH;
      }

      if (serviceType === TTSService.ELEVENLABS) {
        return avatarGender === 'male' ? ELEVENLABS_VOICE_LOUIS : ELEVENLABS_VOICE_SARAH;
      }

      const genderVoices = avatarGender === 'male' ? webSpeechMaleVoices : webSpeechFemaleVoices;
      return genderVoices.find(v => v.id) || webSpeechVoices.find(v => v.id) || null;
    };

    const speakWithService = async (serviceType: TTSService, voice: TTSVoice, cleanText: string) => {
      const service = TTSServiceFactory.create(serviceType);
      await service.speak(cleanText, voice, {
        service: serviceType,
        voice,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
      }, {
        onStart: () => {
          setSelectedService(serviceType);
          setSelectedVoice(voice);
          setCurrentSpeakingId(messageId);
        },
        onEnd: () => {
          setCurrentSpeakingId(null);
          setIsGeneratingSpeech(false);
        },
      });
    };

    try {
      const cleanText = stripTranslations(text);
      const serviceOrder = [
        ...(googleCloudAvailable ? [TTSService.GOOGLE_CLOUD] : []),
        ...(elevenLabsAvailable ? [TTSService.ELEVENLABS] : []),
        TTSService.WEB_SPEECH,
      ];

      let lastError: unknown = null;
      for (const serviceType of serviceOrder) {
        const voice = getVoiceForService(serviceType);
        if (!voice?.id) continue;

        try {
          await speakWithService(serviceType, voice, cleanText);
          return;
        } catch (fallbackError) {
          lastError = fallbackError;
          console.warn(`[TextChatUI] ${getServiceName(serviceType)} TTS failed, trying fallback:`, fallbackError);
          stopSpeech();
          setCurrentSpeakingId(messageId);
          setIsGeneratingSpeech(true);
        }
      }

      throw lastError || new Error(t('chat.speechPlaybackFailed'));
    } catch (error) {
      console.error('TTS error:', error);
      setCurrentSpeakingId(null);
      setIsGeneratingSpeech(false);
      setTtsError(error instanceof Error ? error.message : t('chat.speechPlaybackFailed'));
    }
  }, [
    avatarGender,
    elevenLabsAvailable,
    googleCloudAvailable,
    selectedVoice,
    t,
    ttsEnabled,
    webSpeechFemaleVoices,
    webSpeechMaleVoices,
    webSpeechVoices,
  ]);

  const stopSpeech = useCallback(() => {
    try {
      // Stop Web Speech
      const webService = TTSServiceFactory.create(TTSService.WEB_SPEECH);
      webService.stop();
    } catch { }
    try {
      // Stop ElevenLabs if available
      if (elevenLabsAvailable) {
        const elevenService = TTSServiceFactory.create(TTSService.ELEVENLABS);
        elevenService.stop();
      }
    } catch { }
    try {
      // Stop Google Cloud if available
      if (googleCloudAvailable) {
        const googleService = TTSServiceFactory.create(TTSService.GOOGLE_CLOUD);
        googleService.stop();
      }
    } catch { }
    setCurrentSpeakingId(null);
    setIsGeneratingSpeech(false);
    setIsSpeakingFeedback(false);
  }, [elevenLabsAvailable, googleCloudAvailable]);

  const releasePendingTutorResponse = useCallback(() => {
    const pendingResponse = pendingTutorResponseRef.current;
    if (!pendingResponse) return;

    pendingTutorResponseRef.current = null;
    setMessages(previousMessages => [...previousMessages, pendingResponse.message]);
    setIsTutorResponsePaused(false);

    setTimeout(() => {
      if (ttsEnabled) {
        speakText(pendingResponse.text, pendingResponse.index);
      }
    }, 100);
  }, [speakText, ttsEnabled]);

  useEffect(() => {
    releasePendingTutorResponseRef.current = releasePendingTutorResponse;
  }, [releasePendingTutorResponse]);

  // Use a ref to track speaking state to avoid stale closures in handleSpeakFeedback
  const isSpeakingFeedbackRef = useRef(false);

  // High-quality TTS for feedback insights
  const handleSpeakFeedback = useCallback(async (text: string) => {
    if (isSpeakingFeedbackRef.current) {
      // Currently speaking — stop it
      stopSpeech();
      isSpeakingFeedbackRef.current = false;
      setIsSpeakingFeedback(false);
      return;
    }

    stopSpeech();

    isSpeakingFeedbackRef.current = true;
    setIsSpeakingFeedback(true);
    try {
      const cleanText = stripTranslations(text);

      const {
        language: feedbackLang,
        tutorGender,
        voice: googleVoice,
      } = getFeedbackTTSOptions();

      let serviceToUse = TTSService.GOOGLE_CLOUD;
      let voiceToUse = googleVoice;

      // Fallback straight to Web Speech if Google Cloud is not available
      if (!googleCloudAvailable) {
        serviceToUse = TTSService.WEB_SPEECH;
        voiceToUse = {
          id: 'web-speech-fallback',
          name: feedbackLang.startsWith('pt') 
            ? 'Google português do Brasil' 
            : (tutorGender === 'male' ? 'Google US English' : 'Google US English Female'),
          language: feedbackLang,
          service: TTSService.WEB_SPEECH,
          metadata: { gender: tutorGender, accent: feedbackLang.startsWith('pt') ? 'brazilian' : 'american' },
        };
      }

      if (!googleCloudAvailable && elevenLabsAvailable) {
        serviceToUse = TTSService.ELEVENLABS;
        voiceToUse = tutorGender === 'male' ? ELEVENLABS_VOICE_LOUIS : ELEVENLABS_VOICE_SARAH;
      }

      const speakWithService = async (serviceType: TTSService, voiceConfig: any) => {
        const service = TTSServiceFactory.create(serviceType);
        return new Promise<void>((resolve, reject) => {
          service.speak(cleanText, voiceConfig, {
            service: serviceType,
            voice: voiceConfig,
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0,
            lang: feedbackLang,
          }, {
            onStart: () => {
              isSpeakingFeedbackRef.current = true;
              setIsSpeakingFeedback(true);
            },
            onEnd: () => {
              isSpeakingFeedbackRef.current = false;
              setIsSpeakingFeedback(false);
              resolve();
            },
            onError: (err) => {
              reject(err);
            }
          });
        });
      };

      try {
        await speakWithService(serviceToUse, voiceToUse);
      } catch (err) {
        console.warn("Primary feedback TTS failed, trying fallback:", err);
        if (serviceToUse === TTSService.GOOGLE_CLOUD) {
          if (elevenLabsAvailable) {
            const elevenVoice = tutorGender === 'male' ? ELEVENLABS_VOICE_LOUIS : ELEVENLABS_VOICE_SARAH;
            try {
              await speakWithService(TTSService.ELEVENLABS, elevenVoice);
              return;
            } catch (elevenError) {
              console.warn("ElevenLabs feedback TTS fallback failed, falling back to Web Speech:", elevenError);
            }
          }

          // Fallback to Web Speech
          const fallbackVoice = {
            id: 'web-speech-fallback',
            name: feedbackLang.startsWith('pt')
              ? 'Google português do Brasil'
              : (tutorGender === 'male' ? 'Google US English' : 'Google US English Female'),
            language: feedbackLang,
            service: TTSService.WEB_SPEECH,
            metadata: { gender: tutorGender, accent: feedbackLang.startsWith('pt') ? 'brazilian' : 'american' },
          };
          await speakWithService(TTSService.WEB_SPEECH, fallbackVoice);
        } else if (serviceToUse === TTSService.ELEVENLABS) {
          const fallbackVoice = {
            id: 'web-speech-fallback',
            name: feedbackLang.startsWith('pt')
              ? 'Google português do Brasil'
              : (tutorGender === 'male' ? 'Google US English' : 'Google US English Female'),
            language: feedbackLang,
            service: TTSService.WEB_SPEECH,
            metadata: { gender: tutorGender, accent: feedbackLang.startsWith('pt') ? 'brazilian' : 'american' },
          };
          await speakWithService(TTSService.WEB_SPEECH, fallbackVoice);
        } else {
          throw err;
        }
      }
    } catch (error) {
      console.error('Feedback TTS error:', error);
      isSpeakingFeedbackRef.current = false;
      setIsSpeakingFeedback(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getFeedbackTTSOptions, stopSpeech, googleCloudAvailable, elevenLabsAvailable]);

  const loadAllVoices = useCallback(async () => {
    setIsLoadingVoices(true);
    setTtsError(null);
    setVoicesLoaded(false);

    try {
      // Load Web Speech voices
      const webService = TTSServiceFactory.create(TTSService.WEB_SPEECH);
      const webVoices = await webService.getAvailableVoices();

      // Filter to ONLY English voices
      const englishWebVoices = webVoices.filter(v => v.language.startsWith('en'));
      englishWebVoices.sort((a, b) => a.name.localeCompare(b.name));
      setWebSpeechVoices(englishWebVoices);

      // Separate Web Speech voices by gender (using name patterns)
      // Female voices often contain: female, woman, girl, ms, mrs, zira, jennifer, etc.
      // Male voices often contain: male, man, boy, mr, david, daniel, mark, etc.
      const femaleKeywords = ['female', 'woman', 'girl', 'ms', 'mrs', 'zira', 'jennifer', 'samantha', 'karen', 'moira', 'tessa', 'fiona', 'veena', 'alex'];
      const maleKeywords = ['male', 'man', 'boy', 'mr', 'david', 'daniel', 'mark', 'james', 'thomas', 'lee'];

      const webFemaleVoices = englishWebVoices.filter(v => {
        const nameLower = v.name.toLowerCase();
        return femaleKeywords.some(keyword => nameLower.includes(keyword));
      });

      const webMaleVoices = englishWebVoices.filter(v => {
        const nameLower = v.name.toLowerCase();
        return maleKeywords.some(keyword => nameLower.includes(keyword));
      });

      setWebSpeechFemaleVoices(webFemaleVoices);
      setWebSpeechMaleVoices(webMaleVoices);
      console.log('Web Speech male voices:', webMaleVoices.length, 'female voices:', webFemaleVoices.length);

      // Load ElevenLabs voices if API key is configured
      let englishElevenLabsVoices: TTSVoice[] = [];
      if (elevenLabsAvailable) {
        try {
          const elevenService = TTSServiceFactory.create(TTSService.ELEVENLABS);
          const elevenVoices = await elevenService.getAvailableVoices();
          console.log('ElevenLabs raw voices loaded:', elevenVoices.length, elevenVoices.slice(0, 3));

          // ElevenLabs voices - filter only those with valid IDs
          englishElevenLabsVoices = elevenVoices.filter(v => {
            // Must have a valid ID
            if (!v.id) {
              console.warn('ElevenLabs voice without ID:', v);
              return false;
            }
            // Accept English or multilingual voices
            return v.language.startsWith('en') || v.language === 'multilingual' || !v.language || v.language === 'en';
          });
          englishElevenLabsVoices.sort((a, b) => a.name.localeCompare(b.name));
          console.log('ElevenLabs filtered voices:', englishElevenLabsVoices.length);
          setElevenLabsVoices(englishElevenLabsVoices);

          // Separate voices by gender
          const maleVoices = englishElevenLabsVoices.filter(v => v.metadata?.gender === 'male');
          const femaleVoices = englishElevenLabsVoices.filter(v => v.metadata?.gender === 'female');
          setElevenLabsMaleVoices(maleVoices);
          setElevenLabsFemaleVoices(femaleVoices);
          console.log('ElevenLabs male voices:', maleVoices.length, 'female voices:', femaleVoices.length);
        } catch (error) {
          console.warn('Failed to load ElevenLabs voices:', error);
          setElevenLabsVoices([]);
        }
      }

      // Load Google Cloud voices if API key is configured
      let englishGoogleVoices: TTSVoice[] = [];
      if (googleCloudAvailable) {
        try {
          const googleService = TTSServiceFactory.create(TTSService.GOOGLE_CLOUD);
          const googleVoices = await googleService.getAvailableVoices();
          englishGoogleVoices = googleVoices;
          setGoogleCloudVoices(googleVoices);

          // Separate voices by gender
          const maleVoices = googleVoices.filter(v => v.metadata?.gender === 'male');
          const femaleVoices = googleVoices.filter(v => v.metadata?.gender === 'female');
          setGoogleCloudMaleVoices(maleVoices);
          setGoogleCloudFemaleVoices(femaleVoices);
          console.log('Google Cloud male voices:', maleVoices.length, 'female voices:', femaleVoices.length);
        } catch (error) {
          console.warn('Failed to load Google Cloud voices:', error);
          setGoogleCloudVoices([]);
        }
      }

      // Restore saved voice only when it does not demote Google Cloud from primary.
      const savedVoiceId = localStorage.getItem('preferredVoiceId');
      const savedService = localStorage.getItem('preferredTTSService') as TTSService | null;

      // Google Cloud is the primary TTS provider. ElevenLabs is kept as cloud fallback.
      let voicesToUse = englishWebVoices;
      let serviceToUse = TTSService.WEB_SPEECH;

      if (englishGoogleVoices.length > 0) {
        voicesToUse = englishGoogleVoices;
        serviceToUse = TTSService.GOOGLE_CLOUD;
      } else if (savedService === TTSService.ELEVENLABS && englishElevenLabsVoices.length > 0) {
        voicesToUse = englishElevenLabsVoices;
        serviceToUse = TTSService.ELEVENLABS;
      }

      setSelectedService(serviceToUse);

      if (savedVoiceId && savedService === serviceToUse) {
        const saved = voicesToUse.find(v => v.id === savedVoiceId);
        if (saved) {
          setSelectedVoice(saved);
          setVoicesLoaded(true);
          setIsLoadingVoices(false);
          return;
        }
      }

      // Select default voice
      const defaultVoice = voicesToUse.find(v => v.language.startsWith('en-US')) || voicesToUse[0];

      if (defaultVoice) {
        setSelectedVoice(defaultVoice);
        localStorage.setItem('preferredVoiceId', defaultVoice.id);
        localStorage.setItem('preferredTTSService', serviceToUse);
      } else {
        console.warn('Failed to select default voice');
        setTtsError(t('chat.noEnglishVoices'));
      }

      setVoicesLoaded(true);
    } catch (error) {
      console.error('Failed to load voices:', error);
        setTtsError(t('chat.failedToLoadVoices'));
      setVoicesLoaded(false);
    } finally {
      setIsLoadingVoices(false);
    }
  }, [elevenLabsAvailable, googleCloudAvailable]);

  const handleVoiceChange = useCallback((voiceId: string) => {
    // Look in all voice arrays
    const webVoice = webSpeechVoices.find(v => v.id === voiceId);
    const elevenVoice = elevenLabsVoices.find(v => v.id === voiceId);
    const googleVoice = googleCloudVoices.find(v => v.id === voiceId);
    const voice = webVoice || elevenVoice || googleVoice;

    if (voice) {
      setSelectedVoice(voice);
      setSelectedService(voice.service);
      localStorage.setItem('preferredVoiceId', voice.id);
      localStorage.setItem('preferredTTSService', voice.service);
    }
  }, [webSpeechVoices, elevenLabsVoices, googleCloudVoices]);

  const handleServiceChange = useCallback((service: TTSService) => {
    setSelectedService(service);
    localStorage.setItem('preferredTTSService', service);

    // Select first voice from new service
    const voices = 
      service === TTSService.ELEVENLABS 
        ? elevenLabsVoices 
        : service === TTSService.GOOGLE_CLOUD 
          ? googleCloudVoices 
          : webSpeechVoices;
    console.log('Switching to service:', service, 'available voices:', voices.length);

    // Find a voice with a valid ID
    const defaultVoice = voices.find(v => v.id && v.language.startsWith('en-US')) ||
      voices.find(v => v.id && v.language.startsWith('en')) ||
      voices.find(v => v.id) ||
      voices[0];

    if (defaultVoice && defaultVoice.id) {
      console.log('Selected default voice:', defaultVoice.name, defaultVoice.id);
      setSelectedVoice(defaultVoice);
      localStorage.setItem('preferredVoiceId', defaultVoice.id);
    } else {
      console.warn('No valid voice found for service:', service);
      setSelectedVoice(null);
      setTtsError(t('chat.noVoicesAvailable', { service: getServiceName(service) }));
    }
  }, [webSpeechVoices, elevenLabsVoices, googleCloudVoices]);

  // Auto-switch voice when avatar gender changes (works for all services)
  // ElevenLabs: Louis = Antoni, Sarah = Rachel
  // Google Cloud: Louis = Adam, Sarah = Bella
  // Web Speech: Selects first available male/female voice
  useEffect(() => {
    if (!voicesLoaded) return;

    if (selectedService === TTSService.ELEVENLABS) {
      // Use fixed ElevenLabs voices
      const fixedVoice = avatarGender === 'male' ? ELEVENLABS_VOICE_LOUIS : ELEVENLABS_VOICE_SARAH;
      setSelectedVoice(fixedVoice);
      localStorage.setItem('preferredVoiceId', fixedVoice.id);
      console.log('ElevenLabs voice set to:', fixedVoice.name, 'for', avatarGender);
    } else if (selectedService === TTSService.GOOGLE_CLOUD) {
      // Use fixed Google Cloud voices
      const fixedVoice = avatarGender === 'male' ? GOOGLE_VOICE_LOUIS : GOOGLE_VOICE_SARAH;
      setSelectedVoice(fixedVoice);
      localStorage.setItem('preferredVoiceId', fixedVoice.id);
      console.log('Google Cloud voice set to:', fixedVoice.name, 'for', avatarGender);
    } else if (selectedService === TTSService.WEB_SPEECH) {
      // Select first available Web Speech voice of correct gender
      const genderVoices = avatarGender === 'male' ? webSpeechMaleVoices : webSpeechFemaleVoices;

      if (genderVoices.length > 0 && genderVoices[0].id) {
        const newVoice = genderVoices[0];
        setSelectedVoice(newVoice);
        localStorage.setItem('preferredVoiceId', newVoice.id);
        console.log('Web Speech voice set to:', newVoice.name, 'for', avatarGender);
      } else {
        // Fallback to any English voice if gender-specific not found
        const fallbackVoice = webSpeechVoices.find(v => v.language.startsWith('en-US')) || webSpeechVoices[0];
        if (fallbackVoice) {
          setSelectedVoice(fallbackVoice);
          localStorage.setItem('preferredVoiceId', fallbackVoice.id);
          console.log('Web Speech fallback voice set to:', fallbackVoice.name);
        }
      }
    }
  // NOTE: selectedVoice intentionally excluded — including it causes stale closure re-runs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarGender, selectedService, voicesLoaded, webSpeechMaleVoices, webSpeechFemaleVoices, webSpeechVoices]);


  useEffect(() => {
    if (!currentConversationId) return;

    // Skip if conversation was just created (within 1 second) - welcome message already saved manually
    const wasJustCreated = conversationStartTime.current &&
      (new Date().getTime() - conversationStartTime.current.getTime()) < 1000;
    if (wasJustCreated) return;

    // Find new user message
    const latestUserMsg = messages.filter(m => m.sender === 'user').pop();
    if (latestUserMsg && latestUserMsg.text !== lastSavedUserMessage.current) {
      lastSavedUserMessage.current = latestUserMsg.text;
      const scenarioName = scenario?.toString() || 'real-life';
      conversationService.addMessage(
        currentConversationId,
        'user',
        latestUserMsg.text,
        'user',
        conversationService.getCategoryFromScenario(scenarioName),
        scenarioName
      )
        .then(() => {
          console.log('[TextChatUI] User message saved');
          const userMessageCount = messages.filter(m => m.sender === 'user').length;
          if (
            userMessageCount >= SCENARIO_GENERATION_MIN_USER_MESSAGES &&
            scenarioGenerationAttemptedConversationIdRef.current !== currentConversationId
          ) {
            scenarioGenerationAttemptedConversationIdRef.current = currentConversationId;
            const category = window.location.pathname.startsWith('/guided-learning') ? 'learn' : 'real-life';
            adaptationService.generateSuggestedScenario(userIdRef.current, category, currentConversationId)
              .then((success) => {
                if (success) {
                  console.log('[TextChatUI] Background scenario generated successfully');
                }
              })
              .catch(err => console.error('[TextChatUI] Error in background generation:', err));
          }
        })
        .catch(err => console.error('[TextChatUI] Error saving user message:', err));
    }

    // Find new AI message
    const latestAiMsg = messages.filter(m => m.sender === 'ai').pop();
    if (latestAiMsg && latestAiMsg.text !== lastSavedAiMessage.current) {
      lastSavedAiMessage.current = latestAiMsg.text;
      const scenarioName = scenario?.toString() || 'real-life';
      conversationService.addMessage(
        currentConversationId,
        'assistant',
        latestAiMsg.text,
        'system',
        conversationService.getCategoryFromScenario(scenarioName),
        scenarioName
      )
        .then(() => console.log('[TextChatUI] AI message saved'))
        .catch(err => console.error('[TextChatUI] Error saving AI message:', err));
    }
  }, [messages, currentConversationId]);

  // End conversation when component unmounts (only if conversation was created)
  // Use refs to capture current values to avoid stale closures
  const messagesRef = useRef(messages);
  const userIdRef = useRef(userId);
  const conversationIdRef = useRef(currentConversationId);
  useEffect(() => {
    messagesRef.current = messages;
    userIdRef.current = userId;
    conversationIdRef.current = currentConversationId;
  }, [messages, userId, currentConversationId]);

  useEffect(() => {
    return () => {
      if (currentConversationId && conversationStartTime.current && userIdRef.current) {
        const durationSeconds = Math.floor(
          (new Date().getTime() - conversationStartTime.current.getTime()) / 1000
        );
        conversationService.endConversation(currentConversationId, durationSeconds);
        console.log('[TextChatUI] Conversation ended, duration:', durationSeconds);

        // Process RAG context - update user profile
        const chatMessages: Message[] = messagesRef.current.map(m => ({
          id: Math.random().toString(),
          conversation_id: currentConversationId,
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
          created_at: new Date().toISOString(),
        }));

        contextService.processConversationEnd(
          currentConversationId,
          userIdRef.current,
          scenarioString,
          chatMessages,
          durationSeconds
        ).then(() => {
          const userMessageCount = messagesRef.current.filter(m => m.sender === 'user').length;
          if (
            userMessageCount >= SCENARIO_GENERATION_MIN_USER_MESSAGES &&
            scenarioGenerationAttemptedConversationIdRef.current !== currentConversationId
          ) {
            scenarioGenerationAttemptedConversationIdRef.current = currentConversationId;
            const category = window.location.pathname.startsWith('/guided-learning') ? 'learn' : 'real-life';
            adaptationService.generateSuggestedScenario(userIdRef.current, category, currentConversationId)
              .then((success) => {
                if (success) {
                  console.log('[TextChatUI] Background scenario generated successfully at session end');
                }
              })
              .catch(err => console.error('[TextChatUI] Error generating scenario at session end:', err));
          }
        }).catch(err => console.error('[TextChatUI] Error processing RAG context:', err));
      }
    };
  }, [currentConversationId, scenarioString]);

  const requestDownloadConversation = () => {
    if (!messages.length) return;
    setDownloadConfirmation({ type: 'current' });
  };

  // Download conversation as text file
  const downloadConversation = () => {
    if (!messages.length) return;

    const scenarioName = scenario?.name || 'Chat';
    const date = new Date().toLocaleDateString(i18n.language);

    let content = `=${scenarioName}=\n${t('chat.downloadDate', { date })}\n\n`;

    messages.forEach(msg => {
      const sender = msg.sender === 'user' ? t('chat.youHistory') : t('chat.aiTutorHistory');
      content += `[${sender}]\n${msg.text}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scenarioName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const requestDownloadHistoryConversation = async (convId: string) => {
    if (!conversationMessages[convId]) {
      const data = await conversationService.getConversationWithMessages(convId);
      if (!data || data.messages.length === 0) return;
      setConversationMessages(prev => ({ ...prev, [convId]: data.messages }));
    }

    setDownloadConfirmation({ type: 'history', conversationId: convId });
  };

  // Download a conversation from history
  const downloadHistoryConversation = (convId: string) => {
    const convMessages = conversationMessages[convId];
    const conv = historyConversations.find(c => c.id === convId);
    if (!convMessages || !conv || convMessages.length === 0) return;

    const scenarioTitle = conv.scenario.replace(/-/g, ' ');

    let content = `=${scenarioTitle.toUpperCase()}=\n`;
    content += `${t('chat.downloadDate', { date: formatDate(conv.started_at) })}\n`;
    content += `${t('chat.downloadDuration', { duration: formatDuration(conv.duration_seconds) })}\n`;
    content += `${'='.repeat(40)}\n\n`;

    convMessages.forEach(msg => {
      const sender = msg.role === 'user' ? t('chat.youLabel') : t('chat.aiLabel');
      content += `[${sender}]\n${msg.content}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${conv.scenario}-${conv.started_at.split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const confirmDownloadConversation = () => {
    if (!downloadConfirmation) return;

    if (downloadConfirmation.type === 'current') {
      downloadConversation();
    } else {
      downloadHistoryConversation(downloadConfirmation.conversationId);
    }

    setDownloadConfirmation(null);
  };

  const topicTitle = topicConfig?.title;
  const topicDesc = topicConfig?.description;
  const getWelcomeFallbackText = () => getLocalWelcomeFallback(scenario, customSystemPrompt, topicTitle);
  const shouldShowInlinePaywall = isLimitReached && messages.length === 0;

  // Welcome message — always generated by the AI, enriched with RAG context
  const isGeneratingWelcomeRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    let fallbackShown = false;
    let fallbackTimerId: number | null = null;

    if (isBackendTextBlocked && textEntitlement) {
      isGeneratingWelcomeRef.current = false;
      setIsWelcomeLoading(false);
      hasSpokenWelcomeRef.current = true;
      setBlockedEntitlement(textEntitlement);
      return;
    }

    if (entitlementLoading) {
      if (messagesRef.current.length === 0 && !isGeneratingWelcomeRef.current) {
        fallbackTimerId = window.setTimeout(() => {
          if (cancelled || messagesRef.current.length > 0) return;
          fallbackShown = true;
          hasSpokenWelcomeRef.current = false;
          setMessages([{ sender: 'ai', text: getWelcomeFallbackText() }]);
          setIsWelcomeLoading(false);
        }, WELCOME_FALLBACK_DELAY_MS);
      }

      return () => {
        cancelled = true;
        if (fallbackTimerId) window.clearTimeout(fallbackTimerId);
      };
    }

    if (isLimitReached) {
      isGeneratingWelcomeRef.current = false;
      setIsWelcomeLoading(false);
      hasSpokenWelcomeRef.current = true;
      return;
    }

    if (messagesRef.current.length > 0) return;

    if (isGeneratingWelcomeRef.current) return;
    isGeneratingWelcomeRef.current = true;
    (async () => {
      setIsWelcomeLoading(true);
      fallbackTimerId = window.setTimeout(() => {
        if (cancelled || messagesRef.current.length > 0) return;
        fallbackShown = true;
        hasSpokenWelcomeRef.current = false;
        setMessages([{ sender: 'ai', text: getWelcomeFallbackText() }]);
        setIsWelcomeLoading(false);
      }, WELCOME_FALLBACK_DELAY_MS);

      try {
        // Load RAG context first so the opening message can be personalized
        const rag = await loadRAGContext();

        const welcomeMsg = await generateWelcomeMessage(
          scenario,
          customSystemPrompt,
          topicTitle,
          topicDesc,
          effectiveCorrectionsEnabled,
          rag ?? undefined
        );
        if (cancelled || fallbackShown) return;
        hasSpokenWelcomeRef.current = false; // Reset to allow speaking the new welcome message once
        setMessages([{ sender: 'ai', text: welcomeMsg }]);
      } catch (error) {
        console.error('[TextChatUI] Error generating welcome message:', error);
        if (cancelled || fallbackShown) return;
        setMessages([{ sender: 'ai', text: getWelcomeFallbackText() }]);
      } finally {
        if (fallbackTimerId) window.clearTimeout(fallbackTimerId);
        if (!cancelled && !fallbackShown) setIsWelcomeLoading(false);
        isGeneratingWelcomeRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
      if (fallbackTimerId) window.clearTimeout(fallbackTimerId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, customSystemPrompt, topicId, topicTitle, topicDesc, effectiveCorrectionsEnabled, isLimitReached, isBackendTextBlocked, textEntitlement?.status, entitlementLoading]);

  // Speak welcome message ONLY after voices are fully loaded
  useEffect(() => {
    // Only speak the welcome message once when:
    // 1. Voices have just finished loading (voicesLoaded transition from false to true)
    // 2. We have a valid selected voice
    // 3. TTS is enabled
    // 4. There's exactly one message (the welcome message)
    // 5. We haven't spoken the welcome message yet in this session
    // 6. The welcome message is not actively loading
    if (!isLimitReached && !isWelcomeLoading && voicesLoaded && selectedVoice && ttsEnabled && messages.length === 1 && messages[0].sender === 'ai' && !hasSpokenWelcomeRef.current) {
      hasSpokenWelcomeRef.current = true;
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        speakText(messages[0].text, 0);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isLimitReached, isWelcomeLoading, voicesLoaded, selectedVoice, ttsEnabled, messages, speakText]);

  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');
  const isRecordingRef = useRef<boolean>(false);
  const isIntentionalStopRef = useRef<boolean>(false);

  const geminiClient = useMemo(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
  }, []);

  const sessionTranscriptRef = useRef<string>('');
  const accumulatedTranscriptRef = useRef<string>('');
  const lastSessionFinalRef = useRef<string>('');
  const hasSpokenWelcomeRef = useRef<boolean>(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) { }
        recognitionRef.current = null;
      }
      isRecordingRef.current = false;
    };
  }, []);

  // TTS: Load voices on mount
  useEffect(() => {
    if (isLimitReached) return;
    loadAllVoices();
  }, [isLimitReached, loadAllVoices]);

  // TTS: Cleanup speech on unmount
  useEffect(() => {
    return () => stopSpeech();
  }, [stopSpeech]);

  const handleSend = useCallback(async (textOverride?: string) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : input;
    // Prevent duplicate sends
    if (!textToSend.trim() || isLoading || isTutorResponsePaused || isSendingRef.current) return;

    if (isLimitReached) {
      console.warn('[TextChatUI] Free daily text limit reached');
      const decision = getTextLimitDecision();
      setBlockedEntitlement(decision);
      setPaywallModalDecision(decision);
      return;
    }

    // Set sending flag
    isSendingRef.current = true;

    // TTS: Stop current speech when sending message
    stopSpeech();

    const canConsumeTextMessage = await consumeTextMessageQuota();
    if (!canConsumeTextMessage) {
      isSendingRef.current = false;
      return;
    }

    const userMessage: MessageWithCorrections = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    if (!textOverride) {
      setInput('');
    }
    setIsLoading(true);

    // Create conversation on first user message and save welcome message
    if (!currentConversationId) {
      const scenarioName = scenario?.toString() || 'real-life';
      const conversation = await conversationService.createConversation(userId, scenarioName);
      if (conversation) {
        setCurrentConversationId(conversation.id);
        conversationStartTime.current = new Date();
        console.log('[TextChatUI] Conversation created on user message:', conversation.id, 'scenario:', scenarioName);

        // Save welcome message (first AI message)
        const welcomeMsg = messages.find(m => m.sender === 'ai');
        if (welcomeMsg) {
          await conversationService.addMessage(
            conversation.id,
            'assistant',
            welcomeMsg.text,
            'welcome',
            conversationService.getCategoryFromScenario(scenarioName),
            scenarioName
          );
          lastSavedAiMessage.current = welcomeMsg.text;
          console.log('[TextChatUI] Welcome message saved');
        }
      }
    }

    // Use ref to avoid stale closure
    const currentMessages = messagesRef.current;

    try {
      const conversationHistory = getRecentHistory(currentMessages, MAX_HISTORY_MESSAGES);
      const aiResponse = await sendChatMessage(
        userMessage.text,
        conversationHistory,
        scenario,
        effectiveCorrectionsEnabled,
        ragContext || undefined,
        customSystemPrompt
      );
      const { corrections, cleanedText } = parseCorrectionsFromResponse(aiResponse);
      const newCount = currentMessages.filter(m => m.sender === 'user').length + 1;
      setUserMessageCount(newCount);
      const shouldGenerateFeedback = feedbackAvailable && newCount > 0 && newCount % FEEDBACK_TRIGGER_USER_MESSAGES === 0;
      const shouldPauseForFeedback = shouldGenerateFeedback && autoOpenFeedbackModal;
      const aiMessage: MessageWithCorrections = {
        sender: 'ai',
        text: cleanedText,
        corrections: effectiveCorrectionsEnabled ? corrections : undefined,
        type: 'normal',
      };
      const newMessageIndex = currentMessages.length + 1;

      if (shouldPauseForFeedback) {
        pendingTutorResponseRef.current = {
          message: aiMessage,
          text: cleanedText,
          index: newMessageIndex,
        };
        setIsTutorResponsePaused(true);
      } else {
        setMessages(prev => [...prev, aiMessage]);
      }

      if (shouldGenerateFeedback) {
        generateFeedbackInBackground([
          ...currentMessages,
          userMessage,
          { sender: 'ai', text: cleanedText, type: 'normal' },
        ]);
      }

      if (!shouldPauseForFeedback) {
        setTimeout(() => {
          if (ttsEnabled) {
            speakText(cleanedText, newMessageIndex);
          }
        }, 100);
      }
    } catch (error) {
      const errorMsg = t('chat.sorryError');
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: errorMsg },
      ]);

      // TTS: Speak error message
      const errorMessageIndex = currentMessages.length + 1;
      setTimeout(() => {
        if (ttsEnabled && window.speechSynthesis) {
          speakText(errorMsg, errorMessageIndex);
        }
      }, 100);
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  }, [input, isLoading, isTutorResponsePaused, scenario, effectiveCorrectionsEnabled, ttsEnabled, speakText, stopSpeech, messagesRef, isLimitReached, getTextLimitDecision, consumeTextMessageQuota, autoOpenFeedbackModal, feedbackAvailable, generateFeedbackInBackground]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    if (!geminiClient) {
      throw new Error(t('chat.apiKeyNotFound'));
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const base64Audio = await audioBlobToBase64(audioBlob);
    const model = geminiClient.getGenerativeModel({ model: TRANSCRIPTION_MODEL });
    const prompt = 'Transcribe this audio. Context: Everyday English conversation between a student and an AI tutor. Pay close attention to standard expressions, greetings, and common phrases (e.g., "I\'m fine, and you?", "Nice to meet you"). Only output the exact transcribed text without punctuation correction, comments, or explanations.';
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Transcription timeout')), TRANSCRIPTION_TIMEOUT_MS);
        });
        const result = await Promise.race([
          model.generateContent([
            { inlineData: { data: base64Audio, mimeType: audioBlob.type || 'audio/webm' } },
            prompt,
          ]),
          timeoutPromise,
        ]) as any;
        return result.response.text() || '';
      } catch (error: any) {
        lastError = error;
        const isRateLimitError =
          error.message?.includes('429') ||
          error.message?.includes('quota') ||
          error.message?.includes('exceeded') ||
          error.message?.includes('Too Many Requests');
        if (isRateLimitError && attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        throw error;
      }
    }
    throw lastError || new Error('Transcription failed');
  }, [geminiClient]);

  const startRecording = async () => {
    if (isLimitReached) {
      const decision = getTextLimitDecision();
      setBlockedEntitlement(decision);
      setPaywallModalDecision(decision);
      return;
    }
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;
    setIsRecording(true);
    sessionTranscriptRef.current = '';
    accumulatedTranscriptRef.current = '';
    lastSessionFinalRef.current = '';
    setLiveTranscript('');
    lastTranscriptRef.current = '';
    isIntentionalStopRef.current = false;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentSessionFinal = '';
        let interimTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            currentSessionFinal += (currentSessionFinal ? ' ' : '') + transcript.trim();
          } else {
            interimTranscript += (interimTranscript ? ' ' : '') + transcript.trim();
          }
        }

        lastSessionFinalRef.current = currentSessionFinal;

        const fullTranscript = (accumulatedTranscriptRef.current ? accumulatedTranscriptRef.current + ' ' : '') + currentSessionFinal + (interimTranscript ? ' ' + interimTranscript : '');
        setLiveTranscript(fullTranscript);
        lastTranscriptRef.current = fullTranscript;

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = setTimeout(() => {
          if (lastTranscriptRef.current.trim()) {
            stopRecording();
          }
        }, 3000);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          setIsRecording(false);
          isRecordingRef.current = false;
          setLiveTranscript('');
        }
      };

      recognition.onend = async () => {
        if (isRecordingRef.current && !isIntentionalStopRef.current) {
          // Accumulate the current session's final transcript before restarting
          if (lastSessionFinalRef.current) {
            accumulatedTranscriptRef.current = accumulatedTranscriptRef.current
              ? accumulatedTranscriptRef.current + ' ' + lastSessionFinalRef.current
              : lastSessionFinalRef.current;
            lastSessionFinalRef.current = '';
          }
          // Clear any pending silence timer to prevent premature stop right after restart
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          setTimeout(() => {
            try {
              if (isRecordingRef.current && !isIntentionalStopRef.current) {
                recognition.start();
              }
            } catch (e) {
              console.error('[TextChatUI] Failed to restart recognition in timeout:', e);
            }
          }, 100);
          return;
        }

        // Synchronously mark as not recording immediately to prevent duplicate triggers/sends during async API/DB calls
        setIsRecording(false);
        isRecordingRef.current = false;

        const currentTranscript = lastTranscriptRef.current;
        if (currentTranscript.trim() && !isSendingRef.current) {
          if (isLimitReached) {
            setLiveTranscript('');
            lastTranscriptRef.current = '';
            const decision = getTextLimitDecision();
            setBlockedEntitlement(decision);
            setPaywallModalDecision(decision);
            return;
          }

          isSendingRef.current = true;
          let finalTranscript = currentTranscript.trim();
          setLiveTranscript('');
          lastTranscriptRef.current = '';
          try {
            finalTranscript = addPunctuation(finalTranscript);

            const canConsumeTextMessage = await consumeTextMessageQuota();
            if (!canConsumeTextMessage) {
              isSendingRef.current = false;
              return;
            }

            // Add user message FIRST
            const userMessage: MessageWithCorrections = { sender: 'user', text: finalTranscript };
            setMessages((prev) => [...prev, userMessage]);
            setInput('');

            // Create conversation if not exists (BUG #2 FIX)
            let convId = conversationIdRef.current;
            if (!convId) {
              const scenarioName = scenario?.toString() || 'real-life';
              const conversation = await conversationService.createConversation(userIdRef.current, scenarioName);
              if (conversation) {
                convId = conversation.id;
                setCurrentConversationId(conversation.id);
                conversationStartTime.current = new Date();
                console.log('[TextChatUI] Voice: Conversation created:', conversation.id);
              }
            }

            // Use ref for messages to avoid stale closure (BUG #4 FIX)
            const currentMessages = messagesRef.current;
            const conversationHistory = getRecentHistory([...currentMessages, userMessage], MAX_HISTORY_MESSAGES);

            // THEN show loading and send to API
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 50));

            const aiResponse = await sendChatMessage(
              finalTranscript,
              conversationHistory,
              scenario,
              effectiveCorrectionsEnabled,
              ragContext || undefined,
              customSystemPrompt
            );
            const { corrections, cleanedText } = parseCorrectionsFromResponse(aiResponse);
            const newCount = userMessageCount + 1;
            setUserMessageCount(newCount);
            const shouldGenerateFeedback = feedbackAvailable && newCount > 0 && newCount % FEEDBACK_TRIGGER_USER_MESSAGES === 0;
            const shouldPauseForFeedback = shouldGenerateFeedback && autoOpenFeedbackModal;
            const aiMessage: MessageWithCorrections = {
              sender: 'ai',
              text: cleanedText,
              corrections: effectiveCorrectionsEnabled ? corrections : undefined,
              type: 'normal',
            };
            const newMessageIndex = currentMessages.length + 1;

            if (shouldPauseForFeedback) {
              pendingTutorResponseRef.current = {
                message: aiMessage,
                text: cleanedText,
                index: newMessageIndex,
              };
              setIsTutorResponsePaused(true);
            } else {
              setMessages(prev => [...prev, aiMessage]);
            }

            if (shouldGenerateFeedback) {
              generateFeedbackInBackground([
                ...currentMessages,
                userMessage,
                { sender: 'ai', text: cleanedText, type: 'normal' },
              ]);
            }

            // O useEffect global cuidará de salvar as mensagens no banco de dados automaticamente.

            if (!shouldPauseForFeedback) {
              setTimeout(() => {
                if (ttsEnabled) {
                  speakText(cleanedText, newMessageIndex);
                }
              }, 100);
            }
          } catch (error) {
            const errorMsg = t('chat.sorryError');
            setMessages((prev) => [
              ...prev,
              { sender: 'ai', text: errorMsg },
            ]);

            // TTS: Speak error message (voice input)
            const newMessageIndex = messagesRef.current.length + 1;
            setTimeout(() => {
              if (ttsEnabled && window.speechSynthesis) {
                speakText(errorMsg, newMessageIndex);
              }
            }, 100);
          } finally {
            setIsLoading(false);
            isSendingRef.current = false;
          }
        }
      };

      recognition.start();
      setIsRecording(true);
      isRecordingRef.current = true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  };

  const stopRecording = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (recognitionRef.current && isRecordingRef.current) {
      isIntentionalStopRef.current = true;
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isTutorResponsePaused) return;
    if (isRecordingRef.current) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const downloadMessageCount = downloadConfirmation?.type === 'current'
    ? messages.length
    : downloadConfirmation?.type === 'history'
      ? (conversationMessages[downloadConfirmation.conversationId]?.length ?? 0)
      : 0;

  const downloadTitle = downloadConfirmation?.type === 'history'
    ? (historyConversations.find(conv => conv.id === downloadConfirmation.conversationId)?.scenario.replace(/-/g, ' ') ?? t('chat.historyShortTitle', { defaultValue: 'Histórico' }))
    : (scenario?.name || topicConfig?.title || t('chat.historyShortTitle', { defaultValue: 'Conversa' }));

  return (
    <div
      className={`w-full rounded-2xl shadow-xl overflow-hidden transition-all hover:shadow-2xl flex flex-col ${topicConfig ? `border-t-4 ${topicConfig.borderColor}` : ''} h-full bg-gray-50 bv-chat-theme`}
    >
      {/* Card Header */}
      <div className={`p-3 sm:p-4 md:p-6 pb-3 md:pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${topicConfig ? 'bg-white border-b border-gray-100' : 'bg-gradient-to-r from-[#4a7cf5] to-[#6b9cf7] text-white'}`}>
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center overflow-hidden ${topicConfig ? 'border-2 border-white shadow-md' : 'bg-white/20 border-2 border-white/30'}`}>
              <img
                src={avatarGender === 'male' ? LOUIS_AVATAR_URL : SARAH_AVATAR_URL}
                alt={t('chat.tutorAvatar')}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white"></div>
          </div>

          {/* Title */}
          <div className="min-w-0">
            <h3 className={`font-bold text-base sm:text-lg leading-tight ${topicConfig ? 'text-gray-800' : 'text-white'}`}>
              {topicConfig ? topicConfig.title : (avatarGender === 'male' ? t('chat.tutorLouis') : t('chat.tutorSarah'))}
            </h3>
            <p className={`text-sm leading-snug ${topicConfig ? 'text-gray-500' : 'text-white/80'}`}>
              {topicConfig ? topicConfig.description : t('chat.yourAiTutor')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 sm:shrink-0">
          {/* History button */}
          <button
            onClick={() => setShowHistory(true)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${topicConfig ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/20 hover:bg-white/30 border border-white/30'}`}
            title={t('chat.historyTitle')}
          >
            <History className={`h-4 w-4 sm:h-5 sm:w-5 ${topicConfig ? 'text-gray-600' : 'text-white'}`} />
          </button>

          {/* Background-generated tutor insights */}
          <button
            onClick={() => {
              if (!feedbackAvailable) return;
              if (activeFeedback) {
                setShowModalExamples(false);
                setShowFeedbackModal(true);
                if (!hasCelebratedActiveFeedbackRef.current) {
                  hasCelebratedActiveFeedbackRef.current = true;
                  confetti({
                    particleCount: 120,
                    spread: 65,
                    origin: { y: 0.6 },
                    colors: ['#3b82f6', '#8b5cf6', '#6366f1', '#10b981'],
                  });
                }
              }
            }}
            disabled={!feedbackAvailable || !activeFeedback}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative ${
              topicConfig
                ? feedbackAvailable && activeFeedback
                  ? 'bg-violet-100 hover:bg-violet-200'
                  : 'bg-gray-100 opacity-60 cursor-not-allowed'
                : feedbackAvailable && activeFeedback
                  ? 'bg-white/30 hover:bg-white/40 border border-white/40'
                  : 'bg-white/10 border border-white/20 opacity-60 cursor-not-allowed'
            }`}
            title={
              !feedbackAvailable
                ? (i18n.language === 'en' ? 'Feedback is available from Trial or Standard' : 'Feedback disponível a partir do Trial ou Standard')
                : isFeedbackLoading
                ? (i18n.language === 'en' ? 'Preparing tutor insights' : 'Preparando insights do tutor')
                : activeFeedback
                  ? (i18n.language === 'en' ? 'Open tutor insights' : 'Abrir insights do tutor')
                  : (i18n.language === 'en' ? 'Insights will be prepared during the conversation' : 'Os insights serão preparados durante a conversa')
            }
          >
            {isFeedbackLoading && !activeFeedback ? (
              <Loader2 className={`h-4 w-4 sm:h-5 sm:w-5 animate-spin ${topicConfig ? 'text-violet-600' : 'text-white'}`} />
            ) : !feedbackAvailable ? (
              <Lock className={`h-4 w-4 sm:h-5 sm:w-5 ${topicConfig ? 'text-gray-500' : 'text-white'}`} />
            ) : (
              <Brain className={`h-4 w-4 sm:h-5 sm:w-5 ${topicConfig ? (activeFeedback ? 'text-violet-700' : 'text-gray-500') : 'text-white'}`} />
            )}
            {feedbackAvailable && activeFeedback && (
              <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
            )}
          </button>

          {/* Download button */}
          <button
            onClick={requestDownloadConversation}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${topicConfig ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/20 hover:bg-white/30 border border-white/30'}`}
            title={t('chat.downloadConversation')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 sm:h-5 sm:w-5 ${topicConfig ? 'text-gray-600' : 'text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>

          {/* Settings button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${topicConfig ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/20 hover:bg-white/30 border border-white/30'}`}
            title={t('chat.audioSettingsTitle')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 sm:h-5 sm:w-5 ${topicConfig ? 'text-gray-600' : 'text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
        {isWelcomeLoading && messages.length === 0 && !isLimitReached && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
              <img src={avatarGender === 'male' ? LOUIS_AVATAR_URL : SARAH_AVATAR_URL} alt="AI Tutor" className="w-full h-full object-cover" />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {shouldShowInlinePaywall && (
          <div className="flex min-h-full items-center justify-center px-3 py-8">
            <div
              className="w-full max-w-[760px] rounded-2xl border shadow-[0_22px_60px_rgba(0,0,0,0.20)]"
              style={{
                padding: 'clamp(16px, 4vw, 30px)',
                background: 'linear-gradient(180deg, rgba(25,26,36,0.98), rgba(18,19,28,0.98))',
                borderColor: 'rgba(124,92,255,0.18)',
              }}
            >
              <div className="grid items-center gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-7">
                <div className="flex min-w-0 flex-col items-center gap-3 text-center sm:gap-5 lg:flex-row lg:items-start lg:text-left">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14 lg:mt-1"
                    style={{
                      background: 'rgba(124,92,255,0.1)',
                      border: '1px solid rgba(124,92,255,0.2)',
                      color: 'var(--accent-purple2)',
                    }}
                  >
                    <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0">
                    <div
                      className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase sm:mb-3 sm:text-[11px]"
                      style={{
                        background: 'rgba(124,92,255,0.1)',
                        border: '1px solid rgba(124,92,255,0.2)',
                        color: 'var(--accent-purple2)',
                      }}
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {t('paywall.renewsIn', {
                          time: resetCountdownLabel,
                          defaultValue: `Renova em ${resetCountdownLabel}`,
                        })}
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-extrabold leading-tight sm:text-2xl" style={{ color: 'var(--text-primary)' }}>
                      {t('paywall.limitReached', { defaultValue: 'Limite diário atingido' })}
                    </h3>
                    <p className="mx-auto max-w-[34rem] text-sm leading-relaxed max-[380px]:text-[13px] lg:mx-0" style={{ color: 'var(--text-secondary)' }}>
                      {t('paywall.textChatLockedInline', {
                        defaultValue: 'Ele renova amanhã, ou você pode fazer upgrade para praticar mais e receber feedback do tutor.',
                      })}
                    </p>
                  </div>
                </div>

                <div className="mx-auto flex w-full max-w-[360px] min-w-0 flex-col gap-3 lg:max-w-none">
                  <div
                    className="w-full rounded-xl p-3 text-left max-[380px]:p-2.5"
                    style={{
                      background: 'var(--bg-card-alt)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div className="mb-3 flex flex-col gap-1 text-xs min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between min-[420px]:gap-4 lg:flex-col lg:items-start lg:gap-1 xl:flex-row xl:items-center">
                      <span style={{ color: 'var(--text-muted)' }}>{t('paywall.usage', { defaultValue: 'Uso de hoje' })}</span>
                      <span className="font-bold xl:text-right" style={{ color: 'var(--text-primary)' }}>
                        {textUsagePercentLabel} · {textUsageCompactLabel}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${textUsagePercent}%`, background: textUsageProgressColor }}
                      />
                    </div>
                  </div>
                  <Link
                    to="/plans?from_paywall=text_chat"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-sm font-bold leading-tight transition-colors max-[380px]:text-[13px]"
                    style={{
                      background: 'rgba(124, 92, 255, 0.1)',
                      border: '1px solid rgba(124, 92, 255, 0.3)',
                      color: 'var(--accent-purple2)',
                    }}
                  >
                    <Crown className="h-4 w-4 shrink-0" />
                    <span>{t('paywall.upgradeToPro', { defaultValue: 'Fazer upgrade para praticar mais' })}</span>
                  </Link>
                  <span className="text-center text-xs font-medium leading-snug max-[380px]:text-[11px] lg:text-left" style={{ color: 'var(--text-muted)' }}>
                    {t('paywall.textChatBlockedHint', {
                      defaultValue: 'O chat libera automaticamente quando o contador zerar.',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start items-end gap-2'}`}>
            {/* Avatar para mensagens do assistente */}
            {message.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                <img src={avatarGender === 'male' ? LOUIS_AVATAR_URL : SARAH_AVATAR_URL} alt="AI Tutor" className="w-full h-full object-cover" />
              </div>
            )}
            <div className={`max-w-[85%] sm:max-w-[80%] px-4 py-4 sm:px-4 sm:py-3 rounded-2xl ${message.sender === 'user'
              ? 'bg-[#4a7cf5] text-white rounded-br-sm shadow-md'
              : 'bg-white text-gray-800 rounded-bl-sm shadow-md'
              }`}>
              {/* Message text + TTS button container */}
              {message.text && (
                <div className="flex items-start justify-between gap-2">
                  <p className="text-base sm:text-[15px] whitespace-pre-wrap flex-1">
                    {message.sender === 'ai' ? (
                      (() => {
                        if (translationMode === 'inline') {
                          return message.text;
                        }
                        const segments = parseTranslations(message.text);
                        return segments.map((segment, idx) => {
                          if (segment.translation && translationMode === 'hover') {
                            return (
                              <span key={idx} className="relative group inline border-b border-dashed border-violet-400/80 cursor-help">
                                <span className="text-gray-800 dark:text-gray-100 font-medium">
                                  {segment.text}
                                </span>
                                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs scale-0 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 px-3 py-2 text-xs font-normal text-white shadow-xl transition-all duration-200 group-hover:scale-100 group-focus:scale-100 z-[60] leading-relaxed text-center whitespace-normal border border-slate-700/30">
                                  {segment.translation}
                                </span>
                              </span>
                            );
                          }
                          return <span key={idx}>{segment.text}</span>;
                        });
                      })()
                    ) : (
                      message.text
                    )}
                  </p>

                  {/* TTS replay button for AI messages */}
                  {message.sender === 'ai' && !isRecording && (currentSpeakingId === null || currentSpeakingId === index) && (
                    <button
                      onClick={() => {
                        if (currentSpeakingId === index) {
                          stopSpeech();
                        } else {
                          stopSpeech();
                          setTimeout(() => speakText(message.text, index), 100);
                        }
                      }}
                      className="shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title={currentSpeakingId === index ? t('chat.stopSpeaking') : t('chat.listenAgain', { service: 'Sakae' })}
                      disabled={isGeneratingSpeech && currentSpeakingId !== index}
                    >
                      {currentSpeakingId === index ? (
                        // Stop icon (red pulsing)
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                      ) : isGeneratingSpeech ? (
                        // Loading indicator
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                        </svg>
                      ) : selectedService === TTSService.ELEVENLABS ? (
                        // ElevenLabs indicator (star)
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400 hover:text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                      ) : (
                        // Web Speech indicator (speaker)
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Corrections */}
              {message.sender === 'ai' && message.corrections && message.corrections.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-amber-100">
                  <div className="text-[11px] font-medium text-amber-600/90 mb-1.5 flex items-center gap-1">
                    <Sparkles size={11} />
                    <span>{t('chat.tip')}</span>
                  </div>
                  <div className="bg-amber-50 rounded-lg px-3 py-2 space-y-1.5">
                    {message.corrections.map((correction, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap text-xs">
                          <span className="text-red-500 line-through opacity-80">
                            "{correction.original}"
                          </span>
                          <ArrowRight size={11} className="text-slate-400" />
                          <span className="text-emerald-600 font-semibold">
                            "{correction.corrected}"
                          </span>
                        </div>
                        <div className="text-slate-600 text-[10px] flex items-start gap-1">
                          <Lightbulb size={11} className="shrink-0 mt-0.5 text-amber-500" />
                          <span className="leading-snug">{correction.explanation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Periodic Feedback Card */}
              <AnimatePresence>
                {message.type === 'feedback' && message.feedback && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      y: 0,
                      transition: { 
                        type: "spring",
                        stiffness: 260,
                        damping: 20 
                      }
                    }}
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                    whileHover={{ scale: 1.02 }}
                    className="mt-3 bg-white rounded-xl border border-gray-100 shadow-xl relative overflow-hidden group"
                  >
                    <div className="bg-violet-700 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white">
                        <Brain size={18} />
                        <span className="font-bold text-sm">{t('chat.tutorInsight')}</span>
                      </div>
                      
                      {/* TTS replay button for Feedback - Improved UX/UI */}
                      {!isRecording && (currentSpeakingId === null || currentSpeakingId === index) && (
                        <button
                          onClick={() => {
                            if (currentSpeakingId === index) {
                              stopSpeech();
                            } else {
                              stopSpeech();
                              const feedbackTextToRead = `${message.feedback!.positive} Now, focus on this: ${message.feedback!.toImprove}`;
                              setTimeout(() => speakText(feedbackTextToRead, index), 100);
                            }
                          }}
                          className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300
                            ${currentSpeakingId === index 
                              ? 'bg-white/30 text-white ring-2 ring-white/50' 
                              : 'bg-white/10 hover:bg-white/20 text-white/90 hover:text-white border border-white/20 shadow-sm'
                            }
                            active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group
                          `}
                          title={currentSpeakingId === index ? t('chat.stopSpeaking') : t('chat.listenInsight', { service: 'Sakae' })}
                          disabled={isGeneratingSpeech && currentSpeakingId !== index}
                        >
                          {currentSpeakingId === index ? (
                            // Animated Sound Wave
                            <div className="flex items-center gap-0.5 h-3">
                              {[1, 2, 3, 4].map((i) => (
                                <motion.div
                                  key={i}
                                  animate={{ 
                                    height: [4, 12, 4],
                                    opacity: [0.5, 1, 0.5]
                                  }}
                                  transition={{ 
                                    repeat: Infinity, 
                                    duration: 0.6, 
                                    delay: i * 0.1,
                                    ease: "easeInOut"
                                  }}
                                  className="w-0.5 bg-white rounded-full"
                                />
                              ))}
                            </div>
                          ) : isGeneratingSpeech ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Volume2 size={14} className="group-hover:scale-110 transition-transform" />
                          )}
                          
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {currentSpeakingId === index ? t('chat.stopSpeaking') : t('chat.listen')}
                          </span>
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-5 p-5">
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="text-[11px] font-bold text-violet-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Star size={14} className="text-violet-700" />
                          {t('chat.whatsGoingWell')}
                        </div>
                        <p className="text-slate-700 text-[14px] leading-relaxed italic font-medium">
                          "{message.feedback.positive}"
                        </p>
                      </motion.div>
                      
                      <div className="h-px bg-gray-100 w-full" />

                      <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <div className="text-[11px] font-bold text-violet-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Sparkles size={14} className="text-violet-700" />
                          {t('chat.focusNextMessages')}
                        </div>
                        <p className="text-slate-700 text-[14px] leading-relaxed">
                          {message.feedback.toImprove}
                        </p>
                      </motion.div>

                      {/* Expandable Details Section */}
                      {message.feedback.specificCorrections && message.feedback.specificCorrections.length > 0 && (
                        <div className="pt-2">
                          <button 
                            onClick={() => setExpandedFeedback(prev => ({ ...prev, [index]: !prev[index] }))}
                            className="flex items-center gap-1 text-[10px] font-bold text-violet-500 uppercase tracking-widest hover:text-violet-700 transition-colors"
                          >
                            {expandedFeedback[index] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {expandedFeedback[index] ? t('chat.hideExamples') : t('chat.seeSpecificExamples')}
                          </button>

                          <AnimatePresence>
                            {expandedFeedback[index] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-3 space-y-3"
                              >
                                {message.feedback.specificCorrections.map((corr, cIdx) => (
                                  <div key={cIdx} className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 space-y-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-red-500 line-through text-xs opacity-70 italic font-medium">
                                        "{corr.original}"
                                      </span>
                                      <ArrowRight size={12} className="text-amber-400" />
                                      <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-1.5 py-0.5 rounded">
                                        "{corr.corrected}"
                                      </span>
                                    </div>
                                    <div className="flex items-start gap-1.5 text-[10px] text-amber-800 leading-tight">
                                      <Lightbulb size={12} className="shrink-0 text-amber-500 mt-0.5" />
                                      <span>{corr.explanation}</span>
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    {/* Simple Bottom Progress Bar Decoration */}
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 10, ease: "linear" }}
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-violet-400 to-fuchsia-500 opacity-50"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {isFeedbackLoading && (
          <div className="flex justify-start items-center gap-3 py-2 px-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 w-fit animate-pulse">
            <Brain size={16} className="text-blue-500" />
            <span className="text-xs font-medium text-blue-600">{t('chat.analyzingProgress')}</span>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
              <div className="flex space-x-1">
                <div className={`w-2 h-2 ${themedColors.text.replace('text-', 'bg-')} rounded-full animate-bounce`}></div>
                <div className={`w-2 h-2 ${themedColors.text.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                <div className={`w-2 h-2 ${themedColors.text.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 p-2 sm:p-3 md:p-4">
        {usageNotice && usageNoticesEnabled && (
          <div
            className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
            style={{
              background: usageNotice.tone === 'danger'
                ? 'rgba(239,68,68,0.12)'
                : usageNotice.tone === 'warning'
                  ? 'rgba(245,158,11,0.12)'
                  : 'rgba(20,184,166,0.12)',
              border: usageNotice.tone === 'danger'
                ? '1px solid rgba(239,68,68,0.28)'
                : usageNotice.tone === 'warning'
                  ? '1px solid rgba(245,158,11,0.28)'
                  : '1px solid rgba(20,184,166,0.28)',
              color: usageNotice.tone === 'danger'
                ? '#fecaca'
                : usageNotice.tone === 'warning'
                  ? '#fde68a'
                  : '#a7f3d0',
            }}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{usageNotice.message}</span>
          </div>
        )}
        {isLimitReached ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative min-w-0 flex-1">
                <input
                  type="text"
                  disabled
                  placeholder={i18n.language === 'en'
                    ? 'Daily limit used'
                    : 'Limite usado hoje'}
                  className="w-full cursor-not-allowed rounded-full border border-violet-300/15 bg-violet-950/25 py-3 pl-10 pr-4 text-sm text-slate-300 shadow-sm placeholder:text-slate-400"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-200">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <button
                disabled
                className="flex h-12 w-12 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-violet-500/50 text-white shadow-lg shadow-violet-950/20"
                aria-label={i18n.language === 'en' ? 'Daily limit reached' : 'Limite diário atingido'}
              >
                <Send size={18} />
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 text-[11px] font-medium text-slate-400">
              <span>{textUsageLabel}</span>
              <span>
                {t('paywall.renewsIn', {
                  time: resetCountdownLabel,
                  defaultValue: `Renova em ${resetCountdownLabel}`,
                })}
              </span>
            </div>
            {usageNoticesEnabled && textUsageLimit !== null && textUsageLimit > 0 && (
              <div className="mx-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${textUsagePercent}%`, background: textUsageProgressColor }}
                  />
                </div>
                <span className="min-w-[42px] text-right text-[11px] font-bold text-slate-300">{textUsagePercentLabel}</span>
              </div>
            )}
          </div>
        ) : (
          <>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative min-w-0 flex-1">
              <input
                type="text"
                value={isRecording ? liveTranscript : input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  isLoading
                    ? t('chat.tutorThinking')
                    : isRecording
                      ? t('chat.listeningSilence')
                      : t('chat.enterMessageOrVoice')
                }
                className={`w-full rounded-full ${isLoading && !isRecording ? 'pl-11' : 'pl-4'} pr-3 py-3 md:py-3 focus:outline-none text-gray-800 border text-base md:text-sm transition-all shadow-sm ${isRecording
                  ? `${themedColors.bgLight} ${themedColors.border} shadow-md`
                  : isLoading
                    ? `${themedColors.bgLight} ${themedColors.border} shadow-md`
                    : topicConfig
                      ? `bg-white border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100`
                      : 'bg-gray-100 border-gray-200 focus:border-blue-300'
                  } ${topicConfig && (isRecording || isLoading) ? topicConfig.borderColor.replace('border-t-', 'border-') : ''}`}
                readOnly={isRecording || isLoading || isTutorResponsePaused}
                disabled={isLoading || isTutorResponsePaused}
              />
              {/* ✅ FIX B10: ícone de mic dentro do input removido — o botão externo vermelho já indica gravação */}
              {isLoading && !isRecording && (
                <div className={`absolute left-4 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center ${themedColors.text}`}>
                  <Brain className="h-4 w-4" />
                </div>
              )}
            </div>
            <button
              onClick={toggleRecording}
              disabled={isLoading || isTutorResponsePaused}
              className={`w-12 h-12 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg shrink-0 transition-all ${isRecording
                ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse scale-105'
                : topicConfig
                  ? `${topicConfig.progressColor} text-white hover:opacity-90 disabled:bg-[var(--border-subtle)] disabled:text-[var(--text-muted)]`
                  : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-[var(--border-subtle)] disabled:text-[var(--text-muted)]'
                }`}
              title={isRecording ? t('chat.tapToStopRecording') : t('chat.tapToStartVoice')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                {isRecording ? (
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                ) : (
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                )}
                {!isRecording && (
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                )}
              </svg>
            </button>
            <button
              onClick={() => handleSend()}
              disabled={isLoading || isTutorResponsePaused || !input.trim()}
              className={`w-12 h-12 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg shrink-0 transition-all ${topicConfig
                ? `${topicConfig.progressColor} text-white hover:opacity-90 disabled:bg-[var(--border-subtle)] disabled:text-[var(--text-muted)]`
                : 'bg-[#4a7cf5] text-white hover:bg-[#3a6ce5] disabled:bg-[var(--border-subtle)] disabled:text-[var(--text-muted)]'
                }`}
            >
              <Send className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
          </div>
          {usageNoticesEnabled && textUsageLimit !== null && textUsageLimit > 0 && (
            <div className="mt-2 flex items-center gap-3 px-4 text-[11px] font-medium text-slate-400">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/30">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${textUsagePercent}%`, background: textUsageProgressColor }}
                />
              </div>
              <span className="shrink-0 font-bold text-slate-300">{textUsagePercentLabel}</span>
              <span className="shrink-0">{textUsageCompactLabel}</span>
            </div>
          )}
          </>
        )}
      </div>

      {/* Settings Modal */}
      {settingsOpen && createPortal(
        <div data-paywall-ignore="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-[150] p-4 md:pl-[240px]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">{t('chat.audioSettings')}</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* TTS Enable/Disable */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">{t('chat.enableSound')}</span>
                  <SettingsTooltip
                    text={
                      i18n.language === 'en'
                        ? 'Automatically reads the tutor messages aloud. Feedback audio remains manual and only plays when you click Listen.'
                        : 'Lê automaticamente as mensagens do tutor. O áudio do feedback continua manual e só toca quando você clicar em Ouvir.'
                    }
                  />
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={ttsEnabled}
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${ttsEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${ttsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <hr className="border-gray-200" />

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-700">
                        {i18n.language === 'en' ? 'Usage indicator and alerts' : 'Indicador e alertas de uso'}
                      </span>
                      <SettingsTooltip
                        text={
                          i18n.language === 'en'
                            ? 'Shows the daily usage percentage and in-chat alerts at 50%, 80%, 90%, and 100% of your text message limit.'
                            : 'Mostra a porcentagem de uso diario e avisos no chat em 50%, 80%, 90% e 100% do limite de mensagens de texto.'
                        }
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {usageNoticesEnabled
                        ? (i18n.language === 'en' ? 'Indicator and alerts are enabled' : 'Indicador e avisos ativados')
                        : (i18n.language === 'en' ? 'Indicator and alerts are disabled' : 'Indicador e avisos desativados')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={usageNoticesEnabled}
                  onClick={() => setUsageNoticesEnabled((currentValue) => !currentValue)}
                  className={`w-12 h-6 rounded-full transition-colors shrink-0 ${usageNoticesEnabled ? 'bg-amber-500' : 'bg-gray-300'}`}
                  title={i18n.language === 'en' ? 'Toggle usage indicator and alerts' : 'Alternar indicador e alertas de uso'}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${usageNoticesEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <hr className="border-gray-200" />

              {/* Feedback presentation preference */}
              {feedbackAvailable ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-2">
                  <Brain className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-700">
                        {i18n.language === 'en' ? 'Open feedback automatically' : 'Abrir feedback automaticamente'}
                      </span>
                      <SettingsTooltip
                        text={
                          i18n.language === 'en'
                            ? 'When enabled, the feedback modal opens as soon as a new analysis is ready. When disabled, a green indicator appears on the corner button so you can open it later.'
                            : 'Quando ativado, o modal abre assim que uma nova análise estiver pronta. Quando desativado, um indicador verde aparece no botão do canto para você abrir depois.'
                        }
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {autoOpenFeedbackModal
                        ? (i18n.language === 'en' ? 'Show the modal when new feedback is ready' : 'Mostrar o modal quando um novo feedback estiver pronto')
                        : (i18n.language === 'en' ? 'Only show the indicator in the corner' : 'Mostrar apenas o indicador no canto')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoOpenFeedbackModal}
                  onClick={() => {
                    setAutoOpenFeedbackModal((currentValue) => {
                      const nextValue = !currentValue;
                      try {
                        localStorage.setItem('sakae_auto_open_feedback_modal', String(nextValue));
                      } catch {
                        // Preference remains active for the current session.
                      }
                      return nextValue;
                    });
                  }}
                  className={`w-12 h-6 rounded-full transition-colors shrink-0 ${autoOpenFeedbackModal ? 'bg-violet-500' : 'bg-gray-300'}`}
                  title={i18n.language === 'en' ? 'Toggle automatic feedback modal' : 'Alternar modal automático de feedback'}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${autoOpenFeedbackModal ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              ) : (
                <div className="flex items-start gap-2 rounded-xl bg-violet-50 px-3 py-2.5 text-sm text-violet-700">
                  <Lock className="w-5 h-5 mt-0.5 shrink-0" />
                  <span>
                    {i18n.language === 'en'
                      ? 'Tutor feedback unlocks from Trial or Standard.'
                      : 'O feedback do tutor libera a partir do Trial ou Standard.'}
                  </span>
                </div>
              )}

              {/* Divider commented out since service selection is hidden
              <hr className="border-gray-200" />
              */}

              {/* Service Selection - Commented out as requested (automatic selection in bg)
              {ttsEnabled && (elevenLabsAvailable || googleCloudAvailable) && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">{t('chat.voiceService')}</p>
                  <div className="space-y-2">
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedService === TTSService.WEB_SPEECH ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="service"
                        checked={selectedService === TTSService.WEB_SPEECH}
                        onChange={() => handleServiceChange(TTSService.WEB_SPEECH)}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-medium text-gray-800">Voz padrão</p>
                        <p className="text-xs text-gray-500">{t('chat.browserVoices')}</p>
                      </div>
                    </label>
                    {elevenLabsAvailable && (
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedService === TTSService.ELEVENLABS ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="service"
                          checked={selectedService === TTSService.ELEVENLABS}
                          onChange={() => handleServiceChange(TTSService.ELEVENLABS)}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-medium text-gray-800">Voz premium</p>
                          <p className="text-xs text-gray-500">{t('chat.premiumVoices')}</p>
                        </div>
                      </label>
                    )}
                    {googleCloudAvailable && (
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedService === TTSService.GOOGLE_CLOUD ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="service"
                          checked={selectedService === TTSService.GOOGLE_CLOUD}
                          onChange={() => handleServiceChange(TTSService.GOOGLE_CLOUD)}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-medium text-gray-800">Voz avançada</p>
                          <p className="text-xs text-gray-500">{t('chat.googleCloudVoices', 'Vozes Neurais Premium')}</p>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              )}
              */}

              {/* Divider commented out since service selection is hidden
              {ttsEnabled && (elevenLabsAvailable || googleCloudAvailable) && <hr className="border-gray-200" />}
              */}

              {/* Tutor Selection */}
              {ttsEnabled && !isLoadingVoices && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <p className="text-sm text-gray-600">{t('chat.yourTutor')}</p>
                    <SettingsTooltip
                      text={
                        i18n.language === 'en'
                          ? 'Changes the tutor avatar and the voice used for regular messages and feedback audio.'
                          : 'Altera o avatar do tutor e a voz usada nas mensagens normais e no áudio do feedback.'
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      title={i18n.language === 'en' ? 'Use Louis and a male tutor voice' : 'Usar Louis e uma voz masculina para o tutor'}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${avatarGender === 'male' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <input
                        type="radio"
                        name="tutor"
                        checked={avatarGender === 'male'}
                        onChange={() => setAvatarGender('male')}
                        className="w-4 h-4"
                      />
                      <div className="flex items-center gap-3">
                        <img src={LOUIS_AVATAR_URL} alt={t('chat.tutorAvatarMale')} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="font-medium text-gray-800">{t('chat.tutorLouis')}</p>
                          <p className="text-xs text-gray-500">{t('chat.male')}</p>
                        </div>
                      </div>
                    </label>
                    <label
                      title={i18n.language === 'en' ? 'Use Sarah and a female tutor voice' : 'Usar Sarah e uma voz feminina para o tutor'}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${avatarGender === 'female' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <input
                        type="radio"
                        name="tutor"
                        checked={avatarGender === 'female'}
                        onChange={() => setAvatarGender('female')}
                        className="w-4 h-4"
                      />
                      <div className="flex items-center gap-3">
                        <img src={SARAH_AVATAR_URL} alt={t('chat.tutorAvatarFemale')} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="font-medium text-gray-800">{t('chat.tutorSarah')}</p>
                          <p className="text-xs text-gray-500">{t('chat.female')}</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}


              {/* Loading indicator */}
              {ttsEnabled && isLoadingVoices && (
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">{t('chat.loadingVoices')}</span>
                </div>
              )}

              {/* Error message */}
              {ttsError && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <span>!</span>
                  <span className="text-sm text-amber-800">{ttsError}</span>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* History Panel */}
      {showHistory && createPortal(
        <div data-paywall-ignore="true" className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[150] ${historyFullscreen ? 'p-0 md:pl-[240px]' : 'p-4 md:pl-[240px]'}`}>
          <div className={`bg-white shadow-2xl w-full flex flex-col overflow-hidden ${historyFullscreen ? 'h-full rounded-2xl' : 'rounded-2xl max-w-2xl max-h-[90vh]'}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800 min-w-0">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : historyConversations.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{t('chat.noConversations')}</p>
                  <p className="text-gray-400 text-sm">{t('chat.startPracticing')}</p>
                </div>
              ) : (
                historyConversations.map((conv) => (
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
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(conv.duration_seconds)}</span>
                          <span className="text-gray-300">•</span>
                          <span>{conversationMessages[conv.id]?.length ?? conv.message_count ?? 0} {t('chat.messages')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void requestDownloadHistoryConversation(conv.id);
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
                      <div className="p-4 space-y-3 max-h-96 overflow-y-auto bg-white border-t">
                        {conversationMessages[conv.id]?.length === 0 ? (
                          <p className="text-gray-400 text-sm text-center py-2">{t('chat.loadingMessages')}</p>
                        ) : (
                          conversationMessages[conv.id]?.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] p-3 rounded-lg ${msg.role === 'user'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}>
                                <div className={`text-xs font-medium mb-1 ${msg.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                                  }`}>
                                  {msg.role === 'user' ? t('chat.youHistory') : t('chat.aiTutorHistory')}
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Feedback Modal */}
      {createPortal(
        <AnimatePresence>
          {showFeedbackModal && activeFeedback && (
            <div data-paywall-ignore="true" className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4 md:pl-[240px] transition-opacity duration-300">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full mx-4 shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col relative max-h-[90vh] overflow-y-auto"
              >
                {/* Close Button */}
                <button
                  onClick={handleCloseFeedbackModal}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors cursor-pointer"
                  title={t('chat.continueConversation')}
                >
                  <X size={20} />
                </button>

                {/* Modal Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pr-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-violet-100 dark:bg-violet-950 rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                      <Brain size={26} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        {t('chat.tutorInsight')}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {t('chat.quickTip')}
                      </p>
                    </div>
                  </div>

                  {/* Listen/Speak Feedback Button */}
                  <button
                    onClick={() => handleSpeakFeedback(`${activeFeedback.vocePercebeuIsso}. ${activeFeedback.euPercebiAlgo}. ${activeFeedback.proximoDesafio}`)}
                    className={`h-9 px-4 rounded-full flex items-center gap-2 text-xs font-semibold transition-all duration-200 cursor-pointer shadow-sm ${
                      isSpeakingFeedback
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/35 hover:bg-red-100 dark:hover:bg-red-950/60'
                        : 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-900/35 hover:bg-violet-100 dark:hover:bg-violet-950/60'
                    }`}
                  >
                    {isSpeakingFeedback ? (
                      <>
                        <VolumeX size={15} />
                        <span>{i18n.language === 'en' ? 'Stop' : 'Parar'}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={15} />
                        <span>{i18n.language === 'en' ? 'Listen' : 'Ouvir'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Modal Content */}
                <div className="space-y-6 flex-1 mb-8 overflow-y-auto pr-1">
                  {/* Você percebeu isso? / Did you notice this? */}
                  <div>
                    <h4 className="text-[11px] font-bold text-violet-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Star size={14} className="text-violet-700" />
                      {i18n.language === 'en' ? 'Did you notice this?' : 'Você percebeu isso?'}
                    </h4>
                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4">
                      <p className="text-slate-700 dark:text-gray-200 text-sm leading-relaxed italic font-medium">
                        "{activeFeedback.vocePercebeuIsso}"
                      </p>
                    </div>
                  </div>

                  {/* Eu percebi algo / I noticed something */}
                  <div>
                    <h4 className="text-[11px] font-bold text-violet-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-violet-700" />
                      {i18n.language === 'en' ? 'I noticed something you might not have seen' : 'Eu percebi algo que talvez você não tenha visto'}
                    </h4>
                    <div className="bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-2xl p-4">
                      <p className="text-slate-700 dark:text-gray-200 text-sm leading-relaxed">
                        {activeFeedback.euPercebiAlgo}
                      </p>
                    </div>
                  </div>

                  {/* Próximo desafio / Next challenge */}
                  <div>
                    <h4 className="text-[11px] font-bold text-violet-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Star size={14} className="text-violet-700" />
                      {i18n.language === 'en' ? 'Next challenge' : 'Próximo desafio'}
                    </h4>
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4">
                      <p className="text-slate-700 dark:text-gray-200 text-sm leading-relaxed font-semibold text-blue-700 dark:text-blue-400">
                        {activeFeedback.proximoDesafio}
                      </p>
                    </div>
                  </div>

                  {/* Specific Corrections / Examples */}
                  {activeFeedback.specificCorrections && activeFeedback.specificCorrections.length > 0 && showModalExamples && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="space-y-3 pt-2"
                    >
                      <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        {t('chat.viewSpecificMistakes')}:
                      </h4>
                      {activeFeedback.specificCorrections.map((corr: any, cIdx: number) => (
                        <div key={cIdx} className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap text-sm">
                            <span className="text-red-500 line-through font-medium">
                              "{corr.original}"
                            </span>
                            <ArrowRight size={14} className="text-amber-400" />
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                              "{corr.corrected}"
                            </span>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                            <Lightbulb size={14} className="shrink-0 text-amber-500 mt-0.5" />
                            <span>{corr.explanation}</span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
      {downloadConfirmation && createPortal(
        <div data-paywall-ignore="true" className="fixed inset-y-0 left-0 right-0 md:left-[240px] z-[210] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDownloadConfirmation(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 p-6">
            <button
              onClick={() => setDownloadConfirmation(null)}
              className="absolute right-4 top-4 h-9 w-9 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors"
              aria-label={t('common.close', { defaultValue: 'Fechar' })}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="h-12 w-12 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>

            <h3 className="text-xl font-extrabold text-gray-900 pr-8">
              {t('chat.confirmDownloadTitle', { defaultValue: 'Baixar conversa?' })}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {t('chat.confirmDownloadDesc', {
                title: downloadTitle,
                count: downloadMessageCount,
                defaultValue: `Você vai baixar "${downloadTitle}" com ${downloadMessageCount} mensagens em um arquivo .txt.`,
              })}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={confirmDownloadConversation}
                disabled={downloadMessageCount === 0}
                className="h-11 flex-1 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold transition-colors"
              >
                {t('chat.confirmDownloadAction', { defaultValue: 'Baixar agora' })}
              </button>
              <button
                onClick={() => setDownloadConfirmation(null)}
                className="h-11 flex-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors"
              >
                {t('common.cancel', { defaultValue: 'Cancelar' })}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      <EntitlementPaywallModal
        decision={paywallModalDecision}
        onClose={() => setPaywallModalDecision(null)}
      />
      {sessionSummary && (
        <SessionSummaryModal
          xpGained={sessionSummary.xp}
          durationSeconds={sessionSummary.duration}
          isVoice={false}
          currentLevel={level}
          currentXp={totalXp}
          xpToNextLevel={xpToNextLevel}
          currentLevelXp={currentLevelXp}
          levelXpRange={levelXpRange}
          onDismiss={() => setSessionSummary(null)}
        />
      )}
    </div>
  );
};

export default TextChatUI;
