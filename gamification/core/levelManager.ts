/**
 * Level Manager — Pure Functions
 *
 * Calculates user level and progress from total XP.
 * No side effects, no external state — fully testable in isolation.
 *
 * @module gamification/core/levelManager
 */

import { GamificationConfig, LevelThreshold, validateConfig } from '../gamification.config';

// ============================================================================
// TYPES
// ============================================================================

export interface LevelInfo {
  /** Current level number (1–maxLevel) */
  level: number;
  /** Human-readable level label */
  label: string;
  /** Progress percentage within current level (0–100, integer) */
  progress: number;
  /** XP accumulated within the current level */
  currentLevelXp: number;
  /** XP needed to reach the next level (0 if at max level) */
  xpToNextLevel: number;
  /** Whether the user is at the maximum level */
  isMaxLevel: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function getSortedThresholds(config: GamificationConfig): LevelThreshold[] {
  return [...config.levelThresholds].sort((a, b) => a.minXp - b.minXp);
}

function getMaxLevel(config: GamificationConfig): number {
  return getSortedThresholds(config).at(-1)!.level;
}

// ============================================================================
// PURE FUNCTIONS
// ============================================================================

/**
 * Calculates the current level for a given total XP.
 * Returns the highest level whose minXp <= totalXp.
 *
 * @param totalXp - Total accumulated XP (>= 0)
 * @param config - Gamification configuration
 * @returns Level number (1–maxLevel)
 */
export function calculateLevel(totalXp: number, config: GamificationConfig): number {
  validateConfig(config);
  const thresholds = getSortedThresholds(config);
  // Walk from highest to lowest — return first level the user qualifies for
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (totalXp >= thresholds[i].minXp) return thresholds[i].level;
  }
  return thresholds[0].level;
}

/**
 * Calculates the progress percentage within the current level (0–100).
 * Returns 100 if the user is at the maximum level.
 *
 * @param totalXp - Total accumulated XP (>= 0)
 * @param config - Gamification configuration
 * @returns Progress percentage (integer 0–100)
 */
export function calculateProgress(totalXp: number, config: GamificationConfig): number {
  validateConfig(config);
  const thresholds = getSortedThresholds(config);
  const maxLevel = getMaxLevel(config);
  const currentLevel = calculateLevel(totalXp, config);

  if (currentLevel >= maxLevel) return 100;

  const currentThreshold = thresholds.find(t => t.level === currentLevel)!;
  const nextThreshold = thresholds.find(t => t.level === currentLevel + 1)!;
  const range = nextThreshold.minXp - currentThreshold.minXp;
  const earned = totalXp - currentThreshold.minXp;

  return Math.min(100, Math.max(0, Math.round((earned / range) * 100)));
}

/**
 * Returns complete level information for a given total XP.
 * Combines calculateLevel and calculateProgress into a single call.
 *
 * @param totalXp - Total accumulated XP (>= 0)
 * @param config - Gamification configuration
 * @returns LevelInfo object with all level-related data
 */
export function calculateLevelInfo(totalXp: number, config: GamificationConfig): LevelInfo {
  validateConfig(config);
  const thresholds = getSortedThresholds(config);
  const maxLevel = getMaxLevel(config);
  const level = calculateLevel(totalXp, config);
  const progress = calculateProgress(totalXp, config);
  const isMaxLevel = level >= maxLevel;

  const currentThreshold = thresholds.find(t => t.level === level)!;
  const nextThreshold = thresholds.find(t => t.level === level + 1);

  return {
    level,
    label: currentThreshold.label,
    progress,
    currentLevelXp: totalXp - currentThreshold.minXp,
    xpToNextLevel: isMaxLevel ? 0 : Math.max(0, nextThreshold!.minXp - totalXp),
    isMaxLevel,
  };
}
