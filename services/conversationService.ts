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

class ConversationService {
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
  async getConversations(userId: string, limit: number = 10): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[ConversationService] Error fetching conversations:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Buscar uma conversa específica com todas as mensagens
   */
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
    limit: number = 10
  ): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('scenario', scenario)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[ConversationService] Error fetching conversations by scenario:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Listar conversas por categoria (real-life ou learn)
   */
  async getConversationsByCategory(
    userId: string,
    category: string,
    limit: number = 10
  ): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[ConversationService] Error fetching conversations by category:', error);
      return [];
    }

    return data || [];
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
