import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Lock } from 'lucide-react';
import { getBadgeStatus, type Badge } from '../badges';
import type { GamificationProfile } from '../repository/IGamificationRepository';
import { useTranslation } from 'react-i18next';

interface BadgeCardProps {
  badge: Badge;
  earned: boolean;
}

const BadgeCard: React.FC<BadgeCardProps> = ({ badge, earned }) => {
  const { t } = useTranslation();
  const Icon = badge.icon;
  const [showTooltip, setShowTooltip] = useState(false);

  const badgeTitle = t(`gamification.badges.${badge.id}.title`, { defaultValue: badge.title });
  const badgeDesc = t(`gamification.badges.${badge.id}.description`, { defaultValue: badge.description });
  const badgeHint = t(`gamification.badges.${badge.id}.hint`, { defaultValue: badge.hint });

  return (
    <div
      className="relative flex flex-col items-center gap-1.5 cursor-default"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Icon circle */}
      <div
        className={clsx(
          'w-14 h-14 rounded-2xl flex items-center justify-center transition-all',
          earned
            ? [badge.iconBg, 'shadow-sm']
            : 'bg-[var(--bg-card-alt)] border border-[var(--border-subtle)] opacity-40 grayscale',
        )}
      >
        {earned
          ? <Icon size={26} className={badge.iconColor} />
          : <Lock size={20} className="text-[var(--text-muted)]" />
        }
      </div>

      {/* Title */}
      <span className={clsx(
        'text-xs font-semibold text-center leading-tight max-w-[72px]',
        earned ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]',
      )}>
        {badgeTitle}
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 w-44 bg-gray-900 text-white text-xs rounded-xl px-3 py-2 text-center shadow-xl pointer-events-none">
          <p className="font-semibold mb-0.5">{badgeTitle}</p>
          <p className="opacity-80">{earned ? badgeDesc : badgeHint}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

interface BadgesSectionProps {
  profile: GamificationProfile | null;
}

const BadgesSection: React.FC<BadgesSectionProps> = ({ profile }) => {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  if (!profile) return null;

  const { earned, locked } = getBadgeStatus(profile);
  const allBadges = [...earned, ...locked];
  const visible = showAll ? allBadges : allBadges.slice(0, 8);

  const percentComplete = Math.round((earned.length / allBadges.length) * 100);

  return (
    <div className="bv-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {t('gamification.achievementsTitle', { defaultValue: 'Achievements' })}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {t('gamification.unlockedStatus', { 
              defaultValue: '{{earned}} of {{total}} unlocked', 
              earned: earned.length, 
              total: allBadges.length 
            })}
          </p>
        </div>
        {/* Progress pill */}
        <span className="text-xs font-semibold bg-violet-950/40 text-[var(--accent-purple2)] border border-violet-800/30 px-3 py-1 rounded-full">
          {t('gamification.completedStatus', { 
            defaultValue: '{{percent}}% complete', 
            percent: percentComplete 
          })}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[var(--bg-card-alt)] rounded-full h-1.5 mb-6 overflow-hidden">
        <div
          className="h-1.5 rounded-full bg-violet-500 transition-all duration-700"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
        {visible.map(badge => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            earned={earned.some(e => e.id === badge.id)}
          />
        ))}
      </div>

      {allBadges.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-5 w-full text-sm text-[var(--accent-purple2)] font-semibold hover:text-white transition-colors"
        >
          {showAll 
            ? t('gamification.showLess', { defaultValue: 'Show less' }) 
            : t('gamification.showAll', { defaultValue: 'Show all ({{total}})', total: allBadges.length })}
        </button>
      )}
    </div>
  );
};

export default BadgesSection;
