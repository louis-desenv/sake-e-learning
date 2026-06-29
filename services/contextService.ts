import { conversationService, ConversationAccess, Message } from './conversationService';
import { profileService } from './profileService';
import { analyzeSessionForAdaptiveProfile } from './geminiService';
import { 
  RAGContext, 
  determineLearningFocus, 
  extractTopicsFromMessage 
} from './contextBuilder';

export interface ContextOptions {
  includePreviousConversations?: boolean;
  maxPreviousMessages?: number;
  access?: ConversationAccess;
}

class ContextService {
  async getRAGContext(
    userId: string,
    scenario: string,
    currentMessage?: string,
    options: ContextOptions = {}
  ): Promise<RAGContext> {
    const { includePreviousConversations = true, maxPreviousMessages = 10, access } = options;

    // Use getOrCreateProfile to ensure new users have a profile
    const userProfile = await profileService.getOrCreateProfile(userId, scenario);
    const learningFocus = determineLearningFocus(userProfile);

    let recentMessages: Message[] = [];
    let previousConversationsSummary: string[] = [];

    if (includePreviousConversations) {
      const previousConversations = await conversationService.getConversationsByScenario(
        userId,
        scenario,
        5,
        access
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

  /**
   * Called when a conversation session ends.
   * Updates the basic profile stats synchronously, then runs
   * AI-powered adaptive profile analysis in the background (non-blocking).
   */
  async processConversationEnd(
    conversationId: string,
    userId: string,
    scenario: string,
    messages: Message[],
    durationSeconds: number,
    lang: string = 'pt'
  ): Promise<void> {
    const corrections: Array<{ original: string; corrected: string }> = [];
    const topicsSet = new Set<string>();

    for (const msg of messages) {
      if (msg.role === 'user') {
        const topics = extractTopicsFromMessage(msg.content);
        topics.forEach(t => topicsSet.add(t));
      }
    }

    const topics = Array.from(topicsSet);

    // Update basic profile stats
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

    // ─── AI-powered adaptive profile analysis (fire-and-forget, non-blocking) ───
    // Runs in the background — failures are logged but do not affect the UI.
    (async () => {
      try {
        const userMessages = messages.filter(m => m.role === 'user');
        if (userMessages.length < 2) {
          console.log('[ContextService] Session too short for adaptive analysis, skipping.');
          return;
        }

        // Fetch current adaptive profile to provide context to the AI
        const currentProfile = await profileService.getProfile(userId, scenario);
        const existingWeaknesses = currentProfile?.adaptive_profile?.weaknesses ?? [];
        const existingStrengths = currentProfile?.adaptive_profile?.strengths ?? [];

        console.log('[ContextService] Running AI adaptive profile analysis...');
        const analysisResult = await analyzeSessionForAdaptiveProfile(
          messages.map(m => ({ role: m.role, content: m.content })),
          existingWeaknesses,
          existingStrengths,
          lang
        );

        if (analysisResult) {
          const updated = await profileService.updateAdaptiveProfile(userId, scenario, analysisResult);
          if (updated) {
            console.log('[ContextService] ✅ Adaptive profile updated with new session data.');
          }
        }
      } catch (error) {
        // Non-fatal: log but don't throw
        console.error('[ContextService] Adaptive profile analysis failed (non-fatal):', error);
      }
    })();
  }

  private generateConversationSummary(
    convWithMessages: { messages: Message[]; scenario: string; started_at: string }
  ): string {
    const messages = convWithMessages.messages;
    if (messages.length === 0) {
      return 'Conversa sem mensagens.';
    }

    const userMessages = messages.filter(m => m.role === 'user');
    
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

