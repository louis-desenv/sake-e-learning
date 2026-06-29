import { supabase } from './supabase';

export interface Conversation {
  id: string;
  user_id: string;
  category: string;
  scenario: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
  message_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  message_type?: 'user' | 'welcome' | 'system';
  category?: string;
  scenario?: string;
  created_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface ScenarioPracticeStat {
  scenario: string;
  userMessageCount: number;
  hasConversation: boolean;
  hasCompletedSession: boolean;
}

export interface ConversationAccess {
  plan?: string | null;
  isTrial?: boolean;
}

class ConversationService {
  private shouldLimitHistory(access?: ConversationAccess): boolean {
    return !access?.isTrial && !access?.plan;
  }

  private getTodayRange() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return {
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    };
  }

  private async hydrateMessageCounts(conversations: Conversation[]): Promise<Conversation[]> {
    if (conversations.length === 0) return conversations;

    const conversationIds = conversations.map((conversation) => conversation.id);
    const { data, error } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds);

    if (error) {
      console.error('[ConversationService] Error fetching message counts:', error);
      return conversations.map((conversation) => ({
        ...conversation,
        message_count: conversation.message_count ?? 0,
      }));
    }

    const counts = (data || []).reduce<Record<string, number>>((acc, message) => {
      acc[message.conversation_id] = (acc[message.conversation_id] || 0) + 1;
      return acc;
    }, {});

