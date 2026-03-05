/**
 * Route Mapping Types
 *
 * Type definitions and utilities for URL-based navigation.
 * Maps ChatScenario enums to URL slugs for shareable, RESTful routes.
 *
 * @fileoverview This file provides utilities for converting between ChatScenario
 * enums and URL slug strings, enabling clean, shareable URLs like /chat/audio/job-interviews
 *
 * @author SAke E-Learning Team
 * @version 3.1.0
 */

import { ChatScenario } from '../types';

// ============================================================================
// ROUTE MAPPINGS
// ============================================================================

/**
 * Maps each ChatScenario enum value to its corresponding URL slug.
 * ChatScenario enum values are already slugs, so this is a direct mapping.
 *
 * @constant {Record<ChatScenario, string>}
 * @readonly
 *
 * @example
 * ```ts
 * SCENARIO_SLUGS[ChatScenario.JOB_INTERVIEWS] // 'job-interviews'
 * SCENARIO_SLUGS[ChatScenario.PHONE_SCREEN]   // 'phone-screen'
 * ```
 */
export const SCENARIO_SLUGS: Record<ChatScenario, string> = {
  [ChatScenario.PHONE_SCREEN]: 'phone-screen',
  [ChatScenario.JOB_INTERVIEWS]: 'job-interviews',
  [ChatScenario.TRAVEL_CONVERSATIONS]: 'travel-conversations',
  [ChatScenario.BUSINESS_MEETINGS]: 'business-meetings',
  [ChatScenario.GRAMMAR_SPECIALIST]: 'grammar-specialist',
  [ChatScenario.VOCABULARY_SPECIALIST]: 'vocabulary-specialist',
  [ChatScenario.PRONUNCIATION_SPECIALIST]: 'pronunciation-specialist',
  [ChatScenario.BUSINESS_SPECIALIST]: 'business-specialist',
  [ChatScenario.TRAVEL_SPECIALIST]: 'travel-specialist',
  [ChatScenario.IDIOMS_SPECIALIST]: 'idioms-specialist',
};

/**
 * Reverse mapping from URL slug to ChatScenario enum.
 * Used when parsing scenario from URL parameters.
 *
 * @constant {Record<string, ChatScenario>}
 * @readonly
 *
 * @example
 * ```ts
 * SLUG_TO_SCENARIO['job-interviews'] // ChatScenario.JOB_INTERVIEWS
 * SLUG_TO_SCENARIO['phone-screen']   // ChatScenario.PHONE_SCREEN
 * ```
 */
export const SLUG_TO_SCENARIO: Record<string, ChatScenario> = {
  'phone-screen': ChatScenario.PHONE_SCREEN,
  'phonescreen': ChatScenario.PHONE_SCREEN,
  'job-interviews': ChatScenario.JOB_INTERVIEWS,
  'jobinterviews': ChatScenario.JOB_INTERVIEWS,
  'travel-conversations': ChatScenario.TRAVEL_CONVERSATIONS,
  'travelconversations': ChatScenario.TRAVEL_CONVERSATIONS,
  'business-meetings': ChatScenario.BUSINESS_MEETINGS,
  'businessmeetings': ChatScenario.BUSINESS_MEETINGS,
  'grammar-specialist': ChatScenario.GRAMMAR_SPECIALIST,
  'grammaressentials': ChatScenario.GRAMMAR_SPECIALIST,
  'vocabulary-specialist': ChatScenario.VOCABULARY_SPECIALIST,
  'vocabularybuilder': ChatScenario.VOCABULARY_SPECIALIST,
  'pronunciation-specialist': ChatScenario.PRONUNCIATION_SPECIALIST,
  'pronunciationpractice': ChatScenario.PRONUNCIATION_SPECIALIST,
  'business-specialist': ChatScenario.BUSINESS_SPECIALIST,
  'businessenglish': ChatScenario.BUSINESS_SPECIALIST,
  'travel-specialist': ChatScenario.TRAVEL_SPECIALIST,
  'travelphrases': ChatScenario.TRAVEL_SPECIALIST,
  'idioms-specialist': ChatScenario.IDIOMS_SPECIALIST,
  'idiomsslang': ChatScenario.IDIOMS_SPECIALIST,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Converts a URL slug to its corresponding ChatScenario enum value.
 * Returns undefined if the slug is not a valid scenario.
 *
 * @function getScenarioFromSlug
 * @param {string} slug - The URL slug to convert
 * @returns {ChatScenario | undefined} The matching ChatScenario, or undefined if not found
 *
 * @example
 * ```ts
 * getScenarioFromSlug('job-interviews') // ChatScenario.JOB_INTERVIEWS
 * getScenarioFromSlug('invalid-scenario') // undefined
 * ```
 */
export const getScenarioFromSlug = (slug: string): ChatScenario | undefined => {
  return SLUG_TO_SCENARIO[slug];
};

/**
 * Converts a ChatScenario enum value to its URL slug representation.
 *
 * @function getSlugFromScenario
 * @param {ChatScenario} scenario - The ChatScenario to convert
 * @returns {string} The URL slug for this scenario
 *
 * @example
 * ```ts
 * getSlugFromScenario(ChatScenario.JOB_INTERVIEWS) // 'job-interviews'
 * ```
 */
export const getSlugFromScenario = (scenario: ChatScenario): string => {
  return SCENARIO_SLUGS[scenario];
};

/**
 * Checks if a given slug is a valid scenario slug.
 *
 * @function isValidScenarioSlug
 * @param {string} slug - The slug to validate
 * @returns {boolean} True if the slug corresponds to a valid scenario
 *
 * @example
 * ```ts
 * isValidScenarioSlug('job-interviews')  // true
 * isValidScenarioSlug('invalid-scenario') // false
 * ```
 */
export const isValidScenarioSlug = (slug: string): boolean => {
  return slug in SLUG_TO_SCENARIO;
};
