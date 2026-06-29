/**
 * Prompt Builder
 *
 * Constructs personalized AI prompts by combining base persona,
 * scenario-specific instructions, and user profile context.
 *
 * @fileoverview This module orchestrates the prompt building process, merging
 * the base system prompt with scenario configurations and user context from
 * localStorage to create tailored prompts for each conversation.
 *
 * @dependencies ../../../types, ../base/systemPrompt, ../scenarios/*
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

import { ChatScenario, EnglishLevel } from '../../../types';
import { BASE_SYSTEM_PROMPT, CORE_SYSTEM_PROMPT, IMMERSIVE_MODE_PROMPT, COACH_MODE_PROMPT } from '../base/systemPrompt';
import { phoneScreenConfig } from '../scenarios/phoneScreen';
import { jobInterviewConfig } from '../scenarios/jobInterview';
import { travelConfig } from '../scenarios/travel';
import { businessMeetingConfig } from '../scenarios/businessMeeting';
import { grammarSpecialistConfig } from '../scenarios/grammarSpecialist';
import { vocabularySpecialistConfig } from '../scenarios/vocabularySpecialist';
import { pronunciationSpecialistConfig } from '../scenarios/pronunciationSpecialist';
import { businessSpecialistConfig } from '../scenarios/businessSpecialist';
import { travelSpecialistConfig } from '../scenarios/travelSpecialist';
import { idiomsSpecialistConfig } from '../scenarios/idiomsSpecialist';

// ============================================================================
// SCENARIO REGISTRY
// ============================================================================

/**
 * Registry of all available chat scenarios.
 * Maps scenario IDs to their complete configurations.
 *
 * @constant {Record<ChatScenario, ScenarioConfig>}
 */
const SCENARIOS = {
  [ChatScenario.PHONE_SCREEN]: phoneScreenConfig,
  [ChatScenario.JOB_INTERVIEWS]: jobInterviewConfig,
  [ChatScenario.TRAVEL_CONVERSATIONS]: travelConfig,
  [ChatScenario.BUSINESS_MEETINGS]: businessMeetingConfig,
  [ChatScenario.GRAMMAR_SPECIALIST]: grammarSpecialistConfig,
  [ChatScenario.VOCABULARY_SPECIALIST]: vocabularySpecialistConfig,
  [ChatScenario.PRONUNCIATION_SPECIALIST]: pronunciationSpecialistConfig,
  [ChatScenario.BUSINESS_SPECIALIST]: businessSpecialistConfig,
  [ChatScenario.TRAVEL_SPECIALIST]: travelSpecialistConfig,
  [ChatScenario.IDIOMS_SPECIALIST]: idiomsSpecialistConfig,
};

const IMMERSIVE_SCENARIOS = [
  ChatScenario.PHONE_SCREEN,
  ChatScenario.JOB_INTERVIEWS,
  ChatScenario.TRAVEL_CONVERSATIONS,
  ChatScenario.BUSINESS_MEETINGS,
];

export function isImmersiveScenario(scenario?: ChatScenario): boolean {
  return !!scenario && IMMERSIVE_SCENARIOS.includes(scenario);
}

