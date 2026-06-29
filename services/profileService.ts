import { supabase } from './supabase';

// ─── Adaptive Profile Types ────────────────────────────────────────────────

export interface AdaptiveEvidence {
  date: string;
  type: 'error' | 'strength' | 'progress';
  text: string;
  analysis: string;
}

export interface AdaptiveMilestone {
  milestone: string;
  date: string;
}

/**
 * Evidence-based adaptive profile stored as JSONB in `user_learning_profile.adaptive_profile`.
 * Updated by AI analysis at the end of each conversation session.
 */
export interface AdaptiveProfile {
  /** Confirmed grammar/vocabulary areas where the user excels */
  strengths: string[];
  /** Recurring error patterns or gaps the user needs to focus on */
  weaknesses: string[];
  /** Concrete evidence entries from actual conversation messages */
  evidence: AdaptiveEvidence[];
  /** Progress milestones achieved over time */
  progress: AdaptiveMilestone[];
  /** Suggestions from the last AI feedback session */
  last_feedback: string[];
}

export const DEFAULT_ADAPTIVE_PROFILE: AdaptiveProfile = {
  strengths: [],
  weaknesses: [],
  evidence: [],
  progress: [],
  last_feedback: [],
};

// ─── Core Profile Interface ───────────────────────────────────────────────

export interface UserLearningProfile {
  id?: string;
  user_id: string;
  scenario: string;
  total_conversations: number;
  total_time_seconds: number;
  total_messages: number;
  average_duration_seconds: number;
  current_level: string;
  level_progress: number;
  topics_practiced: string[];
  areas_to_improve: string[];
  common_mistakes: Record<string, number>;
  /** Evidence-based adaptive data updated by AI after each session */
  adaptive_profile?: AdaptiveProfile;
  last_practiced_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileUpdateData {
  duration?: number;
  messageCount?: number;
  corrections?: Array<{ original: string; corrected: string }>;
  topics?: string[];
  newMistakes?: Record<string, number>;
}

class ProfileService {
  async getOrCreateProfile(userId: string, scenario: string): Promise<UserLearningProfile | null> {
    const { data: existing, error: fetchError } = await supabase
      .from('user_learning_profile')
      .select('*')
      .eq('user_id', userId)
      .eq('scenario', scenario)
      .single();

    if (existing) {
      return existing;
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[ProfileService] Error fetching profile:', fetchError);
      return null;
    }

    const { data: newProfile, error: createError } = await supabase
      .from('user_learning_profile')
      .insert({
        user_id: userId,
        scenario,
        total_conversations: 0,
        total_time_seconds: 0,
        total_messages: 0,
        average_duration_seconds: 0,
        current_level: 'intermediate',
        level_progress: 0,
        topics_practiced: [],
        areas_to_improve: [],
        common_mistakes: {},
      })
      .select()
      .single();

    if (createError) {
      console.error('[ProfileService] Error creating profile:', createError);
      return null;
    }

    return newProfile;
  }

  async getProfile(userId: string, scenario: string): Promise<UserLearningProfile | null> {
    const { data, error } = await supabase
      .from('user_learning_profile')
      .select('*')
      .eq('user_id', userId)
      .eq('scenario', scenario)
      .single();

    if (error) {
      console.error('[ProfileService] Error fetching profile:', error);
      return null;
    }

    return data;
  }

  async getAllProfilesForUser(userId: string): Promise<UserLearningProfile[]> {
    const { data, error } = await supabase
      .from('user_learning_profile')
      .select('*')
      .eq('user_id', userId)
      .order('last_practiced_at', { ascending: false });

    if (error) {
      console.error('[ProfileService] Error fetching all profiles:', error);
      return [];
    }

    return data || [];
  }

