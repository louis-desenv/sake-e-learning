import { supabase } from './supabase';

export interface Scenario {
  id: string;
  user_id: string | null;
  category: 'real-life' | 'learn';
  title: string;
  description: string;
  slug: string;
  scenario_id: string;
  system_prompt: string | null;
  is_locked: boolean;
  required_messages: number;
  required_level?: number;
  generation_source?: 'automatic' | 'manual' | 'default';
  metadata?: {
    goal?: string;
    tutorRole?: string;
    studentRole?: string;
    challenges?: string[];
    vocabulary?: string[];
  } | null;
  created_at: string;
}

export interface PaginatedScenarios {
  data: Scenario[];
  total: number;
  page: number;
  limit: number;
}

class ScenarioService {
  private isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
    if (!error) return false;
    const message = error.message?.toLowerCase() || '';
    return (
      error.code === '42703' ||
      error.code === 'PGRST204' ||
      message.includes('column') ||
      message.includes('schema cache')
    );
  }

  private toLegacyScenarioInsert(scenario: Omit<Scenario, 'id' | 'created_at'>, slug: string) {
    return {
      user_id: scenario.user_id,
      category: scenario.category,
      title: scenario.title,
      description: scenario.description,
      slug,
      scenario_id: scenario.scenario_id,
      system_prompt: scenario.system_prompt,
      is_locked: scenario.is_locked,
      required_messages: scenario.required_messages,
    };
  }

  /**
   * Get scenarios for a user with pagination, combining default and custom scenarios.
   */
  async getScenarios(
    userId: string,
    category: 'real-life' | 'learn',
    page: number = 1,
    limit: number = 6
  ): Promise<PaginatedScenarios> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Use user_id as a string (support dev environment string IDs)
    const userFilter = `user_id.is.null,user_id.eq.${userId}`;

    const { data, error, count } = await supabase
      .from('scenarios')
      .select('*', { count: 'exact' })
      .eq('category', category)
      .or(userFilter)
      .order('created_at', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('[ScenarioService] Error fetching scenarios:', error);
      return { data: [], total: 0, page, limit };
    }

    return {
      data: data as Scenario[],
      total: count || 0,
      page,
      limit,
    };
  }

  /**
   * Get a single scenario by slug
   */
  async getScenarioBySlug(slug: string, userId: string): Promise<Scenario | null> {
    const userFilter = `user_id.is.null,user_id.eq.${userId}`;

    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('slug', slug)
      .or(userFilter)
      .single();

    if (error) {
      console.error('[ScenarioService] Error fetching scenario by slug:', error);
      return null;
    }

    return data as Scenario;
  }

  /**
   * Unlock a specific scenario for a user
   */
  async unlockScenario(scenarioId: string): Promise<boolean> {
    const { error } = await supabase
      .from('scenarios')
      .update({ is_locked: false })
      .eq('id', scenarioId);

    if (error) {
      console.error('[ScenarioService] Error unlocking scenario:', error);
      return false;
    }
    return true;
  }

  /**
   * Save a newly generated custom scenario
   */
  async saveCustomScenario(scenario: Omit<Scenario, 'id' | 'created_at'>): Promise<Scenario | null> {
    const uniqueSlug = await this.createUniqueSlug(scenario.slug, scenario.user_id);
    const { data, error } = await supabase
      .from('scenarios')
      .insert({ ...scenario, slug: uniqueSlug })
      .select()
      .single();

    if (!error) {
      return data as Scenario;
    }

    if (!this.isMissingColumnError(error)) {
      console.error('[ScenarioService] Error saving custom scenario:', error);
      return null;
    }

    console.warn(
      '[ScenarioService] Scenario table is missing generated-scenario columns. Retrying with legacy schema.',
      error,
    );

    const legacyInsert = this.toLegacyScenarioInsert(scenario, uniqueSlug);
    const { data: legacyData, error: legacyError } = await supabase
      .from('scenarios')
      .insert(legacyInsert)
      .select()
      .single();

    if (legacyError) {
      console.error('[ScenarioService] Error saving custom scenario with legacy schema:', legacyError);
      return null;
    }

    return {
      ...(legacyData as Scenario),
      required_level: scenario.required_level,
      generation_source: scenario.generation_source,
      metadata: scenario.metadata,
    };
  }

  private async createUniqueSlug(slug: string, userId: string | null): Promise<string> {
    if (!userId) return slug;

    const { data } = await supabase
      .from('scenarios')
      .select('slug')
      .eq('user_id', userId)
      .like('slug', `${slug}%`);

    const existingSlugs = new Set((data || []).map(item => item.slug));
    if (!existingSlugs.has(slug)) {
      return slug;
    }

    let suffix = 2;
    while (existingSlugs.has(`${slug}-${suffix}`)) {
      suffix += 1;
    }
    return `${slug}-${suffix}`;
  }

  /**
   * Delete a custom scenario
   */
  async deleteScenario(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[ScenarioService] Error deleting scenario:', error);
      return false;
    }
    return true;
  }
}

export const scenarioService = new ScenarioService();
