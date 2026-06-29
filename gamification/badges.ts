/**
 * Badges & Rewards System
 *
 * Defines all available badges and the conditions to earn them.
 * Badges are computed client-side from the GamificationProfile.
 */

import {
  Sprout, Compass, MessageCircle, Zap, Trophy,
  Mic, Clock, Flame, Star, BookOpen, Globe,
  type LucideIcon,
} from 'lucide-react';
import type { GamificationProfile } from './repository/IGamificationRepository';

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind color classes for the badge icon background */
  iconBg: string;
  iconColor: string;
  /** Returns true if the user has earned this badge */
  isEarned: (profile: GamificationProfile) => boolean;
  /** Short hint shown when not yet earned */
  hint: string;
}

export const ALL_BADGES: Badge[] = [
  // ── Level badges ──────────────────────────────────────────────────────────
  {
    id: 'level-2',
    title: 'Explorer',
    description: 'Reached Level 2',
    icon: Compass,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    isEarned: p => p.current_level >= 2,
    hint: 'Reach Level 2',
  },
  {
    id: 'level-3',
    title: 'Communicator',
    description: 'Reached Level 3',
    icon: MessageCircle,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    isEarned: p => p.current_level >= 3,
    hint: 'Reach Level 3',
  },
  {
    id: 'level-4',
    title: 'Achiever',
    description: 'Reached Level 4',
    icon: Zap,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    isEarned: p => p.current_level >= 4,
    hint: 'Reach Level 4',
  },
  {
    id: 'level-5',
    title: 'Fluent',
    description: 'Reached maximum level!',
    icon: Trophy,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    isEarned: p => p.current_level >= 5,
    hint: 'Reach Level 5 — Fluent',
  },

  // ── XP milestones ─────────────────────────────────────────────────────────
  {
    id: 'xp-first',
    title: 'Primeira Prática',
    description: 'Gained your first XP',
    icon: Sprout,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    isEarned: p => p.total_xp >= 1,
    hint: 'Complete your first chat session',
  },
  {
    id: 'xp-100',
    title: 'Centenário',
    description: 'Accumulated 100 XP',
    icon: Star,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    isEarned: p => p.total_xp >= 100,
    hint: 'Accumulate 100 XP in total',
  },
  {
    id: 'xp-500',
    title: 'Dedicado',
    description: 'Accumulated 500 XP',
    icon: Flame,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    isEarned: p => p.total_xp >= 500,
    hint: 'Accumulate 500 XP in total',
  },
  {
    id: 'xp-1000',
    title: 'Mestre da Prática',
    description: 'Accumulated 1,000 XP',
    icon: BookOpen,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    isEarned: p => p.total_xp >= 1000,
    hint: 'Accumulate 1,000 XP in total',
  },

  // ── Voice chat ────────────────────────────────────────────────────────────
  {
    id: 'voice-unlocked',
    title: 'Primeira Voz',
    description: 'Unlocked Voice Chat',
    icon: Mic,
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    isEarned: p => p.current_level >= 2,
    hint: 'Reach Level 2 to unlock Voice Chat',
  },
  {
    id: 'voice-unlimited',
    title: 'Sem Limites',
    description: 'Unlimited Voice Chat unlocked',
    icon: Globe,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    isEarned: p => p.current_level >= 5,
    hint: 'Reach Level 5 for unlimited Voice Chat',
  },

  // ── Time ──────────────────────────────────────────────────────────────────
  {
    id: 'time-1h',
    title: '1 Hora de Prática',
    description: 'Practiced for 1 hour in total',
    icon: Clock,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    isEarned: p => (p.total_xp ?? 0) >= 60, // 60 XP ≈ 60 min @ 1 XP/min
    hint: 'Practice for 1 hour in total',
  },
];

/**
 * Returns badges split into earned and locked for a given profile.
 */
export function getBadgeStatus(profile: GamificationProfile) {
  const earned = ALL_BADGES.filter(b => b.isEarned(profile));
  const locked = ALL_BADGES.filter(b => !b.isEarned(profile));
  return { earned, locked };
}
