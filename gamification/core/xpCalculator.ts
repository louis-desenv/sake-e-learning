/**
 * XP Calculator — Pure Functions
 *
 * Converts chat session duration into XP points.
 * No side effects, no external state — fully testable in isolation.
 *
 * @module gamification/core/xpCalculator
 */

import { GamificationConfig, validateConfig } from '../gamification.config';

/**
 * Calculates XP earned from a chat session duration.
 *
 * - Returns 0 if durationSeconds < config.minSessionSeconds
 * - Returns floor(durationSeconds / 60 * config.xpPerMinute) otherwise
 * - Always returns a non-negative integer
 *
 * @param durationSeconds - Session duration in seconds (>= 0)
 * @param config - Gamification configuration
 * @returns XP earned (non-negative integer)
 */
export function calculateXpFromDuration(
  durationSeconds: number,
  config: GamificationConfig,
  isVoice: boolean = false,
  isAvatar: boolean = false,
): number {
  validateConfig(config);
  if (durationSeconds < config.minSessionSeconds) return 0;
  
  let xpRate = isVoice ? config.xpPerMinuteVoice : config.xpPerMinute;
  if (isAvatar) {
    // ✅ FIX B11: usar config ao invés de valor hardcoded
    // xpPerMinuteVoice * 1.5 = 180 XP/min (3 XP/segundo) por padrão
    xpRate = Math.round(config.xpPerMinuteVoice * 1.5);
  }
  return Math.floor((durationSeconds / 60) * xpRate);
}

/**
 * Accumulates session XP into the user's total XP.
 *
 * - Guarantees result is never negative
 * - Ignores negative sessionXp values (treated as 0)
 *
 * @param currentTotalXp - Current total XP (>= 0)
 * @param sessionXp - XP earned in this session (>= 0)
 * @returns New total XP (>= currentTotalXp)
 */
export function accumulateXp(currentTotalXp: number, sessionXp: number): number {
  return Math.max(0, currentTotalXp + Math.max(0, sessionXp));
}
