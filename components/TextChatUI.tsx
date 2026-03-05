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
import { Link } from 'react-router-dom';
import { sendChatMessage } from '../services/geminiService';
import { ChatScenario, MessageWithCorrections } from '../types';
import { getWelcomeMessage } from '../src/prompts/builders/promptBuilder';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseCorrectionsFromResponse } from '../utils/correctionParser';
import { Sparkles, ArrowRight, Lightbulb, Volume2, Mic, MicOff, Send, Loader2, Brain, History, X, ChevronRight, Clock } from 'lucide-react';
import { conversationService, Conversation, Message } from '../services/conversationService';
import { contextService } from '../services/contextService';
import { useUser } from '../context/UserContext';
import {
  TTSService,
  TTSVoice,
  TTSConfig,
  TTSServiceFactory,
  getServiceName,
} from '../services/tts';
import { TopicSlugConfig } from '../constants/topicSlugs';

/**
 * TTS Service Support:
 * - Web Speech API: Browser's built-in TTS (always available)
 * - ElevenLabs: Cloud-based TTS with high-quality voices (requires API key)
 */

// ============================================================================
// CONSTANTS
// ============================================================================

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

// Fixed Web Speech voices (will be dynamically selected from available voices)
// These are fallback defaults - actual voices will be selected based on availability
const WEB_SPEECH_MALE_DEFAULT = 'Google US English'; // Common male voice name
const WEB_SPEECH_FEMALE_DEFAULT = 'Google US English Female'; // Common female voice name

const MAX_HISTORY_MESSAGES = 10;
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

const detectQuestion = (text: string): boolean => {
  const trimmed = text.trim().toLowerCase();
  const questionStarters = ['what', 'where', 'who', 'how', 'why', 'when', 'which', 'whose', 'whom', 'can', 'could', 'would', 'should', 'will', 'do', 'does', 'did', 'is', 'are', 'am', 'was', 'were', 'have', 'has', 'had'];
  const firstWord = trimmed.split(/\s+/)[0];
  if (questionStarters.includes(firstWord)) {
    return true;
  }
  return false;
};

const addPunctuation = (text: string): string => {
  const trimmed = text.trim();
  if (detectQuestion(trimmed)) {
    return trimmed.endsWith('?') ? trimmed : trimmed + '?';
  }
  return trimmed.endsWith('.') ? trimmed : trimmed + '.';
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
}

// ============================================================================
// COMPONENT
// ============================================================================

// Helper function to get consistent user ID
const getUserId = (user: { id?: string; name?: string } | null): string => {
  if (!user) return 'guest';
  return user.id || user.name || 'guest';
};