  async updateProfile(
    userId: string,
    scenario: string,
    updateData: ProfileUpdateData
  ): Promise<boolean> {
    const profile = await this.getOrCreateProfile(userId, scenario);
    if (!profile) return false;

    const updates: Partial<UserLearningProfile> = {
      total_conversations: profile.total_conversations + 1,
      total_time_seconds: profile.total_time_seconds + (updateData.duration || 0),
      total_messages: profile.total_messages + (updateData.messageCount || 0),
      average_duration_seconds: Math.floor(
        (profile.total_time_seconds + (updateData.duration || 0)) /
        (profile.total_conversations + 1)
      ),
      last_practiced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (updateData.topics && updateData.topics.length > 0) {
      const existingTopics = profile.topics_practiced || [];
      const newTopics = updateData.topics.filter(t => !existingTopics.includes(t));
      updates.topics_practiced = [...existingTopics, ...newTopics];
    }

    if (updateData.newMistakes && Object.keys(updateData.newMistakes).length > 0) {
      const existingMistakes = profile.common_mistakes || {};
      const mergedMistakes: Record<string, number> = { ...existingMistakes };
      
      for (const [mistake, count] of Object.entries(updateData.newMistakes)) {
        mergedMistakes[mistake] = (mergedMistakes[mistake] || 0) + count;
      }
      
      updates.common_mistakes = mergedMistakes;
    }

    if (updateData.corrections && updateData.corrections.length > 0) {
      const existingAreas = profile.areas_to_improve || [];
      const newAreas = this.detectAreasToImprove(updateData.corrections);
      const uniqueNewAreas = newAreas.filter(a => !existingAreas.includes(a));
      updates.areas_to_improve = [...existingAreas, ...uniqueNewAreas].slice(0, 10);
    }

    const { error } = await supabase
      .from('user_learning_profile')
      .update(updates)
      .eq('user_id', userId)
      .eq('scenario', scenario);

    if (error) {
      console.error('[ProfileService] Error updating profile:', error);
      return false;
    }

    return true;
  }

  private detectAreasToImprove(corrections: Array<{ original: string; corrected: string }>): string[] {
    const areas: string[] = [];
    
    const patterns = [
      { pattern: /\b(is|are|am|was|were)\b/i, area: 'verb-to-be' },
      { pattern: /\b(do|does|did)\b/i, area: 'auxiliary-verbs' },
      { pattern: /\b(will|would|can|could|should|may|might)\b/i, area: 'modal-verbs' },
      { pattern: /\bhave\b|\bhas\b|\bhad\b/i, area: 'present-perfect' },
      { pattern: /\b\w+ing\b/i, area: 'gerunds-infinitives' },
      { pattern: /\b(to |to )\w+/i, area: 'infinitive' },
      { pattern: /\b(a|an|the)\b/i, area: 'articles' },
      { pattern: /\bi\b|\bI\b/g, area: 'capitalization' },
      { pattern: /['"]\w+['"]/i, area: 'punctuation-quotes' },
    ];

    for (const correction of corrections) {
      for (const { pattern, area } of patterns) {
        if (pattern.test(correction.original) || pattern.test(correction.corrected)) {
          if (!areas.includes(area)) {
            areas.push(area);
          }
        }
      }
    }

    return areas;
  }

  async updateUserLevel(
    userId: string,
    scenario: string,
    level: string,
    progress?: number
  ): Promise<boolean> {
    const updates: Partial<UserLearningProfile> = {
      current_level: level,
      updated_at: new Date().toISOString(),
    };

    if (progress !== undefined) {
      updates.level_progress = progress;
    }

    const { error } = await supabase
      .from('user_learning_profile')
      .update(updates)
      .eq('user_id', userId)
      .eq('scenario', scenario);

    if (error) {
      console.error('[ProfileService] Error updating user level:', error);
      return false;
    }

    return true;
  }

  /**
   * Updates the adaptive_profile JSONB field for a user+scenario profile.
   * Merges new data with existing data — strengths, weaknesses, evidence,
   * and progress are appended (with deduplication / capping), not overwritten.
   */
  async updateAdaptiveProfile(
    userId: string,
    scenario: string,
    newData: Partial<AdaptiveProfile>
  ): Promise<boolean> {
    const profile = await this.getOrCreateProfile(userId, scenario);
    if (!profile) return false;

    const existing: AdaptiveProfile = profile.adaptive_profile || { ...DEFAULT_ADAPTIVE_PROFILE };

    // Merge strengths (deduplicate, keep last 20)
    const strengths = [
      ...new Set([...existing.strengths, ...(newData.strengths || [])]),
    ].slice(-20);

    // Merge weaknesses (deduplicate, keep last 20)
    const weaknesses = [
      ...new Set([...existing.weaknesses, ...(newData.weaknesses || [])]),
    ].slice(-20);

    // Append evidence (keep last 50 most recent entries)
    const evidence = [
      ...existing.evidence,
      ...(newData.evidence || []),
    ].slice(-50);

    // Append progress milestones (keep last 30)
    const progress = [
      ...existing.progress,
      ...(newData.progress || []),
    ].slice(-30);

    // Replace last_feedback with most recent
    const last_feedback = newData.last_feedback || existing.last_feedback;

    const updatedAdaptiveProfile: AdaptiveProfile = {
      strengths,
      weaknesses,
      evidence,
      progress,
      last_feedback,
    };

    const { error } = await supabase
      .from('user_learning_profile')
      .update({
        adaptive_profile: updatedAdaptiveProfile,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('scenario', scenario);

    if (error) {
      console.error('[ProfileService] Error updating adaptive_profile:', error);
      return false;
    }

    console.log('[ProfileService] adaptive_profile updated successfully for', { userId, scenario });
    return true;
  }
}

export const profileService = new ProfileService();
