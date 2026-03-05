import { conversationService, Message } from './conversationService';
import { profileService, UserLearningProfile } from './profileService';
import { 
  RAGContext, 
  LearningFocus, 
  determineLearningFocus, 
  extractTopicsFromMessage 
} from './contextBuilder';

export interface ContextOptions {
  includePreviousConversations?: boolean;
  maxPreviousMessages?: number;
}

class ContextService {
  async getRAGContext(
    userId: string,
    scenario: string,
    currentMessage?: string,
    options: ContextOptions = {}
  ): Promise<RAGContext> {
    const { includePreviousConversations = true, maxPreviousMessages = 10 } = options;

    // Use getOrCreateProfile to ensure new users have a profile (BUG #5 FIX)
    const userProfile = await profileService.getOrCreateProfile(userId, scenario);
    const learningFocus = determineLearningFocus(userProfile);

    let recentMessages: Message[] = [];
    let previousConversationsSummary: string[] = [];

    if (includePreviousConversations) {
      const previousConversations = await conversationService.getConversationsByScenario(
        userId,
        scenario,
        5
      );

      for (const conv of previousConversations.slice(0, 3)) {
        const convWithMessages = await conversationService.getConversationWithMessages(conv.id);
        if (convWithMessages) {
          const messages = convWithMessages.messages.slice(0, maxPreviousMessages);
          recentMessages.push(...messages);

          const summary = this.generateConversationSummary(convWithMessages);
          previousConversationsSummary.push(summary);
        }
      }
    }

    return {
      userProfile,
      recentMessages,
      previousConversationsSummary,
      learningFocus,
      scenarioContext: scenario,
    };
  }

  async processConversationEnd(
    conversationId: string,
    userId: string,
    scenario: string,
    messages: Message[],
    durationSeconds: number
  ): Promise<void> {
    const corrections: Array<{ original: string; corrected: string }> = [];
    const topicsSet = new Set<string>();

    for (const msg of messages) {
      if (msg.role === 'user') {
        const topics = extractTopicsFromMessage(msg.content);
        topics.forEach(t => topicsSet.add(t));
      }

      // Note: Future enhancement - parse corrections from message content if stored as JSON
      // if (msg.content.includes('"original"') && msg.content.includes('"corrected"')) { ... }
    }

    const topics = Array.from(topicsSet);

    await profileService.updateProfile(userId, scenario, {
      duration: durationSeconds,
      messageCount: messages.length,
      corrections,
      topics,
    });

    console.log('[ContextService] Conversation processed:', {
      conversationId,
      userId,
      scenario,
      durationSeconds,
      messageCount: messages.length,
      topics,
      correctionsCount: corrections.length,
    });
  }

  private generateConversationSummary(
    convWithMessages: { messages: Message[]; scenario: string; started_at: string }
  ): string {
    const messages = convWithMessages.messages;
    if (messages.length === 0) {
      return 'Conversa sem mensagens.';
    }

    const userMessages = messages.filter(m => m.role === 'user');
    const aiMessages = messages.filter(m => m.role === 'assistant');
    
    const firstUserMsg = userMessages[0]?.content.substring(0, 100) || '';
    const lastUserMsg = userMessages[userMessages.length - 1]?.content.substring(0, 100) || '';

    const date = new Date(convWithMessages.started_at).toLocaleDateString('pt-BR');

    return `[${date}] ${convWithMessages.scenario}: "${firstUserMsg}..." → "${lastUserMsg}..." (${messages.length} msgs)`;
  }

  async updateUserLevel(
    userId: string,
    scenario: string,
    level: string,
    progress?: number
  ): Promise<boolean> {
    return profileService.updateUserLevel(userId, scenario, level, progress);
  }
}

export const contextService = new ContextService();
