/**
 * Gemini AI Service
 *
 * Service layer for interacting with Google's Gemini AI API.
 * Provides text-based chat functionality with context-aware prompts and scenario-based conversations.
 *
 * @fileoverview This service handles all communications with the Gemini API, including
 * chat message processing, prompt building, and error handling for AI interactions.
 *
 * @dependencies @google/genai, ../types, ../src/prompts/builders/promptBuilder
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatScenario, GrammarCorrection } from '../types';
import { buildPrompt, buildPromptWithCorrectionMode, getWelcomeMessage, normalizeEnglishLevel } from '../src/prompts/builders/promptBuilder';
import { buildRAGPrompt, RAGContext } from './contextBuilder';
import { usageMetricsService } from './usageMetricsService';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Gemini API key from environment variables.
 * In Vite, environment variables must be prefixed with VITE_ to be accessible.
 *
 * @constant {string | undefined}
 */
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const QWEN_API_KEY = import.meta.env.VITE_QWEN_API_KEY;
let qwenDirectDisabledReason: string | null = null;

const isQwenAuthError = (status: number, body: string): boolean => {
  return status === 401 ||
    status === 403 ||
    /invalid_api_key|incorrect api key|apikey-error/i.test(body);
};

/**
 * Validation check for API key presence.
 * Logs warnings if the API key is missing to help with debugging.
 */
if (!API_KEY) {
  console.warn('⚠️ VITE_GEMINI_API_KEY not found in .env file');
  console.warn('Create a .env file with: VITE_GEMINI_API_KEY=your_key_here');
}

/**
 * Initialized Gemini AI client instance.
 * Configured with the API key for making requests to Google's Gemini API.
 *
 * @constant {GoogleGenerativeAI}
 */
const genAI = new GoogleGenerativeAI(API_KEY || '');

/**
 * Helper to call OpenRouter API as a robust fallback.
 * Uses fetch directly to ensure seamless integration and no extra dependencies.
 */
export async function callOpenRouterFallback(prompt: string, jsonMode = false): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is not configured.');
  }

  console.log('[OpenRouter Fallback] Initiating request to OpenRouter...');
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        'X-Title': 'Sakae E-Learning',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        response_format: jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    const duration = Date.now() - startTime;
    usageMetricsService.logCall('OpenRouter', 'chat/completions', response.status, duration);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const choiceText = data?.choices?.[0]?.message?.content;
    if (!choiceText) {
      throw new Error('Invalid response structure from OpenRouter');
    }

    console.log('[OpenRouter Fallback] Success! Got completion from OpenRouter.');
    return choiceText.trim();
  } catch (error) {
    const duration = Date.now() - startTime;
    usageMetricsService.logCall('OpenRouter', 'chat/completions', 500, duration);
    throw error;
  }
}

/**
 * Helper to call Qwen directly via Alibaba DashScope API (supporting both domestic and international endpoints).
 */
