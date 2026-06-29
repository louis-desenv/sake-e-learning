/**
 * useGamification Hook
 *
 * Public API for components to consume gamification state.
 * Wraps GamificationContext with a clean, flat interface.
 *
 * @module gamification/hooks/useGamification
 */

import { useGamificationContext } from '../context/GamificationContext';
import { TopicAccessResult } from '../core/accessController';

export interface UseGamificationReturn {
  /** Total accumulated XP */
  totalXp: number;
  /** Current level number (1–5) */
  level: number;
  /** Human-readable level label */
  levelLabel: string;
  /** Progress percentage within current level (0–100) */
  progress: number;
  /** XP needed to reach the next level (0 if at max level) */
  xpToNextLevel: number;
  /** XP accumulated within the current level (resets at each level boundary) */
  currentLevelXp: number;
  /** Total XP range of the current level (nextLevelMinXp - currentLevelMinXp) */
  levelXpRange: number;
  /** Whether the user is at the maximum level */
  isMaxLevel: boolean;
  /** Whether the profile is still loading from Supabase */
  isLoading: boolean;
  /** XP gained in the most recent session (0 if no recent gain) */
  lastXpGained: number;
  /** Whether the user just leveled up (cleared by dismissLevelUp) */
  didLevelUp: boolean;
  /** Topic IDs newly unlocked after the last level up */
  newlyUnlockedTopics: string[];
  /** Access information for all configured topics */
  topicAccess: TopicAccessResult[];
  /** Voice chat time limit in seconds for current level (null = unlimited, 0 = no access) */
  voiceChatLimitSeconds: number | null;
  /** Whether voice chat is accessible at the current level */
  isVoiceChatUnlocked: boolean;
  /** Returns true if the given topicId is accessible at the current level */
  isTopicUnlocked: (topicId: string) => boolean;
  /** Seconds of voice chat already used today */
  voiceSecondsUsedToday: number;
  /** Seconds of voice chat remaining today (null = unlimited) */
  voiceSecondsRemaining: number | null;
  /** Whether the avatar chat is unlocked (level 3+) */
  isAvatarUnlocked: boolean;
  /** Avatar time limit in seconds (null = unlimited) */
  avatarLimitSeconds: number | null;
  /** Seconds of avatar chat already used today */
  avatarSecondsUsedToday: number;
  /** Seconds of avatar chat remaining today (null = unlimited) */
  avatarSecondsRemaining: number | null;
  /** Adds XP to the user's total and persists to Supabase */
  addXp: (xp: number, activityDetails?: { type: string; label: string; reason: string }) => Promise<void>;
  /** Records seconds of voice chat usage */
  recordVoiceUsage: (seconds: number) => Promise<void>;
  /** Records seconds of avatar chat usage */
  recordAvatarUsage: (seconds: number) => Promise<void>;
  /** Resets the user's gamification progress to Level 1 and 0 XP */
  resetProfile: () => Promise<void>;
  /** Clears the level-up modal state */
  dismissLevelUp: () => void;
  /** Clears the XP gain toast state */
  dismissXpToast: () => void;
  /** Streak days tracked by the API */
  streakDays: number;
  /** Next reset time UTC */
  nextResetTimeUtc: string | null;
}

export function useGamification(): UseGamificationReturn {
  const ctx = useGamificationContext();

  return {
    // ... previous fields
    totalXp: ctx.profile?.total_xp ?? 0,
    level: ctx.levelInfo?.level ?? 1,
    levelLabel: ctx.levelInfo?.label ?? 'Beginner',
    progress: ctx.levelInfo?.progress ?? 0,
    xpToNextLevel: ctx.levelInfo?.xpToNextLevel ?? 0,
    currentLevelXp: ctx.levelInfo?.currentLevelXp ?? 0,
    // levelXpRange = currentLevelXp + xpToNextLevel (= total interval for current level)
    levelXpRange: (ctx.levelInfo?.currentLevelXp ?? 0) + (ctx.levelInfo?.xpToNextLevel ?? 0),
    isMaxLevel: ctx.levelInfo?.isMaxLevel ?? false,
    isLoading: ctx.isLoading,
    lastXpGained: ctx.lastXpGained,
    didLevelUp: ctx.didLevelUp,
    newlyUnlockedTopics: ctx.newlyUnlockedTopics,
    topicAccess: ctx.topicAccess,
    voiceChatLimitSeconds: ctx.voiceDailyLimitSeconds < 0 ? null : ctx.voiceDailyLimitSeconds,
    isVoiceChatUnlocked: ctx.voiceDailyLimitSeconds !== 0,
    voiceSecondsUsedToday: ctx.profile?.voice_seconds_used_today ?? 0,
    voiceSecondsRemaining: (() => {
      const limit = ctx.voiceDailyLimitSeconds;
      if (limit < 0) return null;
      return Math.max(0, limit - (ctx.profile?.voice_seconds_used_today ?? 0));
    })(),
    avatarLimitSeconds: ctx.profile?.avatar_daily_limit_seconds ?? 60,
    avatarSecondsUsedToday: ctx.profile?.avatar_seconds_used_today ?? 0,
    avatarSecondsRemaining: (() => {
      const limit = ctx.profile?.avatar_daily_limit_seconds ?? 60;
      if (limit < 0) return null; // unlimited
      return Math.max(0, limit - (ctx.profile?.avatar_seconds_used_today ?? 0));
    })(),
    isAvatarUnlocked: (ctx.levelInfo?.level ?? 1) >= 3,
    isTopicUnlocked: (topicId: string) =>
      ctx.topicAccess.find(t => t.topicId === topicId)?.isUnlocked ?? false,
    addXp: ctx.addXp,
    recordVoiceUsage: ctx.recordVoiceUsage,
    recordAvatarUsage: ctx.recordAvatarUsage,
    resetProfile: ctx.resetProfile,
    dismissLevelUp: ctx.dismissLevelUp,
    dismissXpToast: ctx.dismissXpToast,
    streakDays: ctx.streakDays,
    nextResetTimeUtc: ctx.nextResetTimeUtc,
  };
}
