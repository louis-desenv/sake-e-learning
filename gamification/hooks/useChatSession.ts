/**
 * useChatSession Hook
 *
 * Tracks the duration of a chat session and fires onSessionEnd
 * with the XP earned when the component unmounts or the browser closes.
 *
 * @module gamification/hooks/useChatSession
 */

import { useEffect, useRef } from 'react';
import { calculateXpFromDuration } from '../core/xpCalculator';
import { GamificationConfig, DEFAULT_GAMIFICATION_CONFIG } from '../gamification.config';

interface UseChatSessionOptions {
  /** User ID — session is a no-op if null */
  userId: string | null;
  /** Topic ID for logging/tracking purposes */
  topicId: string;
  /** Called when the session ends with XP earned and duration */
  onSessionEnd: (xpGained: number, durationSeconds: number) => void;
  /** Called in real-time as the user gains XP */
  onXpGainProgress?: (deltaXp: number) => void;
  /** Gamification config — defaults to DEFAULT_GAMIFICATION_CONFIG */
  config?: GamificationConfig;
  /** Whether this is a voice chat session (adds 2x XP) */
  isVoice?: boolean;
}

/**
 * Tracks chat session time and reports XP progressively.
 *
 * - Starts timing when the component mounts
 * - Syncs XP delta every 5 seconds to provide real-time leveling
 * - Stops timing and calls onSessionEnd when the component unmounts
 * - Handles abrupt browser close via beforeunload
 */
export function useChatSession({
  userId,
  topicId,
  onSessionEnd,
  onXpGainProgress,
  config = DEFAULT_GAMIFICATION_CONFIG,
  isVoice = false,
}: UseChatSessionOptions): void {
  const startTimeRef = useRef<number | null>(null);
  const awardedXpRef = useRef<number>(0);
  
  // Keep stable refs to callbacks
  const onSessionEndRef = useRef(onSessionEnd);
  onSessionEndRef.current = onSessionEnd;

  const onXpGainProgressRef = useRef(onXpGainProgress);
  onXpGainProgressRef.current = onXpGainProgress;

  useEffect(() => {
    if (!userId) return;

    startTimeRef.current = Date.now();
    awardedXpRef.current = 0;
    console.log(`[useChatSession] Session started: userId=${userId}, topicId=${topicId}`);

    // Real-time ticking interval (every 5 seconds)
    const tickInterval = setInterval(() => {
      if (!startTimeRef.current) return;
      
      const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (durationSeconds < config.minSessionSeconds) return;

      const totalXpSoFar = calculateXpFromDuration(durationSeconds, config, isVoice);
      const deltaXp = totalXpSoFar - awardedXpRef.current;

      if (deltaXp > 0) {
        awardedXpRef.current += deltaXp;
        console.log(`[useChatSession] Real-time XP sync: +${deltaXp} XP (total session: ${totalXpSoFar})`);
        onXpGainProgressRef.current?.(deltaXp);
      }
    }, 5000);

    const handleEnd = () => {
      if (!startTimeRef.current) return;
      const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      startTimeRef.current = null;
      clearInterval(tickInterval);

      if (durationSeconds <= 0) return;

      const finalTotalXp = calculateXpFromDuration(durationSeconds, config, isVoice);
      const finalDelta = finalTotalXp - awardedXpRef.current;

      if (finalDelta > 0) {
        awardedXpRef.current += finalDelta;
        onXpGainProgressRef.current?.(finalDelta);
      }

      console.log(`[useChatSession] Session ended: ${durationSeconds}s → ${awardedXpRef.current} XP total awarded`);
      onSessionEndRef.current(awardedXpRef.current, durationSeconds);
    };

    // Handle abrupt browser close
    window.addEventListener('beforeunload', handleEnd);

    return () => {
      window.removeEventListener('beforeunload', handleEnd);
      handleEnd();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, topicId, config, isVoice]);
}