export async function fetchQwenChatCompletion(prompt: string, model: string = 'qwen-plus', maxTokens: number = 500, jsonMode = false): Promise<string> {
  if (!QWEN_API_KEY) {
    throw new Error('Qwen API key is not configured.');
  }

  if (qwenDirectDisabledReason) {
    throw new Error(`Qwen direct API disabled for this session: ${qwenDirectDisabledReason}`);
  }

  const endpoints = [
    'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions'
  ];

  let lastError: any = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`[GeminiService] Attempting direct request to Qwen at: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${QWEN_API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          response_format: jsonMode ? { type: 'json_object' } : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const choiceText = data?.choices?.[0]?.message?.content;
        if (choiceText) {
          return choiceText.trim();
        }
        throw new Error('Invalid response structure from Qwen');
      } else {
        const errText = await response.text();
        if (isQwenAuthError(response.status, errText)) {
          qwenDirectDisabledReason = 'invalid_api_key';
          throw new Error(`Qwen direct API key rejected with ${response.status}. Check VITE_QWEN_API_KEY.`);
        }
        lastError = new Error(`Qwen endpoint ${endpoint} returned ${response.status}: ${errText}`);
        console.warn(`[GeminiService] Qwen endpoint ${endpoint} failed:`, errText);
      }
    } catch (error) {
      lastError = error;
      if (qwenDirectDisabledReason) {
        console.warn('[GeminiService] Qwen direct API key rejected. Skipping direct Qwen until reload.');
        throw error;
      }
      console.warn(`[GeminiService] Failed to fetch from Qwen endpoint ${endpoint}:`, error);
    }
  }

  throw lastError || new Error('All Qwen endpoints failed');
}

/**
 * Helper to call Qwen directly via Alibaba DashScope API.
 */
export async function callQwenFallback(prompt: string, jsonMode = false): Promise<string> {
  console.log('[Qwen Fallback] Initiating direct request to Qwen (Alibaba DashScope)...');
  const result = await fetchQwenChatCompletion(prompt, 'qwen-plus', 1000, jsonMode);
  console.log('[Qwen Fallback] Success! Got completion directly from Qwen.');
  return result;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Fetches a daily English learning tip from the AI.
 * Uses Gemini to generate practical and encouraging learning tips.
 *
 * @async
 * @function getTipOfTheDay
 * @returns {Promise<string>} A short, practical English learning tip.
 * Returns an error message if the request fails.
 *
 * @throws {Error} When the API request fails (caught and handled internally)
 *
 * @example
 * ```ts
 * const tip = await getTipOfTheDay();
 * console.log(tip); // "Try to learn 5 new words every day..."
 * ```
 */
export const getTipOfTheDay = async (lang: string = 'en'): Promise<string> => {
  const todayStr = new Date().toISOString().split('T')[0];
  const cacheKey = `sakae:tip_of_the_day:${todayStr}:${lang}`;
  
  try {
    const cachedTip = localStorage.getItem(cacheKey);
    if (cachedTip) {
      console.log('[GeminiService] Tip of the day loaded from cache:', todayStr);
      return cachedTip;
    }
  } catch { /* ignore localstorage quota/disabled */ }

  const languageNames: Record<string, string> = {
    pt: 'Portuguese',
    es: 'Spanish',
    en: 'English'
  };
  const targetLanguage = languageNames[lang] || 'English';
  const prompt = `Provide a short, interesting English learning tip of the day. Make it practical and encouraging. Write the response entirely in ${targetLanguage}.`;
  
  let tipText = '';
  // Try Qwen via OpenRouter first as requested
  if (OPENROUTER_API_KEY) {
    try {
      console.log('[GeminiService] Fetching tip of the day using Qwen on OpenRouter...');
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
          'X-Title': 'Sakae E-Learning',
        },
        body: JSON.stringify({
          model: 'qwen/qwen-2.5-72b-instruct',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const choiceText = data?.choices?.[0]?.message?.content;
        if (choiceText) {
          tipText = choiceText.trim();
        }
      }
    } catch (error) {
      console.warn('[GeminiService] Qwen OpenRouter failed for tip of the day. Falling back to Gemini...', error);
    }
  }

  if (!tipText) {
    // Fallback to Gemini if OpenRouter/Qwen fails
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const response = await model.generateContent(prompt);
      tipText = response.response.text();
    } catch (error) {
      console.warn('[GeminiService] Gemini failed for tip of the day. Attempting OpenRouter Gemini fallback...', error);
      try {
        tipText = await callOpenRouterFallback(prompt);
      } catch (orError) {
        console.error('[GeminiService] All models failed for tip of the day:', orError);
        tipText = 'Could not fetch a tip right now. Please try again later.';
      }
    }
  }

  // Cache the generated tip for today
  if (tipText && tipText !== 'Could not fetch a tip right now. Please try again later.') {
    try {
      localStorage.setItem(cacheKey, tipText);
    } catch { /* ignore quota */ }
  }

  return tipText;
};

/**
 * Sends a chat message to the AI and receives a response.
 * Supports both generic chat and scenario-based conversations with context awareness.
 *
 * @async
 * @function sendChatMessage
 * @param {string} message - The user's message to send to the AI
 * @param {string[]} [conversationHistory=[]] - Array of previous messages for context.
 * Format: ["User: Hello", "Tutor: Hi there", "User: How are you?"]
 * @param {ChatScenario} [scenario] - Optional scenario ID for specialized conversations.
 * Uses generic tutor behavior if not provided.
 * @param {boolean} [correctionsEnabled=true] - Whether grammar corrections are enabled.
 * @param {RAGContext} [ragContext] - Optional RAG context for personalized responses.
 *
 * @returns {Promise<string>} The AI's response to the message.
 * Returns an error message if the request fails.
 *
 * @throws {Error} When the API request fails (caught and handled internally)
 *
 * @example
 * ```ts
 * // Generic chat
 * const response = await sendChatMessage("Hello, how are you?");
 *
 * // Scenario-based chat with history
 * const history = ["User: I'm preparing for a job interview", "Tutor: That's great! Let's practice."];
 * const response = await sendChatMessage("What should I expect?", history, ChatScenario.JOB_INTERVIEWS, true);
 * ```
 */
export const sendChatMessage = async (
  message: string,
  conversationHistory: string[] = [],
  scenario?: ChatScenario,
  correctionsEnabled: boolean = true,
  ragContext?: RAGContext,
  customSystemPrompt?: string
): Promise<string> => {
  try {
    const scenarioString = scenario?.toString() || 'real-life';

    // Generic conversation mode (legacy behavior)
    if (!scenario && !customSystemPrompt) {
      const basePrompt = `You are an AI English tutor. `;
      const fallbackPrompt =
        conversationHistory.length > 0
          ? `${basePrompt}Continue this conversation:\n${conversationHistory.join('\n')}\nUser: ${message}\nTutor:`
          : `${basePrompt}Respond to this message: ${message}`;

      try {
        const startTime = Date.now();
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const response = await model.generateContent(fallbackPrompt);
        const duration = Date.now() - startTime;
        usageMetricsService.logCall('Gemini', 'generateContent (Generic)', 200, duration);
        return response.response.text();
      } catch (geminiError) {
        usageMetricsService.logCall('Gemini', 'generateContent (Generic Failed)', 500, 0);
        console.warn('[GeminiService] Gemini generic chat failed. Attempting OpenRouter fallback...', geminiError);
        try {
          return await callOpenRouterFallback(fallbackPrompt);
        } catch (orError) {
          console.error('[GeminiService] Both Gemini and OpenRouter failed for generic chat:', orError);
          throw geminiError;
        }
      }
    }

    // Scenario-based conversation (new behavior with prompt builder)
    let systemPrompt = customSystemPrompt || buildPromptWithCorrectionMode(scenario!, correctionsEnabled);

    if (customSystemPrompt && correctionsEnabled) {
      systemPrompt = `${systemPrompt}

---

## Grammar Correction Mode

When the user makes grammar or vocabulary errors:
1. Respond naturally to their message first
2. AFTER your response, add corrections in this EXACT format:
   <CORRECTION>{"original":"me go store","corrected":"I'm going to the store","explanation":"Need subject pronoun"}</CORRECTION>
3. Maximum 2 corrections per message
4. Focus on errors that affect communication
5. Be encouraging and supportive

The correction block will be parsed and displayed separately to the user.
`;
    }

    // If RAG context is available, enhance the prompt with personalized context
    if (ragContext) {
      systemPrompt = buildRAGPrompt(
        systemPrompt,
        scenarioString,
        ragContext,
        conversationHistory,
        message
      );
      console.log('[GeminiService] Using RAG context - Level:', ragContext.learningFocus.currentLevel);
    }

    // Return welcome message for first interaction in a scenario
    if (conversationHistory.length === 0 && !message) {
      if (customSystemPrompt) {
        // Welcoming custom scenario
        return "Hi. What would you like to do next?";
      }
      return await getWelcomeMessage(scenario!);
    }

    // Build fallback prompt for OpenRouter / legacy paths
    const fallbackPrompt =
      conversationHistory.length > 0
        ? `${systemPrompt}\n\n--- CONVERSATION HISTORY ---\n${conversationHistory.join('\n')}\n--- NEW MESSAGE ---\nUser: ${message}\n\nTutor:`
        : `${systemPrompt}\n\n--- FIRST MESSAGE ---\nUser: ${message}\n\nTutor:`;

    try {
      const startTime = Date.now();
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const response = await model.generateContent(fallbackPrompt);
      const duration = Date.now() - startTime;
      usageMetricsService.logCall('Gemini', 'generateContent', 200, duration);
      return response.response.text();
    } catch (geminiError) {
      usageMetricsService.logCall('Gemini', 'generateContent (Failed)', 500, 0);
      console.warn('[GeminiService] Gemini scenario chat failed. Attempting OpenRouter fallback...', geminiError);
      try {
        return await callOpenRouterFallback(fallbackPrompt);
      } catch (orError) {
        console.warn('[GeminiService] OpenRouter fallback failed. Attempting Qwen fallback...', orError);
        try {
          return await callQwenFallback(fallbackPrompt);
        } catch (qwenError) {
          console.error('[GeminiService] All API pipelines failed (Gemini, OpenRouter, Qwen) for chat message:', qwenError);
          throw geminiError;
        }
      }
    }
  } catch (error) {
    console.error('Error sending chat message:', error);
    return "Sorry, I couldn't process your message. Please try again.";
  }
};

/**
 * Generates periodic feedback based on the conversation history.
 * Analyzes the user's performance and provides positive reinforcement and suggestions.
 *
 * @async
 * @function getConversationFeedback
 * @param {string[]} history - Array of previous messages for analysis
 * @returns {Promise<{ positive: string; toImprove: string }>} Feedback object
 */
export const getConversationFeedback = async (
  history: string[],
  lang: string = 'en',
  studentLevel: string = 'Intermediate'
): Promise<{ 
  vocePercebeuIsso: string; 
  euPercebiAlgo: string; 
  proximoDesafio: string; 
  specificCorrections?: GrammarCorrection[] 
}> => {
  try {
    const languageNames: Record<string, string> = {
      pt: 'Portuguese (Brazil)',
      es: 'Spanish',
      en: 'English'
    };
    const targetLanguage = languageNames[lang] || 'English';
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const levelGuidance: Record<string, string> = {
      Beginner: `The student is a BEGINNER. They may know very little English.
- vocePercebeuIsso: celebrate even the smallest victories (a single correct word or phrase)
- euPercebiAlgo: identify one specific pattern problem (e.g., "you consistently forget the verb 'to be'")
- specificCorrections: max 1 correction, very simple, with an explanation in ${targetLanguage}
- proximoDesafio: give ONE tiny next step (e.g., "practice saying 'I am from...' 3 times today")
- Tone: extremely warm, encouraging, never overwhelming`,
      Intermediate: `The student is INTERMEDIATE. They know basics but are building fluency.
- vocePercebeuIsso: highlight a genuine pattern of success, not just a single moment
- euPercebiAlgo: identify a recurring pattern error or a fluency gap (e.g., "you use past simple well, but mix it with present perfect")
- specificCorrections: 1-2 corrections that explain WHY, with examples
- proximoDesafio: one actionable challenge for next session
- Tone: warm, professional, like a coach who sees their potential`,
      Advanced: `The student is ADVANCED. They have strong fluency — focus on precision and nuance.
- vocePercebeuIsso: acknowledge a sophisticated language choice they made
- euPercebiAlgo: identify a nuance gap (e.g., register, word choice, cultural expression)
- specificCorrections: 1-2 style/precision corrections with explanation of why native speakers prefer one form
- proximoDesafio: a nuanced challenge (e.g., "try using inversion for emphasis next time")
- Tone: peer-like, intellectually engaging, high expectations`
    };

    const normalizedStudentLevel = normalizeEnglishLevel(studentLevel);
    const levelInstruction = levelGuidance[normalizedStudentLevel] || levelGuidance['Intermediate'];

    const prompt = `You are an experienced, observant English teacher giving personalized feedback after a tutoring session. 
Think like a teacher who has been watching this student carefully and has noticed patterns in their performance.

STUDENT LEVEL: ${normalizedStudentLevel}
${levelInstruction}

CRITICAL INSTRUCTIONS:
- Write ALL feedback text (vocePercebeuIsso, euPercebiAlgo, proximoDesafio, and correction explanations) entirely in ${targetLanguage}.
- Be SPECIFIC — reference actual things the student said, don't give generic feedback.
- Act like a perceptive teacher, not a chatbot. Use phrases like:
  * "I noticed that you..." / "Eu percebi que você..."
  * "Did you realize that...?" / "Você percebeu que...?"
  * "There's a pattern here that most students miss..." 
  * "Here's something that will accelerate your progress..."
- Make the student feel like you've been watching them closely and know their specific challenges.

Feedback Structure:
1. vocePercebeuIsso: A SPECIFIC achievement from this conversation. Reference what they actually said. Be enthusiastic but specific.
   Example: "Você percebeu que usou o past simple corretamente 3 vezes? Isso é real progresso!"
   
2. euPercebiAlgo: A HIDDEN PATTERN you noticed — something they might not be aware of themselves. This is the "teacher insight" moment.
   Example: "Eu percebi um padrão: você sempre acerta o vocabulário, mas esquece o 'to be' nas frases com adjetivos. Isso é muito comum para falantes de português."
   
3. proximoDesafio: ONE specific, actionable challenge for their next session. Not generic — tied to their actual performance.
   Example: "No próximo diálogo, foque especificamente em usar 'I am' antes de adjetivos. Tente pelo menos 5 vezes."
   
4. specificCorrections: 1-2 REAL errors from the conversation. Each must have:
   - original: the exact incorrect phrase they used
   - corrected: the correct version  
   - explanation: WHY this is wrong and how to remember the correct form (in ${targetLanguage})

Format response as JSON ONLY:
{
  "vocePercebeuIsso": "...",
  "euPercebiAlgo": "...",
  "proximoDesafio": "...",
  "specificCorrections": [
    {"original": "...", "corrected": "...", "explanation": "..."}
  ]
}

CONVERSATION HISTORY TO ANALYZE:
${history.join('\n')}
`;

    let responseText: string;
    try {
      const startTime = Date.now();
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      });
      const duration = Date.now() - startTime;
      usageMetricsService.logCall('Gemini', 'generateContent (Feedback)', 200, duration);
      responseText = result.response.text();
    } catch (geminiError) {
      usageMetricsService.logCall('Gemini', 'generateContent (Feedback Failed)', 500, 0);
      console.warn('[GeminiService] Gemini feedback failed. Attempting OpenRouter fallback...', geminiError);
      try {
        responseText = await callOpenRouterFallback(prompt, true);
      } catch (orError) {
        console.error('[GeminiService] Both Gemini and OpenRouter failed for conversation feedback:', orError);
        throw geminiError;
      }
    }
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      return JSON.parse(jsonStr);
    } catch (e) {
      console.warn('Failed to parse feedback JSON:', responseText);
      return { 
        vocePercebeuIsso: lang === 'pt' ? "Você fez um excelente progresso na prática de conversação hoje!" : "You made great progress in conversation practice today!", 
        euPercebiAlgo: lang === 'pt' ? "Eu percebi que você está conseguindo manter o fluxo da conversa — isso é um sinal claro de evolução." : "I noticed that you are maintaining the conversation flow well — that's a clear sign of growth.",
        proximoDesafio: lang === 'pt' ? "No próximo diálogo, tente usar pelo menos 3 palavras novas que aprendeu hoje." : "In the next dialogue, try to use at least 3 new words you learned today.",
        specificCorrections: []
      };
    }
  } catch (error) {
    console.error('Error getting conversation feedback:', error);
    return { 
      vocePercebeuIsso: lang === 'pt' ? "Excelente dedicação e prática!" : "Excellent dedication and practice!", 
      euPercebiAlgo: lang === 'pt' ? "Eu percebi que você demonstra boa confiança para responder — continue assim." : "I noticed you show good confidence when answering questions — keep it up.",
      proximoDesafio: lang === 'pt' ? "Para a próxima conversa, tente estruturar frases um pouco mais longas." : "For the next conversation, try to structure slightly longer sentences.",
      specificCorrections: []
    };
  }
};

/**
 * Generates an immersive, in-character opening message for a custom scenario.
 * Does NOT mention the scenario name or explain the context — jumps straight into roleplay.
 */
export const generateCustomWelcomeMessage = async (
  title: string,
  description: string,
  systemPrompt?: string
): Promise<string> => {
  return generateWelcomeMessage(undefined, systemPrompt, title, description);
};

// ============================================================================
// SCENARIO OPENING INSTRUCTIONS
// Assertive, level-aware prompts that produce a natural, in-character first line
// for each scenario. Examples drive the AI to output the correct style immediately.
// ============================================================================
const SCENARIO_OPENING_INSTRUCTIONS: Partial<Record<ChatScenario, (name: string, level: string) => string>> = {

  // ─── Phone Screen (casual friend call) ────────────────────────────────────
  [ChatScenario.PHONE_SCREEN]: (name, level) => {
    const normalizedLevel = level.toLowerCase();
    if (normalizedLevel === 'beginner') return `
The phone connects. You are a friend calling ${name}. Say exactly one simple, in-scene line.
Example: "Hey ${name}! It's me. How are you?"
Output ONLY the line. No quotes, no explanation.`;

    if (normalizedLevel === 'advanced') return `
The phone connects. You are a close friend calling ${name} out of the blue. Say exactly one natural, in-scene line.
Example: "Hey ${name}, what's up? You free right now?"
Output ONLY the line. No quotes, no explanation.`;

    return `
The phone connects. You are a friend calling ${name}. Say exactly one natural, in-scene line.
Example: "Hey ${name}! You free for a quick chat?"
Output ONLY the line. No quotes, no explanation.`;
  },

  // ─── Job Interviews ────────────────────────────────────────────────────────
  [ChatScenario.JOB_INTERVIEWS]: (name, level) => {
    const normalizedLevel = level.toLowerCase();
    if (normalizedLevel === 'beginner') return `
${name} just walked into the interview room. You are the interviewer. Say exactly one simple, in-scene line.
Example: "Hello ${name}! Welcome. Please sit down."
Output ONLY the line. No quotes, no explanation.`;

    return `
${name} just walked into the interview room. You are the interviewer. Say exactly one professional, in-scene line.
Example: "Good morning ${name}! I'm Sarah, the hiring manager — please, have a seat."
Output ONLY the line. No quotes, no explanation.`;
  },

  // ─── Travel Conversations ──────────────────────────────────────────────────
  [ChatScenario.TRAVEL_CONVERSATIONS]: (name, level) => {
    const normalizedLevel = level.toLowerCase();
    if (normalizedLevel === 'beginner') return `
${name} walks up to the hotel front desk. You are the receptionist. Say exactly one simple, in-scene line.
Example: "Hello! Welcome to the hotel. Your name please?"
Output ONLY the line. No quotes, no explanation.`;

    return `
${name} walks up to the hotel front desk. You are the receptionist. Say exactly one professional, in-scene line.
Example: "Good afternoon! Welcome to Hotel Paris — checking in today?"
Output ONLY the line. No quotes, no explanation.`;
  },

  // ─── Business Meetings ─────────────────────────────────────────────────────
  [ChatScenario.BUSINESS_MEETINGS]: (name, level) => {
    return `
${name} just joined the meeting. You are the team lead. Say exactly one professional, in-scene line.
Example: "Alright ${name}, glad you could join — let's get started."
Output ONLY the line. No quotes, no explanation.`;
  },

  // ─── Grammar Specialist ────────────────────────────────────────────────────
  [ChatScenario.GRAMMAR_SPECIALIST]: (name, level) => {
    const normalizedLevel = level.toLowerCase();
    if (normalizedLevel === 'beginner') return `
You are ${name}'s grammar coach. Ask exactly one simple, in-scene warm-up question.
Example: "Hey ${name}! Let's practice verbs. Can you say: 'I am a student'?"
Output ONLY the line. No quotes, no explanation.`;

    return `
You are ${name}'s grammar coach. Ask exactly one engaging, in-scene grammar question.
Example: "Hey ${name}! Today let's tackle the present perfect. Do you know when to use 'I have done' versus 'I did'?"
Output ONLY the line. No quotes, no explanation.`;
  },

  // ─── Vocabulary Specialist ─────────────────────────────────────────────────
  [ChatScenario.VOCABULARY_SPECIALIST]: (name, level) => {
    return `
You are ${name}'s vocabulary coach. Introduce exactly one word or expression and ask if they know it.
Example: "${name}, let's start with today's word: 'serendipity.' Have you heard it before?"
Output ONLY the line. No quotes, no explanation.`;
  },

  // ─── Pronunciation Specialist ──────────────────────────────────────────────
  [ChatScenario.PRONUNCIATION_SPECIALIST]: (name, level) => {
    return `
You are ${name}'s pronunciation coach. Give exactly one word or sound to try.
Example: "${name}, let's warm up! Try saying this word: 'comfortable.' How do you say it?"
Output ONLY the line. No quotes, no explanation.`;
  },

  // ─── Business English Specialist ───────────────────────────────────────────
  [ChatScenario.BUSINESS_SPECIALIST]: (name, level) => {
    return `
You are ${name}'s business English coach. Drop them into exactly one business situation.
Example: "${name}, imagine you just received an email from a client saying the deadline needs to move up — how do you reply?"
Output ONLY the line. No quotes, no explanation.`;
  },

  // ─── Travel Phrases Specialist ─────────────────────────────────────────────
  [ChatScenario.TRAVEL_SPECIALIST]: (name, level) => {
    return `
You are ${name}'s travel English coach. Drop them into exactly one travel scenario as the other person.
Example: "Next, please! Hi there, where are you flying to today and do you have any bags to check?"
Output ONLY the line. No quotes, no explanation.`;
  },

  // ─── Idioms & Slang Specialist ─────────────────────────────────────────────
  [ChatScenario.IDIOMS_SPECIALIST]: (name, level) => {
    return `
You are ${name}'s idioms and slang coach. Ask exactly one question about an expression.
Example: "${name}, let's start! Quick question: do you know what 'to bite the bullet' means?"
Output ONLY the line. No quotes, no explanation.`;
  },
};

const LOCAL_WELCOME_FALLBACKS: Partial<Record<ChatScenario, string[]>> = {
  [ChatScenario.PHONE_SCREEN]: [
    "Hey {name}, you got a second? I need your take on something.",
    "Hey {name}, can you hear me okay? I only have a minute.",
    "Hey {name}, quick question before I head out.",
    "Hey {name}, are you free right now? Something just came up.",
  ],
  [ChatScenario.JOB_INTERVIEWS]: [
    "Good morning, {name}. Thanks for coming in. Tell me a little about yourself.",
    "Hi {name}, welcome. What made you interested in this role?",
    "Thanks for joining us, {name}. Let's start with your recent experience.",
    "Hello {name}. Imagine I'm the hiring manager. Why should we choose you?",
  ],
  [ChatScenario.TRAVEL_CONVERSATIONS]: [
    "Good afternoon. Welcome to the hotel. Are you checking in today?",
    "Hi there. Where are you trying to get to?",
    "Next, please. Can I see your passport and booking reference?",
    "Welcome. What kind of place are you looking for today?",
  ],
  [ChatScenario.BUSINESS_MEETINGS]: [
    "Thanks for joining, {name}. Can you walk us through your update?",
    "Alright, {name}, let's get started. What's the main blocker today?",
    "Good to see you, {name}. We need a decision before Friday.",
    "Hi {name}. The client changed the deadline. How should we respond?",
  ],
  [ChatScenario.GRAMMAR_SPECIALIST]: [
    "{name}, let's warm up with one sentence: what did you do yesterday?",
    "{name}, say one thing you usually do every morning.",
    "{name}, let's fix a common pattern. Try: I have been learning English.",
  ],
  [ChatScenario.VOCABULARY_SPECIALIST]: [
    "{name}, today's word is \"reliable\". Can you use it in a sentence?",
    "{name}, let's practice a useful phrase: \"That makes sense.\" When would you say it?",
    "{name}, give me one word to describe your day, and we'll build from there.",
  ],
  [ChatScenario.PRONUNCIATION_SPECIALIST]: [
    "{name}, let's start with this word: comfortable. How would you say it?",
    "{name}, try this short phrase: What are you working on?",
    "{name}, let's practice the sound in \"thirty-three\".",
  ],
  [ChatScenario.BUSINESS_SPECIALIST]: [
    "{name}, your manager asks for a quick status update. What do you say?",
    "{name}, a client says the deadline is too tight. How do you reply?",
    "{name}, let's write a clear opening for a professional email.",
  ],
  [ChatScenario.TRAVEL_SPECIALIST]: [
    "{name}, you're at airport security and they ask about your bag. What do you say?",
    "{name}, you need directions to the nearest subway station. Start the conversation.",
    "{name}, the hotel cannot find your reservation. How do you explain the problem?",
  ],
  [ChatScenario.IDIOMS_SPECIALIST]: [
    "{name}, have you heard the phrase \"break the ice\" before?",
    "{name}, let's use a natural expression: \"I'm running late.\" When would you say it?",
    "{name}, quick one: what do you think \"on the same page\" means?",
  ],
};

const GENERIC_LOCAL_WELCOME_FALLBACKS = [
  "Hi {name}. Let's jump in. What situation do you want to practice first?",
  "Hi {name}. Give me one real situation, and we'll turn it into English practice.",
  "Hi {name}. Start with one sentence, and I'll keep the conversation moving.",
];

const getLocalStudentName = (): string => {
  try {
    const profileStr = localStorage.getItem('userProfile') || localStorage.getItem('onboardingData');
    if (profileStr) {
      const profile = JSON.parse(profileStr);
      if (profile.name) return profile.name;
    }
  } catch { /* ignore localStorage/profile parsing errors */ }
  return 'there';
};

const pickLocalFallback = (messages: string[], seed?: string): string => {
  if (messages.length === 0) return GENERIC_LOCAL_WELCOME_FALLBACKS[0];
  if (!seed) return messages[Math.floor(Math.random() * messages.length)];

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return messages[hash % messages.length];
};

export const getLocalWelcomeFallback = (
  scenario?: ChatScenario,
  customSystemPrompt?: string,
  topicTitle?: string,
): string => {
  const name = getLocalStudentName();

  if (customSystemPrompt) {
    const messages = topicTitle
      ? [
          `Hi ${name}. Let's start "${topicTitle}" in a real situation. What happens first?`,
          `Hi ${name}. You're in "${topicTitle}" now. Say the first line.`,
          `Hi ${name}. Let's make "${topicTitle}" practical. What would you say?`,
        ]
      : GENERIC_LOCAL_WELCOME_FALLBACKS;
    return pickLocalFallback(messages, `${topicTitle || ''}:${name}`).replaceAll('{name}', name);
  }

  const messages = scenario ? LOCAL_WELCOME_FALLBACKS[scenario] : undefined;
  return pickLocalFallback(messages || GENERIC_LOCAL_WELCOME_FALLBACKS, `${scenario || topicTitle || ''}:${name}`)
    .replaceAll('{name}', name);
};