export function normalizeEnglishLevel(level: unknown): EnglishLevel {
  const normalized = String(level || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (['beginner', 'begginer', 'beginer', 'iniciante'].includes(normalized)) {
    return EnglishLevel.BEGINNER;
  }

  if (['intermediate', 'intermidiare', 'intermediary', 'intermediario', 'intermediaria'].includes(normalized)) {
    return EnglishLevel.INTERMEDIATE;
  }

  if (['advanced', 'advance', 'avancado', 'avancada'].includes(normalized)) {
    return EnglishLevel.ADVANCED;
  }

  return EnglishLevel.INTERMEDIATE;
}

// ============================================================================
// CONTEXT RETRIEVAL
// ============================================================================

/**
 * User context shape for prompt building.
 *
 * @interface UserContext
 * @private
 */
interface UserContext {
  userName: string;
  level: EnglishLevel;
  nativeLanguage: string;
  goals: string[];
}

/**
 * Retrieves user context from localStorage.
 * Checks multiple localStorage keys in priority order.
 *
 * @function getUserContext
 * @returns {UserContext | null} User profile information for prompt building
 *
 * @remarks Priority order:
 * 1. onboardingData - Temporary data from onboarding flow
 * 2. userProfile - Logged-in user's profile
 *
 * @example
 * ```ts
 * const context = getUserContext();
 * // Returns: { userName: 'Maria', level: 'Intermediate', ... }
 * ```
 */
const getUserContext = (): UserContext | null => {
  try {
    // Try reading onboarding data first (pre-login)
    const onboardingDataStr = localStorage.getItem('onboardingData');
    if (onboardingDataStr) {
      const onboardingData = JSON.parse(onboardingDataStr);
      if (
        onboardingData.name &&
        onboardingData.level &&
        onboardingData.nativeLanguage &&
        onboardingData.goals
      ) {
        console.log('🎯 Using ONBOARDING DATA for prompt context:', onboardingData);
        return {
          userName: onboardingData.name,
          level: normalizeEnglishLevel(onboardingData.level),
          nativeLanguage: onboardingData.nativeLanguage,
          goals: onboardingData.goals,
        };
      }
    }

    // Try reading logged-in user profile
    const userProfileStr = localStorage.getItem('userProfile');
    if (userProfileStr) {
      const userProfile = JSON.parse(userProfileStr);
      if (
        userProfile.name &&
        userProfile.level &&
        userProfile.nativeLanguage &&
        userProfile.goals
      ) {
        console.log('🎯 Using USER PROFILE for prompt context:', userProfile);
        return {
          userName: userProfile.name,
          level: normalizeEnglishLevel(userProfile.level),
          nativeLanguage: userProfile.nativeLanguage,
          goals: userProfile.goals,
        };
      }
    }
  } catch (error) {
    console.warn('⚠️ Error reading user context from localStorage:', error);
  }

  console.warn('No user profile context found for prompt. Building prompt without user-specific profile data.');
  return null;
};

// ============================================================================
// PROMPT BUILDING
// ============================================================================

/**
 * Builds a complete, personalized prompt for a chat scenario.
 * Combines base persona, scenario instructions, and user context.
 *
 * @function buildPrompt
 * @param {ChatScenario} scenario - The scenario ID to build a prompt for
 * @returns {string} Complete system prompt ready for the LLM
 * @throws {Error} If the scenario is not found
 *
 * @example
 * ```ts
 * const prompt = buildPrompt(ChatScenario.JOB_INTERVIEWS);
 * // Returns full prompt with base persona + job interview scenario + user context
 * ```
 */
export function buildPrompt(scenario: ChatScenario): string {
  // Get scenario configuration
  const scenarioConfig = SCENARIOS[scenario];

  if (!scenarioConfig) {
    throw new Error(`Scenario not found: ${scenario}`);
  }

  // Get verified user context when available.
  const userContext = getUserContext();
  const studentLevel = userContext?.level ?? EnglishLevel.INTERMEDIATE;

  // Determine scenario type
  const isImmersive = isImmersiveScenario(scenario);

  const modePrompt = isImmersive ? IMMERSIVE_MODE_PROMPT : COACH_MODE_PROMPT;

  // Level-specific reinforcement block (additional to scenario difficultyLevels)
  const levelBlock: Record<EnglishLevel, string> = {
    [EnglishLevel.BEGINNER]: `
⚠️ BEGINNER — CRITICAL TEACHING RULES:
You are talking to someone who may know ALMOST NOTHING in English. This is the most important level to get right.

MANDATORY BEHAVIOR:
1. Keep every sentence SHORT. Maximum 8 words per sentence.
2. Use ONLY the most common English words (top 500). No idioms, no phrasal verbs.
3. ALWAYS provide Portuguese translations in parentheses for ANY new word or phrase you introduce.
   Example: "How are you? (Como vai você?)"
4. Ask EXACTLY ONE question at a time. Never more.
5. If the student writes in Portuguese — that's OKAY. Respond warmly, then MODEL the English version:
   "Muito bem! Em inglês: 'I am tired.' Tente repetir!"
6. Celebrate EVERY correct word or phrase, no matter how small.
7. NEVER correct more than 1 error per response. Beginners need confidence above grammar.
8. Teach through examples, not explanations. Show → don't tell.

Forbidden for beginners:
- Past perfect, conditionals, passive voice
- Idioms ("kick the bucket", "under the weather")
- Phrasal verbs (unless extremely common: "wake up", "go out")
- Sentences longer than 8 words in your questions
- Expecting them to understand English-only explanations`,

    [EnglishLevel.INTERMEDIATE]: `
INTERMEDIATE — FLUENCY BUILDING RULES:
The student knows the basics. Your job is to push them toward natural, fluent expression.

MANDATORY BEHAVIOR:
1. Use natural English. No need to translate — they understand.
2. When correcting: ALWAYS explain WHY. "It's not 'I am agree' — in English, 'agree' is a verb, not an adjective. Say: 'I agree.'"
3. Notice and NAME patterns: "I noticed you always use 'very' — try 'extremely', 'incredibly', 'really' for variety."
4. Introduce 1 new useful expression or phrase per 2-3 exchanges. Use it in context.
5. Push them to use more complex structures naturally: "Good! Now try saying that with 'since' instead of 'because'."
6. Correct up to 2 errors per response — explain both.
7. Challenge them: if their answer is too short or generic, push back: "Can you give me a specific example?"`,

    [EnglishLevel.ADVANCED]: `
ADVANCED — PRECISION AND NUANCE RULES:
The student has strong fluency. Your job is to refine, polish, and elevate.

MANDATORY BEHAVIOR:
1. Speak as a peer. Use sophisticated vocabulary and natural native speech patterns.
2. Focus on style, register, and cultural appropriateness — not just grammar.
3. When correcting: distinguish between "wrong" and "not natural". Be precise about which it is.
   Example: "That's grammatically correct, but a native speaker would say '...' to sound more natural."
4. Name advanced patterns: inversion, cleft sentences, modal perfects, register shifts.
5. Introduce cultural nuance: "In American business culture, this phrase might come across as..."
6. Challenge with complexity: longer scenarios, ambiguous situations, nuanced discussions.
7. Expect near-native quality — push them when they take shortcuts.`,
  };

  // Build the system prompt using the layered architecture
  let prompt = `${CORE_SYSTEM_PROMPT}

---

## MODE: ${isImmersive ? 'IMMERSIVE' : 'COACH'}

${modePrompt}

---

## SCENARIO: ${scenarioConfig.name}

${scenarioConfig.systemPrompt}

---

## STUDENT LEVEL ADAPTATION: ${studentLevel}

${scenarioConfig.difficultyLevels[studentLevel]}
`;

  // Only add the explicit pedagogical levelBlock and diagnosis layer if not in Immersive mode.
  // In Immersive mode, the AI must never be aware it is in a learning activity and must have silent adaptation.
  if (isImmersive) {
    prompt += `
---

## SILENT LEVEL ADAPTATION: ${studentLevel}
1. You must silently adapt your vocabulary, pace, sentence length, and syntax complexity to match the user's level (${studentLevel}).
2. Do not explain, acknowledge, or comment on this level adaptation.
3. Keep your dialogue 100% in-character while using language suited for a ${studentLevel} speaker.
`;
    if (studentLevel === EnglishLevel.BEGINNER) {
      prompt += `
- Keep sentences short (max 8 words).
- Use simple, high-frequency words.
- If the user uses Portuguese, continue in-character but speak very simply and use Portuguese words in parentheses naturally if needed for understanding (e.g. "Do you want some coffee? (café?)").
`;
    }
  } else {
    // Add pedagogical blocks
    prompt += `
${levelBlock[studentLevel]}

---

## ONGOING DIAGNOSIS (apply silently every message)
As you interact, silently track:
- What vocabulary the student uses (range, accuracy)
- What grammar patterns they get right vs wrong
- Whether they seem to understand your messages
- Their confidence level (do they attempt complex sentences or stick to simple ones?)

When you notice a pattern (good or bad), CREATE A TEACHER MOMENT:
- "I noticed that you always get [X] right — that's impressive for your level!"
- "I've seen this same pattern in your last messages — let's address it."
- "Did you notice what you just did? You used [X] correctly — that's a big step!"
- "Here's something I want to show you that will make this much clearer."
`;
  }

  // End with user profile information, adapted to mode
  prompt += `
---

## CURRENT USER PROFILE
${userContext
  ? `- Name: ${userContext.userName}
- English Level: ${userContext.level}
- Native Language: ${userContext.nativeLanguage}
- Learning Goals: ${userContext.goals.join(', ')}`
  : `No verified user profile is available for this session.
- English Level: ${studentLevel}`}

${isImmersive
  ? `Act natural. You are talking to this person in-character. Do not greet them as a student. Start/continue the conversation immediately and naturally in scene.`
  : `You know this student. You've been watching how they communicate. Every response must feel like it comes from a teacher who has been paying close attention — not just responding to the last message.`
}`;

  return prompt;
}


/**
 * Builds a complete prompt with optional grammar correction mode.
 * Adds correction instructions when enabled.
 *
 * @function buildPromptWithCorrectionMode
 * @param {ChatScenario} scenario - The scenario ID to build a prompt for
 * @param {boolean} correctionsEnabled - Whether grammar corrections are enabled
 * @returns {string} Complete system prompt with optional correction instructions
 *
 * @example
 * ```ts
 * const prompt = buildPromptWithCorrectionMode(ChatScenario.JOB_INTERVIEWS, true);
 * // Returns full prompt with grammar correction instructions
 * ```
 */
export function buildPromptWithCorrectionMode(
  scenario: ChatScenario,
  correctionsEnabled: boolean = true
): string {
  const basePrompt = buildPrompt(scenario);

  if (!correctionsEnabled || isImmersiveScenario(scenario)) {
    return basePrompt;
  }

  return `${basePrompt}

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

/**
 * Retrieves a random welcome message for a scenario based on user's level.
 * Returns a direct roleplay greeting without meta explanations.
 *
 * @async
 * @function getWelcomeMessage
 * @param {ChatScenario} scenario - The scenario to get the welcome message for
 * @returns {Promise<string>} The scenario's welcome message with user's name inserted
 * @throws {Error} If the scenario is not found
 *
 * @example
 * ```ts
 * const welcome = await getWelcomeMessage(ChatScenario.TRAVEL_CONVERSATIONS);
 * // Returns: "Hi Maria! Welcome! How can I help you today?"
 * ```
 */
export async function getWelcomeMessage(scenario: ChatScenario): Promise<string> {
  const scenarioConfig = SCENARIOS[scenario];

  if (!scenarioConfig) {
    throw new Error(`Scenario not found: ${scenario}`);
  }

  // Get user context to determine level
  const userContext = getUserContext();
  const level = userContext?.level ?? EnglishLevel.INTERMEDIATE;
  const displayName = userContext?.userName || 'there';

  // Get welcome messages for user's level
  const welcomeMessages = scenarioConfig.welcomeMessagesByLevel[level];

  if (!welcomeMessages || welcomeMessages.length === 0) {
    // Fallback to old welcomeMessage if no level-specific messages found
    return scenarioConfig.welcomeMessage.replace('[Nome]', displayName);
  }

  // Select a random message from the level-appropriate messages
  const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
  const selectedMessage = welcomeMessages[randomIndex];

  // Replace [Nome] placeholder with user's actual name
  return selectedMessage.replace('[Nome]', displayName);
}

/**
 * Returns all available scenario configurations.
 * Useful for listing scenarios or iterating over them.
 *
 * @function getAllScenarios
 * @returns {typeof SCENARIOS} Object mapping scenario IDs to configurations
 *
 * @example
 * ```ts
 * const scenarios = getAllScenarios();
 * Object.entries(scenarios).forEach(([id, config]) => {
 *   console.log(config.name);
 * });
 * ```
 */
export function getAllScenarios(): typeof SCENARIOS {
  return SCENARIOS;
}