    return conversations.map((conversation) => ({
      ...conversation,
      message_count: counts[conversation.id] || 0,
    }));
  }

  /**
   * Determinar a categoria (real-life ou learn) baseado no cenário
   */
  public getCategoryFromScenario(scenario: string): string {
    const guidedLearningScenarios = [
      'grammar-specialist',
      'vocabulary-specialist',
      'pronunciation-specialist',
      'business-specialist',
      'travel-specialist',
      'idioms-specialist',
    ];

    return guidedLearningScenarios.includes(scenario) ? 'learn' : 'real-life';
  }

  /**
   * Criar uma nova conversa
   */
  async createConversation(userId: string, scenario: string = 'real-life', category?: string): Promise<Conversation | null> {
    const finalCategory = category || this.getCategoryFromScenario(scenario);

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        category: finalCategory,
        scenario,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[ConversationService] SUPABASE ERROR creating conversation:', error, 'Payload was:', {
        user_id: userId,
        category: finalCategory,
        scenario,
        started_at: new Date().toISOString(),
      });
      return null;
    }

    console.log('[ConversationService] Conversation created:', data.id, 'category:', finalCategory, 'scenario:', scenario);
    return data;
  }

  /**
   * Finalizar uma conversa (atualizar ended_at e duration)
   */
  async endConversation(conversationId: string, durationSeconds: number): Promise<boolean> {
    const { error } = await supabase
      .from('conversations')
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq('id', conversationId);

    if (error) {
      console.error('[ConversationService] Error ending conversation:', error);
      return false;
    }

    console.log('[ConversationService] Conversation ended:', conversationId);
    return true;
  }

  /**
   * Adicionar uma mensagem à conversa com a categoria/cenario embutido
   */
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    messageType: 'user' | 'welcome' | 'system' = 'user',
    category: string = 'real-life',
    scenario: string = 'free-conversation'
  ): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        message_type: messageType,
        category,
        scenario,
      })
      .select()
      .single();

    if (error) {
      console.error('[ConversationService] Error adding message:', error);
      return null;
    }

    return data;
  }

  /**
   * Listar conversas de um usuário
   */
  async getConversations(userId: string, limit: number = 10, access?: ConversationAccess): Promise<Conversation[]> {
    const queryLimit = this.shouldLimitHistory(access) ? 1 : limit;
    let query = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(queryLimit);

    if (this.shouldLimitHistory(access)) {
      const { startIso, endIso } = this.getTodayRange();
      query = query.gte('created_at', startIso).lt('created_at', endIso);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ConversationService] Error fetching conversations:', error);
      return [];
    }

    return this.hydrateMessageCounts(data || []);
  }

  /**
   * Buscar uma conversa específica com todas as mensagens
   */
  async getAllConversations(userId: string, pageSize: number = 1000, access?: ConversationAccess): Promise<Conversation[]> {
    if (this.shouldLimitHistory(access)) {
      return this.getConversations(userId, 1, access);
    }

    const allConversations: Conversation[] = [];
    let from = 0;

    while (true) {
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('[ConversationService] Error fetching all conversations:', error);
        break;
      }

      const page = data || [];
      allConversations.push(...page);

      if (page.length < pageSize) break;
      from += pageSize;
    }

    return this.hydrateMessageCounts(allConversations);
  }

  async getConversationWithMessages(conversationId: string): Promise<ConversationWithMessages | null> {
    // Buscar conversa
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('[ConversationService] Error fetching conversation:', convError);
      return null;
    }

    // Buscar mensagens
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.error('[ConversationService] Error fetching messages:', msgError);
      return null;
    }

    return {
      ...conversation,
      messages: messages || [],
    };
  }

  /**
   * Listar conversas por cenário
   */
  async getConversationsByScenario(
    userId: string,
    scenario: string,
    limit: number = 10,
    access?: ConversationAccess
  ): Promise<Conversation[]> {
    const queryLimit = this.shouldLimitHistory(access) ? 1 : limit;
    let query = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('scenario', scenario)
      .order('created_at', { ascending: false })
      .limit(queryLimit);

    if (this.shouldLimitHistory(access)) {
      const { startIso, endIso } = this.getTodayRange();
      query = query.gte('created_at', startIso).lt('created_at', endIso);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ConversationService] Error fetching conversations by scenario:', error);
      return [];
    }

    return this.hydrateMessageCounts(data || []);
  }

  /**
   * Listar conversas por categoria (real-life ou learn)
   */
  async getConversationsByCategory(
    userId: string,
    category: string,
    limit: number = 10,
    access?: ConversationAccess
  ): Promise<Conversation[]> {
    const queryLimit = this.shouldLimitHistory(access) ? 1 : limit;
    let query = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(queryLimit);

    if (this.shouldLimitHistory(access)) {
      const { startIso, endIso } = this.getTodayRange();
      query = query.gte('created_at', startIso).lt('created_at', endIso);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ConversationService] Error fetching conversations by category:', error);
      return [];
    }

    return this.hydrateMessageCounts(data || []);
  }

  async getScenarioPracticeStats(
    userId: string,
    category: string
  ): Promise<Record<string, ScenarioPracticeStat>> {
    const conversations = await this.getConversationsByCategory(userId, category, 1000);
    if (conversations.length === 0) return {};

    const stats = conversations.reduce<Record<string, ScenarioPracticeStat>>((acc, conversation) => {
      const scenario = conversation.scenario;
      if (!acc[scenario]) {
        acc[scenario] = {
          scenario,
          userMessageCount: 0,
          hasConversation: true,
          hasCompletedSession: false,
        };
      }

      acc[scenario].hasConversation = true;
      acc[scenario].hasCompletedSession = acc[scenario].hasCompletedSession || Boolean(conversation.ended_at);
      return acc;
    }, {});

    const conversationIds = conversations.map(conversation => conversation.id);
    const { data, error } = await supabase
      .from('messages')
      .select('conversation_id, scenario')
      .eq('role', 'user')
      .in('conversation_id', conversationIds);

    if (error) {
      console.error('[ConversationService] Error fetching scenario practice stats:', error);
      return stats;
    }

    for (const message of data || []) {
      const conversation = conversations.find(item => item.id === message.conversation_id);
      const scenario = message.scenario || conversation?.scenario;
      if (!scenario) continue;

      if (!stats[scenario]) {
        stats[scenario] = {
          scenario,
          userMessageCount: 0,
          hasConversation: true,
          hasCompletedSession: false,
        };
      }

      stats[scenario].userMessageCount += 1;
    }

    return stats;
  }

  /**
   * Deletar uma conversa e suas mensagens
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      console.error('[ConversationService] Error deleting conversation:', error);
      return false;
    }

    return true;
  }
}

export const conversationService = new ConversationService();
