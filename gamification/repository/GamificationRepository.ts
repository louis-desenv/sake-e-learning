/**
 * Gamification Repository — Supabase Implementation
 *
 * Persists and retrieves gamification profiles from Supabase.
 * Follows the same singleton pattern as profileService and conversationService.
 *
 * Fail-safe: persistence errors are logged but never thrown to callers.
 *
 * @module gamification/repository/GamificationRepository
 */

import { supabase } from '../../services/supabase';
import { IGamificationRepository, GamificationProfile } from './IGamificationRepository';

const TABLE = 'user_gamification_profile';

const DEFAULT_PROFILE = (userId: string): GamificationProfile => ({
  user_id: userId,
  total_xp: 0,
  current_level: 1,
  level_progress: 0,
  voice_seconds_used_today: 0,
  voice_seconds_used_lifetime: 0,
  last_voice_chat_date: new Date().toISOString().split('T')[0],
});

class GamificationRepository implements IGamificationRepository {
  async getProfile(userId: string): Promise<GamificationProfile | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .single();

    // PGRST116 = row not found — not an error, just no profile yet
    if (error && error.code !== 'PGRST116') {
      console.error('[GamificationRepository] getProfile error:', error);
      return null;
    }

    if (!data) return null;

    const profile = data as GamificationProfile;
    const todayDateStr = new Date().toISOString().split('T')[0];

    // Mirror fallback from localStorage if Supabase failed to store columns
    const localBackupKey = `sakae_voice_backup_${userId}`;
    const localBackup = JSON.parse(localStorage.getItem(localBackupKey) || '{}');

    if (profile.voice_seconds_used_today === undefined || profile.voice_seconds_used_today === null) {
      profile.voice_seconds_used_today = localBackup.voice_seconds_used_today ?? 0;
    }
    if (profile.voice_seconds_used_lifetime === undefined || profile.voice_seconds_used_lifetime === null) {
      profile.voice_seconds_used_lifetime = localBackup.voice_seconds_used_lifetime ?? 0;
    }
    if (!profile.last_voice_chat_date) {
      profile.last_voice_chat_date = localBackup.last_voice_chat_date ?? todayDateStr;
    }

    // Reset daily voice chat limit if it's a new day
    if (profile.last_voice_chat_date && profile.last_voice_chat_date !== todayDateStr) {
      profile.voice_seconds_used_today = 0;
      profile.last_voice_chat_date = todayDateStr;

      // Update localStorage backup as well
      localStorage.setItem(localBackupKey, JSON.stringify({
        voice_seconds_used_today: 0,
        voice_seconds_used_lifetime: profile.voice_seconds_used_lifetime,
        last_voice_chat_date: todayDateStr,
      }));
    }

    return profile;
  }

  async upsertProfile(
    profile: Omit<GamificationProfile, 'created_at' | 'updated_at'>,
  ): Promise<GamificationProfile | null> {
    console.log('[Supabase] Persistindo perfil de gamificação:', {
      user: profile.user_id,
      xp: profile.total_xp,
      level: profile.current_level,
      progress: `${profile.level_progress}%`,
      voiceUsedToday: profile.voice_seconds_used_today
    });

    // Save daily limit progress to localStorage backup mirror
    const localBackupKey = `sakae_voice_backup_${profile.user_id}`;
    localStorage.setItem(localBackupKey, JSON.stringify({
      voice_seconds_used_today: profile.voice_seconds_used_today ?? 0,
      voice_seconds_used_lifetime: profile.voice_seconds_used_lifetime ?? 0,
      last_voice_chat_date: profile.last_voice_chat_date ?? new Date().toISOString().split('T')[0],
    }));

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(
        { ...profile, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
      .select()
      .single();

    if (error) {
      // PGRST204 = missing column error. Or checks if the error message complains about last_voice_chat_date or daily limit columns
      if (error.code === 'PGRST204' || (error.message && error.message.includes('column'))) {
        console.warn('[Supabase] Colunas de limite de voz ausentes no banco. Tentando persistir apenas dados principais de gamificação (Fallback)...');
        
        const coreProfile = {
          user_id: profile.user_id,
          total_xp: profile.total_xp,
          current_level: profile.current_level,
          level_progress: profile.level_progress,
          updated_at: new Date().toISOString()
        };

        const { data: retryData, error: retryError } = await supabase
          .from(TABLE)
          .upsert(
            coreProfile,
            { onConflict: 'user_id' }
          )
          .select()
          .single();

        if (!retryError) {
          console.log('[Supabase] Perfil core persistido com sucesso (Fallback) ✅');
          return retryData as GamificationProfile;
        }
        
        console.error('[Supabase] Erro ao persistir perfil core (Fallback):', retryError);
      }

      console.error('[Supabase] Erro ao persistir perfil:', error);
      return null;
    }

    console.log('[Supabase] Perfil persistido com sucesso ✅');
    return data;
  }

  async getOrCreateProfile(userId: string): Promise<GamificationProfile> {
    const existing = await this.getProfile(userId);
    if (existing) return existing;

    const created = await this.upsertProfile(DEFAULT_PROFILE(userId));

    // Fail-safe: if Supabase is unavailable, return in-memory default
    return created ?? DEFAULT_PROFILE(userId);
  }
}

export const gamificationRepository = new GamificationRepository();
