import { Message } from './conversationService';
import { UserLearningProfile, AdaptiveProfile } from './profileService';


export interface RAGContext {
  userProfile: UserLearningProfile | null;
  recentMessages: Message[];
  previousConversationsSummary: string[];
  learningFocus: LearningFocus;
  scenarioContext: string;
}

export interface LearningFocus {
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  userGoals: string[];
  priorityTopics: string[];
  commonPitfalls: string[];
  correctionStyle: 'direct' | 'gentle' | 'explanatory';
}

const SCENARIO_DESCRIPTIONS: Record<string, string> = {
  'phone-screen': 'Prática de entrevistas telefônicas em inglês. O foco é se apresentar, responder perguntas sobre experiência profissional e demonstrar interesse na vaga.',
  'job-interviews': 'Preparação para entrevistas de emprego presenciais. Inclui perguntas comportamentais, técnicas e perguntas para o entrevistador.',
  'travel-conversations': 'Cenários de viagem: reservas, direções, pedindo informações, emergência, compras, etc.',
  'business-meetings': 'Reuniões de negócios, apresentações, negociações e comunicação profissional.',
  'grammar-specialist': 'Foco em regras gramaticais específicas com explicações detalhadas e exemplos.',
  'vocabulary-specialist': 'Expansão de vocabulário em contextos específicos com sinônimos e expressões idiomáticas.',
  'pronunciation-specialist': 'Prática de pronúncia, fonética e entonação correta.',
  'business-specialist': 'Inglês para negócios: emails, reuniões, apresentações, vocabulário corporativo.',
  'travel-specialist': 'Frases essenciais para viagens, aeroportos, hotéis, restaurantes e turismo.',
  'idioms-specialist': 'Expressões idiomáticas, gírias e linguagem coloquial americana/britânica.',
  'real-life': 'Conversação geral do dia-a-dia para melhorar fluência e confiança.',
};

const LEVEL_INSTRUCTIONS: Record<string, string> = {
  beginner: 'Use vocabulário simples e frases curtas. Evite expressões idiomáticas complexas. Forneça traduções quando necessário. Seja paciente e encorajador.',
  intermediate: 'Use vocabulário adequado para o nível. Introduza algumas expressões idiomáticas gradualmente. Forneça correções construtivas.',
  advanced: 'Use linguagem sofisticada e expressões idiomáticas. Desafie o usuário com tópicos complexos. Forneça nuances culturais.',
};

export function getScenarioDescription(scenario: string): string {
  return SCENARIO_DESCRIPTIONS[scenario] || SCENARIO_DESCRIPTIONS['real-life'];
}

export function getLevelInstructions(level: string): string {
  return LEVEL_INSTRUCTIONS[level] || LEVEL_INSTRUCTIONS['intermediate'];
}

export function determineLearningFocus(profile: UserLearningProfile | null): LearningFocus {
  if (!profile) {
    return {
      currentLevel: 'intermediate',
      userGoals: ['Conversation'],
      priorityTopics: [],
      commonPitfalls: [],
      correctionStyle: 'explanatory',
    };
  }

  const level = profile.current_level as 'beginner' | 'intermediate' | 'advanced' || 'intermediate';
  const topics = profile.topics_practiced || [];
  const areasToImprove = profile.areas_to_improve || [];
  const mistakes = profile.common_mistakes || {};
  const adaptive = profile.adaptive_profile;

  const commonPitfalls = Object.entries(mistakes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([mistake]) => mistake);

  // Prefer adaptive weaknesses as priority topics (evidence-based), fallback to areas_to_improve
  const adaptiveWeaknesses = adaptive?.weaknesses?.slice(0, 5) || [];
  const priorityTopics = adaptiveWeaknesses.length > 0
    ? adaptiveWeaknesses
    : areasToImprove.slice(0, 5);

  // Merge adaptive pitfalls (from evidence errors) into commonPitfalls
  const evidenceErrors = (adaptive?.evidence || [])
    .filter(e => e.type === 'error')
    .slice(-3)
    .map(e => e.analysis);

  return {
    currentLevel: level,
    userGoals: topics.length > 0 ? topics : ['Conversation'],
    priorityTopics,
    commonPitfalls: [...new Set([...commonPitfalls, ...evidenceErrors])].slice(0, 7),
    correctionStyle: 'explanatory',
  };
}