/**
 * Generates a generative welcome message for a scenario (predefined or custom).
 * If ragContext is provided, the system prompt is enriched with student profile data
 * so the opening message is personalized (level, goals, past sessions).
 */
export const generateWelcomeMessage = async (
  scenario?: ChatScenario,
  customSystemPrompt?: string,
  topicTitle?: string,
  topicDesc?: string,
  correctionsEnabled: boolean = true,
  ragContext?: RAGContext
): Promise<string> => {
  let studentName = 'there';
  console.log('[GeminiService] generateWelcomeMessage started for:', { scenario, topicTitle, topicDesc, hasRag: !!ragContext });
  try {
    let systemPrompt = customSystemPrompt || (scenario ? buildPromptWithCorrectionMode(scenario, correctionsEnabled) : "You are an AI English tutor.");

    if (customSystemPrompt && correctionsEnabled) {
      systemPrompt = `${systemPrompt}

---

## Grammar Correction Mode

When the user makes grammar or vocabulary errors:
1. Respond naturally to their message first
2. AFTER your response, add corrections in this EXACT format:
   <CORRECTION>{"original":"me go store","corrected":"I'm going to the store","explanation":"Need subject pronoun"}</CORRECTION>
3. Maximum 2 corrections per message
4. Focus on errors that affect communication
5. Be encouraging and supportive

The correction block will be parsed and displayed separately to the user.
`;
    }

    // Enrich system prompt with RAG context (student profile, level, past sessions)
    if (ragContext) {
      const scenarioStr = scenario?.toString() ?? topicTitle ?? 'real-life';
      systemPrompt = buildRAGPrompt(systemPrompt, scenarioStr, ragContext, [], '');
      console.log('[GeminiService] Welcome message enriched with RAG context — level:', ragContext.learningFocus.currentLevel);
    }

    const title = topicTitle || (scenario ? scenario.toString() : "Roleplay");
    const desc = topicDesc || (scenario ? `A roleplay session about ${scenario.toString()}` : "");
    const level = ragContext?.learningFocus.currentLevel ?? 'intermediate';

    // Student name: read from localStorage (UserLearningProfile does not store display name)
    try {
      const profileStr = localStorage.getItem('userProfile') || localStorage.getItem('onboardingData');
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        if (profile.name) studentName = profile.name;
      }
    } catch { /* ignore */ }

    // ─── Build adaptive continuation context ──────────────────────────────
    // When user has prior sessions, instruct the AI to continue naturally from where they left off,
    // referencing their progress and weaknesses without sounding like a generic bot greeting.
    const adaptive = ragContext?.userProfile?.adaptive_profile;
    const hasPriorSessions = (ragContext?.userProfile?.total_conversations ?? 0) > 0;
    const prevSummaries = ragContext?.previousConversationsSummary ?? [];

    let continuationContext = '';
    if (hasPriorSessions) {
      const parts: string[] = [];

      if (prevSummaries.length > 0) {
        parts.push(`PREVIOUS SESSION CONTEXT:\n${prevSummaries.slice(0, 2).join('\n')}`);
      }

      if (adaptive?.last_feedback && adaptive.last_feedback.length > 0) {
        parts.push(`LAST TUTOR SUGGESTIONS: ${adaptive.last_feedback.join('; ')}`);
      }

      if (adaptive?.weaknesses && adaptive.weaknesses.length > 0) {
        parts.push(`AREAS WE WERE WORKING ON: ${adaptive.weaknesses.slice(0, 3).join(', ')}`);
      }

      if (adaptive?.progress && adaptive.progress.length > 0) {
        const lastProgress = adaptive.progress[adaptive.progress.length - 1];
        parts.push(`RECENT ACHIEVEMENT: ${lastProgress.milestone}`);
      }

      if (parts.length > 0) {
        continuationContext = `

=== TUTOR MEMORY (use this silently, do not explain it) ===
${parts.join('\n\n')}

IMPORTANT: You are a person who has interacted with ${studentName} before.
DO NOT mention the memory directly or explain what happened last time.
DO NOT say things like "I noticed we..." or "Last time we worked on...".
Use one concrete and relevant detail from the memory to choose the topic, intent, or wording of the opening.
Instead, open NATURALLY as if continuing from where you left off — like a real person resuming a familiar conversation.
Stay fully in character. 1-2 sentences max.`;
      }
    }

    // Use scenario-specific instruction if available, otherwise generic
    const scenarioInstruction = scenario && SCENARIO_OPENING_INSTRUCTIONS[scenario]
      ? SCENARIO_OPENING_INSTRUCTIONS[scenario]!(studentName, level) + continuationContext
      : `You are starting a roleplay for the scenario "${title}" (${desc}).
Write your first message to ${studentName} in character, immediately starting the roleplay.
Adapt complexity for a ${level}-level English learner.
1-2 sentences max. No meta-commentary or correction blocks.${continuationContext}`;

    const instructionPrompt = `${scenarioInstruction}

CRITICAL:
- Output ONLY the character's opening line. Nothing else.
- No quotation marks wrapping the whole message.
- No explanations, no "Sure!", no "Here is the message:".
- Use the RAG context and tutor memory when available to vary the topic, intent, and wording.
- Avoid generic greetings and do not repeat a previous opening.
- Never reveal or mention that you used history, memory, profile data, or RAG.
- Just the character speaking.`;


    // 1st Priority: Qwen API Key (Direct Alibaba DashScope / Qwen API)
    if (QWEN_API_KEY) {
      try {
        console.log('[GeminiService] Fetching scenario welcome message directly using Qwen (Alibaba DashScope)...');
        const prompt = `${systemPrompt}\n\nINSTRUCTION:\n${instructionPrompt}`;
        const result = await fetchQwenChatCompletion(prompt, 'qwen-plus', 500, false);
        console.log('[GeminiService] Qwen direct API successfully generated welcome message:', result);
        return result;
      } catch (error) {
        console.warn('[GeminiService] Qwen direct API failed. Trying OpenRouter fallback...', error);
      }
    }

    // 2nd Priority: OpenRouter Fallback Key
    if (OPENROUTER_API_KEY) {
      try {
        console.log('[GeminiService] Fetching scenario welcome message using OpenRouter key...');
        const prompt = `${systemPrompt}\n\nINSTRUCTION:\n${instructionPrompt}`;
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
            'X-Title': 'Sakae E-Learning',
          },
          body: JSON.stringify({
            model: 'qwen/qwen-2.5-72b-instruct',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const choiceText = data?.choices?.[0]?.message?.content;
          if (choiceText) {
            const result = choiceText.trim();
            console.log('[GeminiService] OpenRouter successfully generated welcome message:', result);
            return result;
          }
        }
      } catch (error) {
        console.warn('[GeminiService] OpenRouter key failed. Trying Gemini fallback...', error);
      }
    }

    // 3rd Priority: Gemini API Key
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GOOGLE_API_KEY;
    const client = new GoogleGenerativeAI(apiKey || '');
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        thinkingConfig: { thinkingBudget: 0 } as any
      } as any
    });
    console.log('[GeminiService] Calling Gemini API for welcome message generation with prompt:', instructionPrompt);
    const response = await model.generateContent(instructionPrompt);
    const result = response.response.text().trim();
    console.log('[GeminiService] Gemini API successfully generated welcome message:', result);
    if (result) {
      return result;
    }
    if (scenario) {
      return getLocalWelcomeFallback(scenario, customSystemPrompt, topicTitle);
    }
    return getLocalWelcomeFallback(scenario, customSystemPrompt, topicTitle);
  } catch (error) {
    console.error('[GeminiService] AI Welcome Message Generation Failed! Error:', error);
    if (scenario) {
      console.log('[GeminiService] Falling back to static getWelcomeMessage for scenario:', scenario);
      try {
        const fallback = await getWelcomeMessage(scenario);
        console.log('[GeminiService] Static welcome message fallback retrieved:', fallback);
        return fallback;
      } catch (fallbackError) {
        console.error('[GeminiService] Static getWelcomeMessage fallback also failed:', fallbackError);
      }
    }
    const finalFallback = getLocalWelcomeFallback(scenario, customSystemPrompt, topicTitle);
    console.log('[GeminiService] Returning absolute last resort fallback welcome message:', finalFallback);
    return finalFallback;
  }
};

