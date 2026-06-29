/**
 * Gamification Repository Interface
 *
 * Defines the contract for gamification data persistence.
 * Implementations can be swapped without
 * changing any consumer code — enabling easy unit testing.
 *
 * @module gamification/repository/IGamificationRepository
 */

// ============================================================================
// TYPES
// ============================================================================

export interface GamificationProfile {
  /** User identifier — TEXT matching the user_id pattern in other Supabase tables */
  user_id: string;
  /** Total accumulated XP (>= 0) */
  total_xp: number;
  /** Current level (1–5) */
  current_level: number;
  /** Progress percentage within current level (0–100) */
  level_progress: number;
  /** ISO timestamp of record creation */
  created_at?: string;
  /** ISO timestamp of last update */
  updated_at?: string;
  /** Voice seconds used in the current date */
  voice_seconds_used_today?: number;
  /** Total voice seconds used across the entire lifetime (used for Level 1 trial) */
  voice_seconds_used_lifetime?: number;
  /** Last date (YYYY-MM-DD) when voice chat was used */
  last_voice_chat_date?: string;
  /** Avatar seconds used in the current date */
  avatar_seconds_used_today?: number;
  /** Avatar daily limit (assigned by context/backend, not strictly DB) */
  avatar_daily_limit_seconds?: number;
}

// ============================================================================
// INTERFACE
// ============================================================================

export interface IGamificationRepository {
  /**
   * Fetches the gamification profile for a user.
   * Returns null if no profile exists yet.
   */
  getProfile(userId: string): Promise<GamificationProfile | null>;

  /**
   * Creates or updates the gamification profile (upsert by user_id).
   * Returns the persisted profile, or null if persistence failed.
   */
  upsertProfile(
    profile: Omit<GamificationProfile, 'created_at' | 'updated_at'>,
  ): Promise<GamificationProfile | null>;

  /**
   * Returns the existing profile or creates a default one (level 1, 0 XP).
   * Never returns null — falls back to an in-memory default if persistence fails.
   */
  getOrCreateProfile(userId: string): Promise<GamificationProfile>;
}
