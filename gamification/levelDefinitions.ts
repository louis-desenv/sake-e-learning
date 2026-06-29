/**
 * Level Definitions
 *
 * Central source of truth for level identity: icons, colors, benefits.
 * Separado da config de regras para manter concerns separados.
 */

import {
  Sprout,
  Compass,
  MessageCircle,
  Zap,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

export interface LevelDefinition {
  level: number;
  /** Short name shown in badge */
  name: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Tailwind classes for badge background + text + border */
  badgeColors: string;
  /** Tailwind class for the icon color */
  iconColor: string;
  /** Tailwind class for progress bar fill */
  barColor: string;
  /** Tailwind class for border-t on cards */
  borderTop: string;
  /** Tailwind gradient for modal header */
  gradient: string;
  /** What the user unlocked at this level (shown in level-up modal) */
  benefit: string;
}

export const LEVEL_DEFINITIONS: Record<number, LevelDefinition> = {
  1: {
    level: 1,
    name: 'Starter',
    icon: Sprout,
    badgeColors: 'bg-gray-100 text-gray-600 border-gray-300',
    iconColor: 'text-gray-400',
    barColor: 'bg-gray-400',
    borderTop: 'border-t-gray-400',
    gradient: 'from-gray-500 to-gray-600',
    benefit: 'Access to initial text chats',
  },
  2: {
    level: 2,
    name: 'Explorer',
    icon: Compass,
    badgeColors: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    iconColor: 'text-emerald-500',
    barColor: 'bg-emerald-500',
    borderTop: 'border-t-emerald-400',
    gradient: 'from-emerald-500 to-emerald-600',
    benefit: '5 min of Voice Chat unlocked',
  },
  3: {
    level: 3,
    name: 'Communicator',
    icon: MessageCircle,
    badgeColors: 'bg-blue-50 text-blue-700 border-blue-300',
    iconColor: 'text-blue-500',
    barColor: 'bg-blue-500',
    borderTop: 'border-t-blue-400',
    gradient: 'from-blue-500 to-blue-600',
    benefit: '10 min of Voice Chat unlocked',
  },
  4: {
    level: 4,
    name: 'Achiever',
    icon: Zap,
    badgeColors: 'bg-violet-50 text-violet-700 border-violet-300',
    iconColor: 'text-violet-500',
    barColor: 'bg-violet-500',
    borderTop: 'border-t-violet-400',
    gradient: 'from-violet-500 to-violet-600',
    benefit: '20 min of Voice Chat unlocked',
  },
  5: {
    level: 5,
    name: 'Fluent',
    icon: Trophy,
    badgeColors: 'bg-yellow-50 text-yellow-700 border-yellow-400',
    iconColor: 'text-yellow-500',
    barColor: 'bg-yellow-500',
    borderTop: 'border-t-yellow-400',
    gradient: 'from-yellow-500 to-amber-500',
    benefit: 'Unlimited Voice Chat unlocked!',
  },
};

export function getLevelDef(level: number): LevelDefinition {
  const staticDef = LEVEL_DEFINITIONS[level];
  if (staticDef) return staticDef;

  // Gerador de tema dinâmico para os níveis de 6 a 100+
  // Dividido em Tiers para um visual premium incrível
  if (level <= 15) {
    // Bronze Tier
    return {
      level,
      name: `Explorer Elite ${level - 5}`,
      icon: Compass,
      badgeColors: 'bg-orange-50 text-orange-700 border-orange-300',
      iconColor: 'text-orange-500',
      barColor: 'bg-orange-500',
      borderTop: 'border-t-orange-400',
      gradient: 'from-orange-500 to-amber-600',
      benefit: 'Full access to chats and system features',
    };
  } else if (level <= 30) {
    // Silver Tier
    return {
      level,
      name: `Communicator Master ${level - 15}`,
      icon: MessageCircle,
      badgeColors: 'bg-slate-100 text-slate-700 border-slate-300',
      iconColor: 'text-slate-500',
      barColor: 'bg-slate-500',
      borderTop: 'border-t-slate-400',
      gradient: 'from-slate-500 to-zinc-600',
      benefit: 'Full access to chats and system features',
    };
  } else if (level <= 50) {
    // Platinum/Gold Tier
    return {
      level,
      name: `Achiever Platinum ${level - 30}`,
      icon: Zap,
      badgeColors: 'bg-teal-50 text-teal-700 border-teal-300',
      iconColor: 'text-teal-500',
      barColor: 'bg-teal-500',
      borderTop: 'border-t-teal-400',
      gradient: 'from-teal-500 to-cyan-600',
      benefit: 'Full access to chats and system features',
    };
  } else if (level <= 75) {
    // Diamond Tier
    return {
      level,
      name: `Global Speaker ${level - 50}`,
      icon: Trophy,
      badgeColors: 'bg-indigo-50 text-indigo-700 border-indigo-300',
      iconColor: 'text-indigo-500',
      barColor: 'bg-indigo-500',
      borderTop: 'border-t-indigo-400',
      gradient: 'from-indigo-500 to-purple-600',
      benefit: 'Full access to chats and system features',
    };
  } else {
    // Legend Tier
    return {
      level,
      name: `Sakae Legend ${level - 75}`,
      icon: Trophy,
      badgeColors: 'bg-rose-50 text-rose-700 border-rose-400',
      iconColor: 'text-rose-500',
      barColor: 'bg-rose-500',
      borderTop: 'border-t-rose-400',
      gradient: 'from-rose-500 to-pink-500',
      benefit: 'Legendary status on Sakae E-Learning!',
    };
  }
}
