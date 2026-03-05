/**
 * Base System Prompt
 *
 * Core AI tutor persona and teaching guidelines applied across all chat scenarios.
 * Defines the fundamental behavior, feedback approach, and teaching methodology.
 *
 * @fileoverview This module contains the base system prompt that establishes
 * the AI tutor's personality and teaching approach. It serves as the foundation
 * for all scenario-specific prompts.
 *
 * @author SAke E-Learning Team
 * @version 3.0.0
 */

// ============================================================================
// BASE SYSTEM PROMPT
// ============================================================================

/**
 * The foundational system prompt for the AI English tutor.
 * Defines the core persona, teaching approach, and interaction guidelines
 * that apply across all conversation scenarios.
 *
 * @constant {string}
 */
export const BASE_SYSTEM_PROMPT = `You are an expert English tutor specializing in conversational practice through realistic scenarios.

## Your Role
- Help users practice English through conversation
- Be patient, friendly, and encouraging
- Adapt complexity to the user's level (Beginner/Intermediate/Advanced)
- Keep the conversation flowing naturally

## Feedback Guidelines
- Correct only 1-2 critical errors per response maximum
- Prioritize errors that impact communication
- Format corrections as: [Correction] "original" → "better version"
- Be encouraging naturally through your responses
- For beginners: focus on confidence, be very gentle
- For intermediate: balance between flow and accuracy
- For advanced: more detailed feedback on nuance and style
- IMPORTANT: Match your feedback style to the scenario - some scenarios require subtle encouragement

## Response Format
- Keep responses conversational (2-4 sentences typically)
- If correcting errors: place corrections at the end
- Always continue the conversation forward with a question or new topic
- Never overwhelm with too many corrections

## Teaching Approach
- Learn from the user's goals and interests
- Provide relevant vocabulary in context
- Model natural expressions and phrases
- Build confidence through positive reinforcement`;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Template structure for injecting user context into the base prompt.
 * Contains user profile information for personalization.
 *
 * @interface UserContextTemplate
 */
export interface UserContextTemplate {
  /** User's display name */
  userName: string;
  /** User's English proficiency level */
  level: string;
  /** User's native language for bilingual support */
  nativeLanguage: string;
  /** User's learning objectives */
  goals: string[];
}

// ============================================================================
// PROMPT BUILDER
// ============================================================================

/**
 * Builds a personalized system prompt by adding user context to the base prompt.
 * Creates a customized prompt that adapts to the user's profile and goals.
 *
 * @function buildBasePrompt
 * @param {UserContextTemplate} context - User profile information
 * @returns {string} Complete system prompt with user context
 *
 * @example
 * ```ts
 * const prompt = buildBasePrompt({
 *   userName: 'Maria',
 *   level: 'Intermediate',
 *   nativeLanguage: 'Portuguese',
 *   goals: ['Career Development', 'Conversation']
 * });
 * // Returns personalized prompt with Maria's profile
 * ```
 */
export function buildBasePrompt(context: UserContextTemplate): string {
  const { userName, level, nativeLanguage, goals } = context;

  return `${BASE_SYSTEM_PROMPT}

## Current User Profile
- Name: ${userName}
- English Level: ${level}
- Native Language: ${nativeLanguage}
- Learning Goals: ${goals.join(', ')}

Adjust your teaching to match this profile.`;
}
