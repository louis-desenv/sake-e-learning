/**
 * Gamification Context
 *
 * Global state for the gamification system.
 * Wires together the config, core engine, and API service into a React Provider.
 *
 * Key design decisions:
 * - Uses C# WebAPI as single source of truth for XP, Level, Streaks, and Voice limits.
 *
 * @module gamification/context/GamificationContext
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { GamificationProfile } from '../repository/IGamificationRepository';
import { GamificationConfig, DEFAULT_GAMIFICATION_CONFIG } from '../gamification.config';
import { calculateLevelInfo, LevelInfo } from '../core/levelManager';
import { getAllTopicAccess, TopicAccessResult } from '../core/accessController';
import { useDailyResetReminder } from '../hooks/useDailyResetReminder';
import { fetchGamificationStatus, reportVoiceUsage as apiReportVoiceUsage, addXp as apiAddXp } from '../../services/gamificationApiService';

// ============================================================================
// TYPES
// ============================================================================

export interface GamificationContextType {
  profile: GamificationProfile | null;
  levelInfo: LevelInfo | null;
  topicAccess: TopicAccessResult[];
  isLoading: boolean;
  lastXpGained: number;
  didLevelUp: boolean;
  newlyUnlockedTopics: string[];
  config: GamificationConfig;
  streakDays: number;
  voiceDailyLimitSeconds: number;
  nextResetTimeUtc: string | null;
  addXp: (xpGained: number, activityDetails?: { type: string; label: string; reason: string }) => Promise<void>;
  recordVoiceUsage: (seconds: number) => Promise<void>;
  recordAvatarUsage: (seconds: number) => Promise<void>;
  resetProfile: () => Promise<void>;
  dismissLevelUp: () => void;
  dismissXpToast: () => void;
}

interface GamificationProviderProps {
  children: ReactNode;
  userId: string | null;
  config?: GamificationConfig;
  bypassAccess?: boolean;
  /** Only show the daily reset reminder toast once onboarding + tour are complete */
  enableResetReminder?: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const GamificationProvider: React.FC<GamificationProviderProps> = ({
  children,
  userId,
  config = DEFAULT_GAMIFICATION_CONFIG,
  bypassAccess = false,
  enableResetReminder = false,
}) => {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [voiceDailyLimitSeconds, setVoiceDailyLimitSeconds] = useState(300);
  const [nextResetTimeUtc, setNextResetTimeUtc] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [lastXpGained, setLastXpGained] = useState(0);
  const [didLevelUp, setDidLevelUp] = useState(false);
  const [newlyUnlockedTopics, setNewlyUnlockedTopics] = useState<string[]>([]);

  useDailyResetReminder({
    enabled: Boolean(userId) && enableResetReminder,
    nextResetTimeUtc,
    userId,
  });

  // Load profile when userId changes
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchGamificationStatus()
      .then((status) => {
        if (status) {
          setProfile({
            user_id: userId,
            total_xp: bypassAccess ? 1_000_000 : status.totalXP,
            current_level: bypassAccess ? 6 : status.currentLevel,
            level_progress: 0, // Not tracked strictly if not needed, or calculated
            voice_seconds_used_today: bypassAccess ? 0 : status.voiceSecondsUsedToday,
            avatar_seconds_used_today: bypassAccess ? 0 : status.avatarSecondsUsedToday,
            avatar_daily_limit_seconds: bypassAccess ? -1 : status.avatarDailyLimitSeconds,
          });
          setStreakDays(status.streakDays);
          setVoiceDailyLimitSeconds(bypassAccess ? -1 : status.voiceDailyLimitSeconds);
          setNextResetTimeUtc(status.nextResetTimeUtc);
        }
      })
      .catch(err => console.error('[GamificationContext] load error:', err))
      .finally(() => setIsLoading(false));
  }, [bypassAccess, userId]);

  // Derived state — recalculated on every profile change
  const levelInfo = profile ? calculateLevelInfo(profile.total_xp, config) : null;
  const topicAccess = profile
    ? getAllTopicAccess(profile.current_level, profile.total_xp, config)
    : [];

  const addXp = useCallback(
    async (xpGained: number, activityDetails?: { type: string; label: string; reason: string }) => {
      if (!userId || xpGained <= 0) return;

      const previousLevel = profile?.current_level || 1;
      const prevXpForUnlock = profile?.total_xp || 0;

      const newStatus = await apiAddXp(xpGained);
      if (newStatus) {
        setProfile(prev => prev ? {
          ...prev,
          total_xp: newStatus.totalXP,
          current_level: newStatus.currentLevel,
          voice_seconds_used_today: newStatus.voiceSecondsUsedToday,
          avatar_seconds_used_today: newStatus.avatarSecondsUsedToday,
          avatar_daily_limit_seconds: newStatus.avatarDailyLimitSeconds,
        } : null);
        setStreakDays(newStatus.streakDays);
        setNextResetTimeUtc(newStatus.nextResetTimeUtc);
        
        setLastXpGained(xpGained);
        
        if (newStatus.currentLevel > previousLevel) {
           setDidLevelUp(true);
           const prevUnlocked = getAllTopicAccess(previousLevel, prevXpForUnlock, config)
              .filter(t => t.isUnlocked)
              .map(t => t.topicId);
           const nowUnlocked = getAllTopicAccess(newStatus.currentLevel, newStatus.totalXP, config)
              .filter(t => t.isUnlocked)
              .map(t => t.topicId);
           setNewlyUnlockedTopics(nowUnlocked.filter(t => !prevUnlocked.includes(t)));
        }

        // Save activity details to localStorage for history logs
        try {
          const details = activityDetails || {
            type: 'general',
            label: 'Estudo Diário',
            reason: 'Praticou inglês e melhorou suas habilidades gerais.'
          };
          const logEntry = {
            id: Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            xp: xpGained,
            ...details
          };
          const key = `sakae_xp_logs_${userId}`;
          const currentLogs = JSON.parse(localStorage.getItem(key) || '[]');
          const updatedLogs = [logEntry, ...currentLogs].slice(0, 5); // Keep top 5 recent activities
          localStorage.setItem(key, JSON.stringify(updatedLogs));
        } catch (e) {
          console.error('[GamificationContext] error saving XP activity log:', e);
        }
      }
    },
    [userId, config, profile]
  );

  const recordVoiceUsage = useCallback(async (seconds: number) => {
    if (!userId || seconds <= 0 || bypassAccess) return;
    const success = await apiReportVoiceUsage(seconds);
    if (success) {
      setProfile(prev => prev ? {
        ...prev,
        voice_seconds_used_today: (prev.voice_seconds_used_today || 0) + seconds
      } : null);
    }
  }, [userId, bypassAccess]);

  const recordAvatarUsage = useCallback(async (seconds: number) => {
    if (!userId || seconds <= 0 || bypassAccess) return;
    const { reportAvatarUsage } = await import('../../services/gamificationApiService');
    const success = await reportAvatarUsage(seconds);
    if (success) {
      setProfile(prev => prev ? {
        ...prev,
        avatar_seconds_used_today: (prev.avatar_seconds_used_today || 0) + seconds
      } : null);
    }
  }, [userId, bypassAccess]);

  const resetProfile = useCallback(async () => {
    // Left empty intentionally, or can implement an API call to reset if needed
    console.warn("resetProfile is not supported with API-driven gamification");
  }, []);

  const dismissLevelUp = useCallback(() => {
    setDidLevelUp(false);
    setNewlyUnlockedTopics([]);
  }, []);

  const dismissXpToast = useCallback(() => setLastXpGained(0), []);

  return (
    <GamificationContext.Provider
      value={{
        profile,
        levelInfo,
        topicAccess,
        isLoading,
        lastXpGained,
        didLevelUp,
        newlyUnlockedTopics,
        config,
        streakDays,
        voiceDailyLimitSeconds,
        nextResetTimeUtc,
        addXp,
        recordVoiceUsage,
        recordAvatarUsage,
        resetProfile,
        dismissLevelUp,
        dismissXpToast,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

// ============================================================================
// HOOK
// ============================================================================

export const useGamificationContext = (): GamificationContextType => {
  const ctx = useContext(GamificationContext);
  if (!ctx) {
    throw new Error('useGamificationContext must be used within a GamificationProvider');
  }
  return ctx;
};
