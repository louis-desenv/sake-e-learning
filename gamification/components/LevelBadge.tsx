import React from 'react';
import { clsx } from 'clsx';
import { getLevelDef } from '../levelDefinitions';
import { useTranslation } from 'react-i18next';

interface LevelBadgeProps {
  level: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  /** Show only icon + level number, no label text */
  compact?: boolean;
}

const SIZE: Record<string, { wrapper: string; icon: number; text: string }> = {
  sm: { wrapper: 'px-2 py-0.5 gap-1',   icon: 11, text: 'text-xs' },
  md: { wrapper: 'px-3 py-1 gap-1.5',   icon: 13, text: 'text-sm' },
  lg: { wrapper: 'px-4 py-1.5 gap-2',   icon: 16, text: 'text-base' },
};

const LevelBadge: React.FC<LevelBadgeProps> = ({ level, label, size = 'md', compact = false }) => {
  const { t } = useTranslation();
  const def = getLevelDef(level);
  const Icon = def.icon;
  const { wrapper, icon, text } = SIZE[size];

  return (
    <span
      className={clsx(
        'inline-flex items-center font-semibold rounded-full border',
        def.badgeColors,
        wrapper,
        text,
      )}
    >
      <Icon size={icon} className={clsx('flex-shrink-0', def.iconColor)} />
      <span>{t('gamification.level', { defaultValue: 'Level' })} {level}</span>
      {!compact && (
        <>
          <span className="opacity-40">·</span>
          <span>{t(`gamification.levels.${level}.name`, { defaultValue: label })}</span>
        </>
      )}
    </span>
  );
};

export default LevelBadge;
