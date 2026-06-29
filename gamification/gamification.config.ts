/**
 * Gamification Configuration
 *
 * Single source of truth for all gamification rules.
 * To change XP rate, level thresholds, or topic unlock rules,
 * edit ONLY this file — all modules receive config as a parameter.
 *
 * Level names and visual identity live in levelDefinitions.ts.
 *
 * @module gamification.config
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface LevelThreshold {
  level: number;
  /** Must match LevelDefinition.name in levelDefinitions.ts */
  label: string;
  minXp: number;
}

export interface TopicAccessRule {
  topicId: string;
  minLevel: number;
}

export interface GamificationConfig {
  /** XP earned per full minute of text chat session */
  xpPerMinute: number;
  /** XP earned per full minute of voice chat session (usually 2x text) */
  xpPerMinuteVoice: number;
  /** Minimum session duration in seconds to earn any XP */
  minSessionSeconds: number;
  /** Level thresholds sorted ascending by minXp */
  levelThresholds: LevelThreshold[];
  /** Topic-to-minimum-level mapping */
  topicAccessRules: TopicAccessRule[];
  /**
   * Voice chat time limit in seconds per level.
   * 0 = no access, null = unlimited.
   */
  voiceChatLimitByLevel: Record<number, number | null>;
}

// ============================================================================
// PRODUCTION CONFIG
// ============================================================================

const generateLevelThresholds = (): LevelThreshold[] => {
  const thresholds: LevelThreshold[] = [
    { level: 1, label: 'Starter',       minXp: 0   },
    { level: 2, label: 'Explorer',      minXp: 60  },  // 1 min
    { level: 3, label: 'Communicator',  minXp: 120 },  // 2 min
    { level: 4, label: 'Achiever',      minXp: 240 },  // 4 min
    { level: 5, label: 'Fluent',        minXp: 480 },  // 8 min
  ];

  // Para os níveis de 6 a 100, aumenta de 480 XP por nível (8 min de conversa)
  let currentXp = 480;
  for (let lvl = 6; lvl <= 100; lvl++) {
    currentXp += 480;
    
    // Rótulos premium dinâmicos baseados no tier
    let label = 'Fluent';
    if (lvl <= 15) label = `Explorer Elite ${lvl - 5}`;
    else if (lvl <= 30) label = `Communicator Master ${lvl - 15}`;
    else if (lvl <= 50) label = `Achiever Platinum ${lvl - 30}`;
    else if (lvl <= 75) label = `Global Speaker ${lvl - 50}`;
    else label = `Sakae Legend ${lvl - 75}`;

    thresholds.push({ level: lvl, label, minXp: currentXp });
  }

  return thresholds;
};

const generateVoiceChatLimitByLevel = (): Record<number, number | null> => {
  const limits: Record<number, number | null> = {
    1: 60,
    2: 300,
    3: 600,
    4: 1200,
  };
  for (let lvl = 5; lvl <= 100; lvl++) {
    limits[lvl] = null; // Acesso ilimitado a partir do nível 5
  }
  return limits;
};

const PRODUCTION_CONFIG: GamificationConfig = {
  xpPerMinute: 60,      // 1 XP por segundo
  xpPerMinuteVoice: 120, // 2 XP por segundo
  minSessionSeconds: 5,  // Mínimo de 5 segundos para ganhar XP
  levelThresholds: generateLevelThresholds(),
  topicAccessRules: [
    { topicId: 'phone-screen',           minLevel: 1 },
    { topicId: 'grammar-essentials',     minLevel: 1 },
    { topicId: 'job-interviews',         minLevel: 2 },
    { topicId: 'vocabulary-builder',     minLevel: 2 },
    { topicId: 'travel-conversations',   minLevel: 3 },
    { topicId: 'pronunciation-practice', minLevel: 3 },
    { topicId: 'business-meetings',      minLevel: 4 },
    { topicId: 'business-english',       minLevel: 4 },
    { topicId: 'travel-phrases',         minLevel: 5 },
    { topicId: 'idioms-slang',           minLevel: 5 },
  ],
  voiceChatLimitByLevel: generateVoiceChatLimitByLevel(),
};

// ============================================================================
// DEVELOPMENT CONFIG (easy to test)
// ============================================================================

const DEV_CONFIG: GamificationConfig = {
  xpPerMinute: 60,      // 1 XP por segundo
  xpPerMinuteVoice: 120, // 2 XP por segundo
  minSessionSeconds: 5,  // Mínimo de 5 segundos para ganhar XP
  levelThresholds: generateLevelThresholds(),
  topicAccessRules: PRODUCTION_CONFIG.topicAccessRules,
  voiceChatLimitByLevel: generateVoiceChatLimitByLevel(),
};


// ============================================================================
// EXPORT — auto-selects based on environment
// ============================================================================

const IS_DEV = import.meta.env.DEV;

export const DEFAULT_GAMIFICATION_CONFIG: GamificationConfig =
  IS_DEV ? DEV_CONFIG : PRODUCTION_CONFIG;

// ============================================================================
// VALIDATION
// ============================================================================

export function validateConfig(config: GamificationConfig): void {
  if (!config) throw new Error('[GamificationConfig] config is required');
  if (typeof config.xpPerMinute !== 'number' || config.xpPerMinute <= 0)
    throw new Error('[GamificationConfig] xpPerMinute must be a positive number');
  if (typeof config.xpPerMinuteVoice !== 'number' || config.xpPerMinuteVoice <= 0)
    throw new Error('[GamificationConfig] xpPerMinuteVoice must be a positive number');
  if (typeof config.minSessionSeconds !== 'number' || config.minSessionSeconds < 0)
    throw new Error('[GamificationConfig] minSessionSeconds must be non-negative');
  if (!Array.isArray(config.levelThresholds) || config.levelThresholds.length === 0)
    throw new Error('[GamificationConfig] levelThresholds must be a non-empty array');
  if (!Array.isArray(config.topicAccessRules) || config.topicAccessRules.length === 0)
    throw new Error('[GamificationConfig] topicAccessRules must be a non-empty array');
  if (!config.voiceChatLimitByLevel || typeof config.voiceChatLimitByLevel !== 'object')
    throw new Error('[GamificationConfig] voiceChatLimitByLevel must be an object');
}
