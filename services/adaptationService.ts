import { conversationService } from './conversationService';
import { scenarioService, Scenario } from './scenarioService';
import {
  generateScenarioDraft,
  GeneratedScenarioDraft,
  ScenarioCategory,
  ScenarioGenerationStatus,
  ScenarioGenerationResponse,
} from './scenarioGenerationApiService';
import { fetchQwenChatCompletion } from './geminiService';

export interface SaveGeneratedScenarioOptions {
  userId: string;
  category: ScenarioCategory;
  draft: GeneratedScenarioDraft;
  requiredLevel: number;
  generationSource: 'automatic' | 'manual';
}

class AdaptationService {
  private buildSlug(title: string): string {
    const slug = title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);

    return slug || `custom-scenario-${Date.now()}`;
  }

  private extractJsonObject(raw: string): unknown {
    const trimmed = raw.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    try {
      return JSON.parse(trimmed);
    } catch {
      const firstBrace = trimmed.indexOf('{');
      const lastBrace = trimmed.lastIndexOf('}');
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
      }
      throw new Error('Qwen returned invalid JSON.');
    }
  }

  private normalizeScenarioDraft(rawDraft: any, category: ScenarioCategory, intent: string): GeneratedScenarioDraft {
    const title = String(rawDraft?.title || 'Custom English Practice Scenario').trim().slice(0, 90);
    const description = String(rawDraft?.description || `Practice: ${intent}`).trim().slice(0, 260);
    const goal = String(rawDraft?.goal || 'Build confidence in a realistic English conversation.').trim();
    const tutorRole = String(rawDraft?.tutorRole || 'The tutor plays the other person in the situation and keeps the exchange natural.').trim();
    const studentRole = String(rawDraft?.studentRole || 'You play yourself and respond naturally in English.').trim();
    const challenges = Array.isArray(rawDraft?.challenges)
      ? rawDraft.challenges.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 5)
      : [];
    const vocabulary = Array.isArray(rawDraft?.vocabulary)
      ? rawDraft.vocabulary.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 8)
      : [];
    const systemPrompt = String(rawDraft?.systemPrompt || '').trim();

    const fallbackPrompt = `You are a live English tutor running a ${category === 'learn' ? 'guided learning module' : 'real-life roleplay'}.
Scenario: ${title}
Goal: ${goal}
Student role: ${studentRole}
Tutor role: ${tutorRole}
Keep replies short, natural, and interactive. Ask one question at a time. Correct mistakes gently after responding to meaning.`;

    return {
      title,
      description,
      slug: this.buildSlug(rawDraft?.slug || title),
      goal,
      tutorRole,
      studentRole,
      challenges: challenges.length ? challenges : ['Explain the situation clearly', 'Answer follow-up questions', 'Use natural expressions'],
      vocabulary: vocabulary.length ? vocabulary : ['Could you clarify?', 'I would like to...', 'That works for me'],
      systemPrompt: systemPrompt || fallbackPrompt,
    };
  }

  async generateManualScenarioForTestAccess(request: {
    category: ScenarioCategory;
    intent: string;
    entitlements: ScenarioGenerationStatus;
  }): Promise<ScenarioGenerationResponse> {
    const prompt = `Create one practical English learning scenario as JSON.

User request:
${request.intent}

Category: ${request.category}
Current user level: ${request.entitlements.currentLevel}

Return ONLY valid JSON with this exact shape:
{
  "title": "short scenario title",
  "description": "1-2 sentence description",
  "slug": "url-safe-slug",
  "goal": "main practice goal",
  "tutorRole": "role the AI tutor should play",
  "studentRole": "role the student should play",
  "challenges": ["3 to 5 concise practice challenges"],
  "vocabulary": ["5 to 8 useful English expressions"],
  "systemPrompt": "complete instruction prompt for the tutor in this scenario"
}

Rules:
- Make it specific to the user's request.
- Tutor should speak mostly English, but corrections can be explained simply.
- The systemPrompt must make the tutor ask one question at a time and keep the practice interactive.
- No markdown. No extra text.`;

    const raw = await fetchQwenChatCompletion(prompt, 'qwen-plus', 1200, true);
    const parsed = this.extractJsonObject(raw);
    const scenario = this.normalizeScenarioDraft(parsed, request.category, request.intent);

    return {
      scenario,
      requiredLevel: Math.max(1, Math.min(request.entitlements.currentLevel || 1, 3)),
      generationSource: 'manual',
      entitlements: {
        ...request.entitlements,
        manualUsedToday: request.entitlements.manualUsedToday + 1,
        manualRemainingToday: Math.max(0, request.entitlements.manualRemainingToday - 1),
      },
    };
  }

  async saveGeneratedScenario(options: SaveGeneratedScenarioOptions): Promise<Scenario | null> {
    const { userId, category, draft, requiredLevel, generationSource } = options;
    return scenarioService.saveCustomScenario({
      user_id: userId,
      category,
      title: draft.title,
      description: draft.description,
      slug: draft.slug,
      scenario_id: 'custom-generated',
      system_prompt: draft.systemPrompt,
      is_locked: requiredLevel > 1,
      required_messages: 0,
      required_level: requiredLevel,
      generation_source: generationSource,
      metadata: {
        goal: draft.goal,
        tutorRole: draft.tutorRole,
        studentRole: draft.studentRole,
        challenges: draft.challenges,
        vocabulary: draft.vocabulary,
      },
    });
  }

  async generateManualScenario(request: {
    userId: string;
    category: ScenarioCategory;
    intent: string;
    transcript?: string;
  }): Promise<ScenarioGenerationResponse> {
    return generateScenarioDraft({
      category: request.category,
      generationType: 'manual',
      intent: request.intent,
      transcript: request.transcript,
    });
  }

  async generateSuggestedScenario(
    userId: string,
    category: ScenarioCategory,
    currentConversationId?: string,
  ): Promise<Scenario | null> {
    try {
      let transcript = '';
      if (currentConversationId) {
        const conversation = await conversationService.getConversationWithMessages(currentConversationId);
        transcript = conversation?.messages
          .slice(-16)
          .map(message => `[${message.role === 'user' ? 'User' : 'Tutor'}] ${message.content}`)
          .join('\n') || '';
      }

      const generated = await generateScenarioDraft({
        category,
        generationType: 'automatic',
        transcript,
      });

      return this.saveGeneratedScenario({
        userId,
        category,
        draft: generated.scenario,
        requiredLevel: generated.requiredLevel,
        generationSource: 'automatic',
      });
    } catch (error) {
      console.error('[AdaptationService] Automatic scenario generation failed:', error);
      return null;
    }
  }
}

export const adaptationService = new AdaptationService();
