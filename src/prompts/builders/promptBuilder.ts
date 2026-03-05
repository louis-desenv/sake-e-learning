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
import { BASE_SYSTEM_PROMPT } from '../base/systemPrompt';
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

// ============================================================================
// MOCK CONTEXT
// ============================================================================

/**
 * Mock user context for development/fallback purposes.
 * Used when no user data is available in localStorage.
 *
 * @constant
 * @internal
 */
const MOCK_USER_CONTEXT = {
  userName: 'Student',
  level: EnglishLevel.BEGINNER,
  nativeLanguage: 'Portuguese',
  goals: ['Conversation'],
};

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
 * Retrieves user context from localStorage or uses mock as fallback.
 * Checks multiple localStorage keys in priority order.
 *
 * @function getUserContext
 * @returns {UserContext} User profile information for prompt building
 *
 * @remarks Priority order:
 * 1. onboardingData - Temporary data from onboarding flow
 * 2. userProfile - Logged-in user's profile
 * 3. MOCK_USER_CONTEXT - Development fallback
 *
 * @example
 * ```ts
 * const context = getUserContext();
 * // Returns: { userName: 'Maria', level: 'Intermediate', ... }
 * ```
 */
const getUserContext = (): UserContext => {
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
          level: onboardingData.level,
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
          level: userProfile.level,
          nativeLanguage: userProfile.nativeLanguage,
          goals: userProfile.goals,
        };
      }
    }
  } catch (error) {
    console.warn('⚠️ Error reading user context from localStorage:', error);
  }

  // Fallback to mock context
  console.log('🎯 Using MOCK CONTEXT for prompt (no user data found):', MOCK_USER_CONTEXT);
  return MOCK_USER_CONTEXT;
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

  // Get user context (dynamic or mock)
  const userContext = getUserContext();

  // Assemble complete prompt
  const prompt = `${BASE_SYSTEM_PROMPT}

---

## ${scenarioConfig.name}

${scenarioConfig.systemPrompt}

---

## Adaptation for Your Level

${scenarioConfig.difficultyLevels[userContext.level]}

---

## User Context (Current Session)
- Name: ${userContext.userName}
- English Level: ${userContext.level}
- Native Language: ${userContext.nativeLanguage}
- Goals: ${userContext.goals.join(', ')}

Remember: Adjust your responses to match this profile.`;

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

  if (!correctionsEnabled) {
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
  const level = userContext.level;

  // Get welcome messages for user's level
  const welcomeMessages = scenarioConfig.welcomeMessagesByLevel[level];

  if (!welcomeMessages || welcomeMessages.length === 0) {
    // Fallback to old welcomeMessage if no level-specific messages found
    return scenarioConfig.welcomeMessage.replace('[Nome]', userContext.userName);
  }

  // Select a random message from the level-appropriate messages
  const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
  const selectedMessage = welcomeMessages[randomIndex];

  // Replace [Nome] placeholder with user's actual name
  return selectedMessage.replace('[Nome]', userContext.userName);
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