// ============================================================================
// ADAPTIVE PROFILE ANALYSIS
// Analyzes a completed session transcript and returns structured profile data.
// Called by contextService.processConversationEnd after each session.
// ============================================================================

/**
 * Analyzes a full conversation transcript using AI and extracts structured
 * AdaptiveProfile data (strengths, weaknesses, evidence, progress, last_feedback).
 * This is the core of the evidence-based adaptive learning system.
 */
export const analyzeSessionForAdaptiveProfile = async (
  messages: Array<{ role: string; content: string }>,
  existingWeaknesses: string[] = [],
  existingStrengths: string[] = [],
  lang: string = 'pt'
): Promise<{
  strengths: string[];
  weaknesses: string[];
  evidence: Array<{ date: string; type: 'error' | 'strength' | 'progress'; text: string; analysis: string }>;
  progress: Array<{ milestone: string; date: string }>;
  last_feedback: string[];
} | null> => {
  const today = new Date().toISOString().split('T')[0];
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
  
  if (userMessages.length < 2) {
    console.log('[GeminiService] analyzeSessionForAdaptiveProfile: session too short, skipping.');
    return null;
  }

  const languageNames: Record<string, string> = {
    pt: 'Portuguese (Brazil)',
    es: 'Spanish',
    en: 'English'
  };
  const targetLanguage = languageNames[lang] || 'Portuguese (Brazil)';

  const transcript = messages
    .map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`)
    .join('\n');

  const existingContext = existingWeaknesses.length > 0
    ? `\nKnown weaknesses from previous sessions: ${existingWeaknesses.join(', ')}\nKnown strengths: ${existingStrengths.join(', ')}`
    : '';

  const prompt = `You are an expert English language analyst. Analyze this conversation transcript and extract precise, evidence-based learning data.
${existingContext}

TRANSCRIPT:
${transcript}

TASK: Analyze the student's English in this transcript and return a JSON object with:

1. "strengths": Array of 1-3 specific grammar/vocabulary skills the student demonstrated CORRECTLY in this session. Be concrete (e.g., "Correct use of past simple irregular verbs", "Natural use of modal verbs for requests"). Write in ${targetLanguage}.

2. "weaknesses": Array of 1-3 specific recurring errors or gaps identified. Be concrete and actionable (e.g., "Omission of auxiliary 'do/does' in negative sentences", "Confusing 'make' and 'do' collocations"). Write in ${targetLanguage}.

3. "evidence": Array of up to 3 specific error examples from the actual transcript. Each must have:
   - "date": "${today}"
   - "type": "error" | "strength" | "progress"  
   - "text": the EXACT phrase the student wrote (copy it verbatim from the transcript)
   - "analysis": why it is an error or strength, and the correct form (in ${targetLanguage})

4. "progress": Array of 0-2 milestone achievements if the student demonstrated clear improvement (e.g., correctly used a structure that was previously a known weakness). Each has:
   - "milestone": description of the improvement in ${targetLanguage}
   - "date": "${today}"
   Leave empty if no clear improvement milestone is evident.

5. "last_feedback": Array of 2-3 specific, actionable suggestions for the student's NEXT session. Write in ${targetLanguage}. Example: "Pratique usar 'I don't' ao invés de 'I no' em frases negativas".

Return ONLY valid JSON. No markdown, no explanation. If the session is too short or has no errors, return minimal data with what you can find.

JSON format:
{
  "strengths": [],
  "weaknesses": [],
  "evidence": [],
  "progress": [],
  "last_feedback": []
}`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);
    console.log('[GeminiService] analyzeSessionForAdaptiveProfile result:', parsed);
    return parsed;
  } catch (geminiError) {
    console.warn('[GeminiService] Gemini adaptive analysis failed. Trying OpenRouter...', geminiError);
    try {
      const responseText = await callOpenRouterFallback(prompt, true);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('[GeminiService] analyzeSessionForAdaptiveProfile (OpenRouter) result:', parsed);
        return parsed;
      }
    } catch (orError) {
      console.error('[GeminiService] All APIs failed for adaptive profile analysis:', orError);
    }
    return null;
  }
};