export function buildRAGPrompt(
  baseSystemPrompt: string,
  scenario: string,
  context: RAGContext,
  conversationHistory: string[],
  userMessage: string
): string {
  const { userProfile, learningFocus, previousConversationsSummary } = context;
  const adaptive: AdaptiveProfile | undefined = userProfile?.adaptive_profile;

  const sections: string[] = [
    baseSystemPrompt,
    '',
    '=== CENÁRIO DE PRÁTICA ===',
    getScenarioDescription(scenario),
    '',
    '=== INSTRUÇÕES DE ACORDO COM O NÍVEL ===',
    getLevelInstructions(learningFocus.currentLevel),
    '',
  ];

  if (userProfile) {
    sections.push(
      '=== PERFIL DO ALUNO ===',
      `Nível atual: ${userProfile.current_level}`,
      `Progresso: ${userProfile.level_progress || 0}%`,
      `Total de conversas: ${userProfile.total_conversations}`,
      `Tempo total: ${Math.floor((userProfile.total_time_seconds || 0) / 60)} minutos`,
      ''
    );
  }

  // ─── Adaptive Profile (evidence-based) ─────────────────────────────────
  if (adaptive) {
    if (adaptive.strengths.length > 0) {
      sections.push(
        '=== PONTOS FORTES CONFIRMADOS (baseado em evidências) ===',
        adaptive.strengths.map(s => `✓ ${s}`).join('\n'),
        ''
      );
    }

    if (adaptive.weaknesses.length > 0) {
      sections.push(
        '=== FRAQUEZAS RECORRENTES (baseado em evidências — foque nisso) ===',
        adaptive.weaknesses.map(w => `⚠ ${w}`).join('\n'),
        'INSTRUÇÃO: Introduza oportunidades naturais para o aluno praticar e superar essas fraquezas durante a conversa.',
        ''
      );
    }

    if (adaptive.evidence.length > 0) {
      const recentErrors = adaptive.evidence
        .filter(e => e.type === 'error')
        .slice(-3);
      if (recentErrors.length > 0) {
        sections.push(
          '=== EVIDÊNCIAS RECENTES DE ERROS ===',
          recentErrors.map(e => `"${e.text}" → ${e.analysis}`).join('\n'),
          ''
        );
      }
    }

    if (adaptive.last_feedback.length > 0) {
      sections.push(
        '=== ÚLTIMAS SUGESTÕES DO TUTOR ===',
        adaptive.last_feedback.map(f => `• ${f}`).join('\n'),
        ''
      );
    }
  } else if (learningFocus.priorityTopics.length > 0) {
    // Fallback if no adaptive profile yet
    sections.push(
      '=== ÁREAS A MELHORAR (baseado em conversas anteriores) ===',
      learningFocus.priorityTopics.join(', '),
      ''
    );
  }

  if (learningFocus.commonPitfalls.length > 0) {
    sections.push(
      '=== ERROS COMUNS A EVITAR ===',
      learningFocus.commonPitfalls.map(p => `- ${p}`).join('\n'),
      ''
    );
  }

  if (previousConversationsSummary.length > 0) {
    sections.push(
      '=== RESUMO DE CONVERSAS ANTERIORES ===',
      previousConversationsSummary.slice(0, 3).join('\n\n'),
      ''
    );
  }

  if (conversationHistory.length > 0) {
    sections.push(
      '=== HISTÓRICO DA CONVERSA ATUAL ===',
      conversationHistory.join('\n'),
      ''
    );
  }

  sections.push(
    '=== NOVA MENSAGEM DO ALUNO ===',
    userMessage,
    '',
    'Responda de forma personalizada, considerando o perfil e histórico do aluno. Aproveite as fraquezas identificadas para criar oportunidades de prática natural.'
  );

  return sections.join('\n');
}


export function buildQuickContextPrompt(
  scenario: string,
  userLevel: string,
  areasToImprove: string[],
  recentTopics: string[]
): string {
  const parts: string[] = [];

  parts.push(`Cenário: ${getScenarioDescription(scenario)}`);
  parts.push(`Nível: ${userLevel}`);

  if (areasToImprove.length > 0) {
    parts.push(`Foque em corrigir: ${areasToImprove.join(', ')}`);
  }

  if (recentTopics.length > 0) {
    parts.push(`Tópicos recentes praticados: ${recentTopics.join(', ')}`);
  }

  return parts.join(' | ');
}

export function extractTopicsFromMessage(message: string): string[] {
  const topicKeywords: Record<string, string[]> = {
    'job': ['job', 'work', 'employment', 'career', 'interview', 'resume', 'cv'],
    'travel': ['travel', 'trip', 'flight', 'hotel', 'airport', 'vacation'],
    'business': ['business', 'meeting', 'presentation', 'email', 'client'],
    'grammar': ['grammar', 'tense', 'verb', 'sentence', 'rule'],
    'vocabulary': ['word', 'vocabulary', 'meaning', 'synonym'],
    'pronunciation': ['pronounce', 'sound', 'stress', 'intonation'],
  };

  const messageLower = message.toLowerCase();
  const foundTopics: string[] = [];

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => messageLower.includes(kw))) {
      foundTopics.push(topic);
    }
  }

  return foundTopics;
}
