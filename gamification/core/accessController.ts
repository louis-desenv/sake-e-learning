/**
 * Access Controller — Pure Functions
 *
 * Determines which topics are unlocked for a given user level.
 * No side effects, no external state — fully testable in isolation.
 *
 * @module gamification/core/accessController
 */

import { GamificationConfig, validateConfig } from '../gamification.config';

// ============================================================================
// TYPES
// ============================================================================

export interface TopicAccessResult {
  /** Topic ID */
  topicId: string;
  /** Whether the topic is accessible at the given user level */
  isUnlocked: boolean;
  /** Minimum level required to access this topic */
  requiredLevel: number;
  /** XP still needed to unlock this topic (0 if already unlocked) */
  xpRequired: number;
}

// ============================================================================
// PURE FUNCTIONS
// ============================================================================

/**
 * Checks whether a specific topic is unlocked for a given user level.
 * Returns false for unknown topics (fail-safe by default).
 *
 * @param userLevel - Current user level (1–maxLevel)
 * @param topicId - Topic ID to check
 * @param config - Gamification configuration
 * @returns true if the topic is accessible, false otherwise
 */
export function isTopicUnlocked(
  userLevel: number,
  topicId: string,
  config: GamificationConfig,
): boolean {
  validateConfig(config);
  const rule = config.topicAccessRules.find(r => r.topicId === topicId);
  if (!rule) return false; // unknown topic = locked (fail-safe)
  return userLevel >= rule.minLevel;
}

/**
 * Returns all topic IDs that are unlocked for a given user level.
 *
 * @param userLevel - Current user level (1–maxLevel)
 * @param config - Gamification configuration
 * @returns Array of unlocked topic IDs
 */
export function getUnlockedTopics(
  userLevel: number,
  config: GamificationConfig,
): string[] {
  validateConfig(config);
  return config.topicAccessRules
    .filter(r => userLevel >= r.minLevel)
    .map(r => r.topicId);
}

/**
 * Returns access information for all topics in the config.
 * Includes unlock status, required level, and XP still needed.
 *
 * @param userLevel - Current user level (1–maxLevel)
 * @param totalXp - User's total accumulated XP
 * @param config - Gamification configuration
 * @returns Array of TopicAccessResult for every configured topic
 */
export function getAllTopicAccess(
  userLevel: number,
  totalXp: number,
  config: GamificationConfig,
): TopicAccessResult[] {
  validateConfig(config);
  return config.topicAccessRules.map(rule => {
    const levelThreshold = config.levelThresholds.find(t => t.level === rule.minLevel);
    const minXpForLevel = levelThreshold?.minXp ?? 0;
    return {
      topicId: rule.topicId,
      isUnlocked: userLevel >= rule.minLevel,
      requiredLevel: rule.minLevel,
      xpRequired: Math.max(0, minXpForLevel - totalXp),
    };
  });
}