const TextChatUI: React.FC<TextChatUIProps> = ({ scenario, topicConfig, backTo }) => {
  const { user } = useUser();
  const userId = getUserId(user);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<MessageWithCorrections[]>([]);
  const [isWelcomeLoading, setIsWelcomeLoading] = useState(true);
  const [correctionsEnabled, setCorrectionsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Conversation tracking for Supabase
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const conversationStartTime = useRef<Date | null>(null);
  const lastSavedUserMessage = useRef<string>('');
  const lastSavedAiMessage = useRef<string>('');

  // Prevent duplicate message sends
  const isSendingRef = useRef(false);

  // TTS States
  const [currentSpeakingId, setCurrentSpeakingId] = useState<number | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [selectedService, setSelectedService] = useState<TTSService>(TTSService.WEB_SPEECH);
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

  // Avatar gender state
  const [avatarGender, setAvatarGender] = useState<'male' | 'female'>('male');

  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false);

  // History panel state
  const [showHistory, setShowHistory] = useState(false);
  const [historyFullscreen, setHistoryFullscreen] = useState(false);
  const [historyConversations, setHistoryConversations] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedConversationId, setExpandedConversationId] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Record<string, Message[]>>({});

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

  const loadRAGContext = async () => {
    if (!userId) return;
    setLoadingRagContext(true);
    try {
      const context = await contextService.getRAGContext(userId, scenarioString);
      setRagContext(context);
      console.log('[TextChatUI] RAG Context loaded:', {
        hasProfile: !!context.userProfile,
        recentMessages: context.recentMessages.length,
        previousSummaries: context.previousConversationsSummary.length,
        level: context.learningFocus.currentLevel,
      });
    } catch (error) {
      console.error('[TextChatUI] Error loading RAG context:', error);
    } finally {
      setLoadingRagContext(false);
    }
  };

  // Load conversations when history panel opens
  useEffect(() => {
    if (showHistory && userId) {
      loadConversationsByScenario();
    }
  }, [showHistory, userId]);

  const loadConversationsByScenario = async () => {
    if (!userId) return;
    setLoadingHistory(true);
    try {
      // Get strictly by specific scenario to avoid mixing contexts (e.g. Job Interviews showing in Phone Screen)
      const data = await conversationService.getConversationsByScenario(userId, scenarioString, 20);

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
    if (!seconds) return '0m';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Themed colors based on topic configuration
  const themedColors = useMemo(() => getThemedColors(topicConfig), [topicConfig]);

  // Initialize ElevenLabs API key from environment
  useEffect(() => {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (apiKey) {
      TTSServiceFactory.setElevenLabsApiKey(apiKey);
      setElevenLabsAvailable(true);
    }
  }, []);

  // TTS Functions
  const speakText = useCallback(async (text: string, messageId: number) => {
    if (!ttsEnabled || !selectedVoice) {
      console.log('TTS skipped: ttsEnabled=', ttsEnabled, 'selectedVoice=', selectedVoice);
      return;
    }

    // Validate voice has an ID
    if (!selectedVoice.id) {
      console.error('Selected voice has no ID:', selectedVoice);
      setTtsError('Please select a valid voice');
      return;
    }

    // Stop any current speech
    stopSpeech();

    setCurrentSpeakingId(messageId);
    setIsGeneratingSpeech(true);
    setTtsError(null);

    try {
      const service = TTSServiceFactory.create(selectedService);

      await service.speak(text, selectedVoice, {
        service: selectedService,
        voice: selectedVoice,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
      }, {
        onStart: () => {
          setCurrentSpeakingId(messageId);
        },
        onEnd: () => {
          setCurrentSpeakingId(null);
          setIsGeneratingSpeech(false);
        },
        onError: (error) => {
          console.error('TTS playback error:', error);
          setCurrentSpeakingId(null);
          setIsGeneratingSpeech(false);
          setTtsError('Speech playback failed');
        },
      });
    } catch (error) {
      console.error('TTS error:', error);
      setCurrentSpeakingId(null);
      setIsGeneratingSpeech(false);
      setTtsError(error instanceof Error ? error.message : 'Speech playback failed');
    }
  }, [ttsEnabled, selectedVoice, selectedService]);

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
    setCurrentSpeakingId(null);
    setIsGeneratingSpeech(false);
  }, [elevenLabsAvailable]);

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

      // Restore saved voice or select default
      const savedVoiceId = localStorage.getItem('preferredVoiceId');
      const savedService = localStorage.getItem('preferredTTSService') as TTSService | null;

      // Determine which voices to use based on saved service or availability
      let voicesToUse = englishWebVoices;
      let serviceToUse = TTSService.WEB_SPEECH;

      if (savedService === TTSService.ELEVENLABS && englishElevenLabsVoices.length > 0) {
        voicesToUse = englishElevenLabsVoices;
        serviceToUse = TTSService.ELEVENLABS;
      }

      setSelectedService(serviceToUse);

      if (savedVoiceId) {
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
      } else {
        console.warn('Failed to select default voice');
        setTtsError('No English voices available');
      }

      setVoicesLoaded(true);
    } catch (error) {
      console.error('Failed to load voices:', error);
      setTtsError('Failed to load voices');
      setVoicesLoaded(false);
    } finally {
      setIsLoadingVoices(false);
    }
  }, [elevenLabsAvailable]);

  const handleVoiceChange = useCallback((voiceId: string) => {
    // Look in both voice arrays
    const webVoice = webSpeechVoices.find(v => v.id === voiceId);
    const elevenVoice = elevenLabsVoices.find(v => v.id === voiceId);
    const voice = webVoice || elevenVoice;

    if (voice) {
      setSelectedVoice(voice);
      setSelectedService(voice.service);
      localStorage.setItem('preferredVoiceId', voice.id);
      localStorage.setItem('preferredTTSService', voice.service);
    }
  }, [webSpeechVoices, elevenLabsVoices]);

  const handleServiceChange = useCallback((service: TTSService) => {
    setSelectedService(service);
    localStorage.setItem('preferredTTSService', service);

    // Select first voice from new service
    const voices = service === TTSService.ELEVENLABS ? elevenLabsVoices : webSpeechVoices;
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
      setTtsError(`No voices available for ${getServiceName(service)}`);
    }
  }, [webSpeechVoices, elevenLabsVoices]);

  // Auto-switch voice when avatar gender changes (works for both services)
  // ElevenLabs: Louis = Adam, Sarah = Aria
  // Web Speech: Selects first available male/female voice
  useEffect(() => {
    if (!voicesLoaded) return;

    if (selectedService === TTSService.ELEVENLABS) {
      // Use fixed ElevenLabs voices
      const fixedVoice = avatarGender === 'male' ? ELEVENLABS_VOICE_LOUIS : ELEVENLABS_VOICE_SARAH;
      setSelectedVoice(fixedVoice);
      localStorage.setItem('preferredVoiceId', fixedVoice.id);
      console.log('ElevenLabs voice set to:', fixedVoice.name, 'for', avatarGender);
    } else if (selectedService === TTSService.WEB_SPEECH) {
      // Select first available Web Speech voice of correct gender
      const genderVoices = avatarGender === 'male' ? webSpeechMaleVoices : webSpeechFemaleVoices;

      if (genderVoices.length > 0 && genderVoices[0].id) {
        const newVoice = genderVoices[0];
        if (newVoice.id !== selectedVoice?.id) {
          setSelectedVoice(newVoice);
          localStorage.setItem('preferredVoiceId', newVoice.id);
          console.log('Web Speech voice set to:', newVoice.name, 'for', avatarGender);
        }
      } else {
        // Fallback to any English voice if gender-specific not found
        const fallbackVoice = webSpeechVoices.find(v => v.language.startsWith('en-US')) || webSpeechVoices[0];
        if (fallbackVoice && fallbackVoice.id !== selectedVoice?.id) {
          setSelectedVoice(fallbackVoice);
          localStorage.setItem('preferredVoiceId', fallbackVoice.id);
          console.log('Web Speech fallback voice set to:', fallbackVoice.name);
        }
      }
    }
  }, [avatarGender, selectedService, voicesLoaded, webSpeechMaleVoices, webSpeechFemaleVoices, webSpeechVoices, selectedVoice]);


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
        .then(() => console.log('[TextChatUI] User message saved'))
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
        ).catch(err => console.error('[TextChatUI] Error processing RAG context:', err));
      }
    };
  }, [currentConversationId, scenarioString]);

  // Download conversation as text file
  const downloadConversation = () => {
    if (!messages.length) return;

    const scenarioName = scenario?.name || 'Chat';
    const date = new Date().toLocaleDateString('pt-BR');

    let content = `=${scenarioName}=\nData: ${date}\n\n`;

    messages.forEach(msg => {
      const sender = msg.sender === 'user' ? 'Você' : 'IA';
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

  // Download a conversation from history
  const downloadHistoryConversation = (convId: string) => {
    const convMessages = conversationMessages[convId];
    const conv = historyConversations.find(c => c.id === convId);
    if (!convMessages || !conv || convMessages.length === 0) return;

    const scenarioTitle = conv.scenario.replace(/-/g, ' ');

    let content = `=${scenarioTitle.toUpperCase()}=\n`;
    content += `Data: ${formatDate(conv.started_at)}\n`;
    content += `Duração: ${formatDuration(conv.duration_seconds)}\n`;
    content += `${'='.repeat(40)}\n\n`;

    convMessages.forEach(msg => {
      const sender = msg.role === 'user' ? 'VOCÊ' : 'IA (TUTOR)';
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

  // Welcome message - load only, don't speak yet
  useEffect(() => {
    (async () => {
      setIsWelcomeLoading(true);
      try {
        const welcomeMsg = scenario
          ? await getWelcomeMessage(scenario)
          : "Hi there 👋 If you need any assistance, I'm always here.";
        setMessages([{ sender: 'ai', text: welcomeMsg }]);
      } catch (error) {
        setMessages([{ sender: 'ai', text: "Hi there! 👋" }]);
      } finally {
        setIsWelcomeLoading(false);
      }
    })();
  }, [scenario]);

  // Speak welcome message ONLY after voices are fully loaded
  useEffect(() => {
    // Only speak the welcome message once when:
    // 1. Voices have just finished loading (voicesLoaded transition from false to true)
    // 2. We have a valid selected voice
    // 3. TTS is enabled
    // 4. There's exactly one message (the welcome message)
    // 5. We haven't spoken the welcome message yet in this session
    if (voicesLoaded && selectedVoice && ttsEnabled && messages.length === 1 && messages[0].sender === 'ai') {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        speakText(messages[0].text, 0);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [voicesLoaded, selectedVoice, ttsEnabled, messages, speakText]);

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

  const geminiClient = useMemo(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenerativeAI(apiKey);
  }, []);

  const sessionTranscriptRef = useRef<string>('');
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
    loadAllVoices();
  }, [loadAllVoices]);

  // TTS: Cleanup speech on unmount
  useEffect(() => {
    return () => stopSpeech();
  }, [stopSpeech]);

  const handleSend = useCallback(async () => {
    // Prevent duplicate sends
    if (!input.trim() || isLoading || isSendingRef.current) return;

    // Set sending flag
    isSendingRef.current = true;

    // TTS: Stop current speech when sending message
    stopSpeech();

    const userMessage: MessageWithCorrections = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
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
        correctionsEnabled,
        ragContext || undefined,
      );
      const { corrections, cleanedText } = parseCorrectionsFromResponse(aiResponse);
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: cleanedText, corrections: correctionsEnabled ? corrections : undefined },
      ]);

      // TTS: Speak AI response
      const newMessageIndex = currentMessages.length + 1;
      setTimeout(() => {
        if (ttsEnabled && window.speechSynthesis) {
          speakText(cleanedText, newMessageIndex);
        }
      }, 100);
    } catch (error) {
      const errorMsg = 'Sorry, there was an error. Please try again.';
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
  }, [input, isLoading, scenario, correctionsEnabled, ttsEnabled, speakText, stopSpeech, messagesRef]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    if (!geminiClient) {
      throw new Error('Gemini API key not found.');
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const base64Audio = await audioBlobToBase64(audioBlob);
    const model = geminiClient.getGenerativeModel({ model: TRANSCRIPTION_MODEL });
    const prompt = 'Transcribe the following audio to text. Only return the transcribed text, nothing else.';
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
    sessionTranscriptRef.current = '';
    setLiveTranscript('');
    lastTranscriptRef.current = '';
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            sessionTranscriptRef.current += (sessionTranscriptRef.current ? ' ' : '') + transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        const fullTranscript = sessionTranscriptRef.current + (interimTranscript ? ' ' + interimTranscript : '');
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
        const currentTranscript = lastTranscriptRef.current;
        if (isRecordingRef.current && currentTranscript.trim()) {
          let finalTranscript = currentTranscript.trim();
          setLiveTranscript('');
          lastTranscriptRef.current = '';
          try {
            finalTranscript = addPunctuation(finalTranscript);

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
              correctionsEnabled,
              ragContext || undefined,
            );
            const { corrections, cleanedText } = parseCorrectionsFromResponse(aiResponse);
            setMessages((prev) => [
              ...prev,
              { sender: 'ai', text: cleanedText, corrections: correctionsEnabled ? corrections : undefined },
            ]);

            // O useEffect global cuidará de salvar as mensagens no banco de dados automaticamente.

            // TTS: Speak AI response (voice input)
            const newMessageIndex = currentMessages.length + 1;
            setTimeout(() => {
              if (ttsEnabled && window.speechSynthesis) {
                speakText(cleanedText, newMessageIndex);
              }
            }, 100);
          } catch (error) {
            const errorMsg = 'Sorry, there was an error. Please try again.';
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
          }
        }
        setIsRecording(false);
        isRecordingRef.current = false;
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
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className={`w-full rounded-2xl shadow-xl overflow-hidden transition-all hover:shadow-2xl flex flex-col ${topicConfig ? `border-t-4 ${topicConfig.borderColor}` : ''} ${topicConfig ? 'h-[600px]' : 'h-full max-h-screen'} bg-gray-50`}>
      {/* Card Header */}
      <div className={`p-6 pb-4 flex items-center justify-between ${topicConfig ? 'bg-white border-b border-gray-100' : 'bg-gradient-to-r from-[#4a7cf5] to-[#6b9cf7] text-white'}`}>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${topicConfig ? 'border-2 border-white shadow-md' : 'bg-white/20 border-2 border-white/30'}`}>
              <img
                src={avatarGender === 'male' ? LOUIS_AVATAR_URL : SARAH_AVATAR_URL}
                alt="Tutor Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white"></div>
          </div>

          {/* Title */}
          <div>
            <h3 className={`font-bold text-lg ${topicConfig ? 'text-gray-800' : 'text-white'}`}>
              {topicConfig ? topicConfig.title : (avatarGender === 'male' ? 'Louis' : 'Sarah')}
            </h3>
            <p className={`text-sm ${topicConfig ? 'text-gray-500' : 'text-white/80'}`}>
              {topicConfig ? topicConfig.description : 'Your AI Tutor'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* History button */}
          <button
            onClick={() => setShowHistory(true)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${topicConfig ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/20 hover:bg-white/30 border border-white/30'}`}
            title="Ver histórico"
          >
            <History className={`h-5 w-5 ${topicConfig ? 'text-gray-600' : 'text-white'}`} />
          </button>

          {/* Download button */}
          <button
            onClick={downloadConversation}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${topicConfig ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/20 hover:bg-white/30 border border-white/30'}`}
            title="Baixar conversa"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${topicConfig ? 'text-gray-600' : 'text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>

          {/* Settings button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${topicConfig ? 'bg-gray-100 hover:bg-gray-200' : 'bg-white/20 hover:bg-white/30 border border-white/30'}`}
            title="Configurações de áudio"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${topicConfig ? 'text-gray-600' : 'text-white'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isWelcomeLoading && messages.length === 0 && (
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
              <div className="flex items-start justify-between gap-2">
                <p className="text-base sm:text-[15px] whitespace-pre-wrap flex-1">{message.text}</p>

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
                    title={currentSpeakingId === index ? 'Stop' : `Listen again (${getServiceName(selectedService)})`}
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

              {/* Corrections */}
              {message.sender === 'ai' && message.corrections && message.corrections.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-amber-100">
                  <div className="text-[11px] font-medium text-amber-600/90 mb-1.5 flex items-center gap-1">
                    <Sparkles size={11} />
                    <span>Tip</span>
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
            </div>
          </div>
        ))}

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
      <div className="bg-white border-t border-gray-100 px-4 py-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={isRecording ? liveTranscript : input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isLoading
                  ? 'Tutor is thinking...'
                  : isRecording
                    ? 'Listening... (stops after 3s of silence)'
                    : 'Enter your message or use voice...'
              }
              className={`w-full rounded-full pl-12 pr-5 py-4 sm:pl-10 sm:pr-4 sm:py-3 focus:outline-none text-gray-800 border text-base sm:text-sm transition-all shadow-sm ${isRecording
                ? `${themedColors.bgLight} ${themedColors.border} shadow-md`
                : isLoading
                  ? `${themedColors.bgLight} ${themedColors.border} shadow-md`
                  : topicConfig
                    ? `bg-white border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100`
                    : 'bg-gray-100 border-gray-200 focus:border-blue-300'
                } ${topicConfig && (isRecording || isLoading) ? topicConfig.borderColor.replace('border-t-', 'border-') : ''}`}
              readOnly={isRecording || isLoading}
              disabled={isLoading}
            />
            {isRecording && (
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${themedColors.text}`}>
                <Mic className="h-5 w-5 animate-pulse" />
              </div>
            )}
            {isLoading && !isRecording && (
              <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${themedColors.text}`}>
                <Brain className="h-5 w-5 animate-pulse" />
              </div>
            )}
          </div>
          <button
            onClick={toggleRecording}
            disabled={isLoading}
            className={`w-14 h-14 sm:w-12 sm:h-12 text-white rounded-full flex items-center justify-center shadow-lg shrink-0 transition-all ${isRecording
              ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-105'
              : topicConfig
                ? `${topicConfig.progressColor} hover:opacity-90 disabled:bg-gray-300`
                : 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300'
              }`}
            title={isRecording ? 'Tap to stop recording' : 'Tap to start voice input'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor">
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
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`w-14 h-14 sm:w-12 sm:h-12 text-white rounded-full flex items-center justify-center shadow-lg ${topicConfig
              ? `${topicConfig.progressColor} hover:opacity-90 disabled:bg-gray-300`
              : 'bg-[#4a7cf5] hover:bg-[#3a6ce5] disabled:bg-gray-300'
              }`}
          >
            <Send className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Configurações de Áudio</h2>
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
                  <span className="text-gray-700">Ativar som</span>
                </div>
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${ttsEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${ttsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Divider */}
              <hr className="border-gray-200" />

              {/* Service Selection */}
              {ttsEnabled && elevenLabsAvailable && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Serviço de voz:</p>
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
                        <p className="font-medium text-gray-800">Web Speech API</p>
                        <p className="text-xs text-gray-500">Vozes do navegador (gratuito)</p>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedService === TTSService.ELEVENLABS ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="service"
                        checked={selectedService === TTSService.ELEVENLABS}
                        onChange={() => handleServiceChange(TTSService.ELEVENLABS)}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-medium text-gray-800">ElevenLabs</p>
                        <p className="text-xs text-gray-500">Vozes premium (alta qualidade)</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Divider */}
              {ttsEnabled && elevenLabsAvailable && <hr className="border-gray-200" />}

              {/* Tutor Selection */}
              {ttsEnabled && !isLoadingVoices && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Seu tutor:</p>
                  <div className="space-y-2">
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${avatarGender === 'male' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="tutor"
                        checked={avatarGender === 'male'}
                        onChange={() => setAvatarGender('male')}
                        className="w-4 h-4"
                      />
                      <div className="flex items-center gap-3">
                        <img src={LOUIS_AVATAR_URL} alt="Louis" className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="font-medium text-gray-800">Louis</p>
                          <p className="text-xs text-gray-500">Masculino</p>
                        </div>
                      </div>
                    </label>
                    <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${avatarGender === 'female' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="tutor"
                        checked={avatarGender === 'female'}
                        onChange={() => setAvatarGender('female')}
                        className="w-4 h-4"
                      />
                      <div className="flex items-center gap-3">
                        <img src={SARAH_AVATAR_URL} alt="Sarah" className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="font-medium text-gray-800">Sarah</p>
                          <p className="text-xs text-gray-500">Feminino</p>
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
                  <span className="text-sm">Carregando vozes...</span>
                </div>
              )}

              {/* Error message */}
              {ttsError && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <span>⚠️</span>
                  <span className="text-sm text-amber-800">{ttsError}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 ${historyFullscreen ? 'p-0' : 'p-4'}`}>
          <div className={`bg-white shadow-2xl w-full flex flex-col ${historyFullscreen ? 'h-full rounded-none' : 'rounded-2xl max-w-2xl max-h-[90vh]'}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Histórico de Conversas</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHistoryFullscreen(!historyFullscreen)}
                  className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
                  title={historyFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
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
                  <p className="text-gray-500">Nenhuma conversa ainda.</p>
                  <p className="text-gray-400 text-sm">Comece a praticar!</p>
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
                          <span>{conversationMessages[conv.id]?.length || 0} mensagens</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadHistoryConversation(conv.id);
                          }}
                          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Baixar conversa"
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
                          <p className="text-gray-400 text-sm text-center py-2">Carregando mensagens...</p>
                        ) : (
                          conversationMessages[conv.id]?.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] p-3 rounded-lg ${msg.role === 'user'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}>
                                <div className={`text-xs font-medium mb-1 ${msg.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                                  }`}>
                                  {msg.role === 'user' ? 'Você' : 'IA Tutor'}
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
        </div>
      )}
    </div>
  );
};

export default TextChatUI;
