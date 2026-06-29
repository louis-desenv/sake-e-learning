import React from 'react';
import { clsx } from 'clsx';
import { Zap } from 'lucide-react';
import LevelBadge from './LevelBadge';
import { getLevelDef } from '../levelDefinitions';
import { useTranslation } from 'react-i18next';

interface XpProgressBarProps {
  totalXp: number;
  level: number;
  levelLabel: string;
  progress: number;
  xpToNextLevel: number;
  isMaxLevel: boolean;
}

const XpProgressBar: React.FC<XpProgressBarProps> = ({
  totalXp, level, levelLabel, progress, xpToNextLevel, isMaxLevel,
}) => {
  const { t } = useTranslation();
  const def = getLevelDef(level);
  const nextDef = getLevelDef(level + 1);
  const NextIcon = nextDef.icon;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 16,
      padding: '16px',
      borderTop: `3px solid`,
    }}
    className={clsx(def.borderTop)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Level badge — pass through unchanged */}
        <LevelBadge level={level} label={levelLabel} size="md" />

        {/* XP count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700 }}>
          <Zap size={13} className={def.iconColor} />
          <span style={{ color: 'var(--text-secondary)' }}>{totalXp} XP</span>
        </div>
      </div>

      {isMaxLevel ? (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>
          <NextIcon size={14} className="text-yellow-500" />
          <span>{t('gamification.maxLevel', { defaultValue: 'Nível máximo atingido — Fluente!' })}</span>
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          {/* Progress bar */}
          <div className="bv-progress-bg">
            <div className="bv-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          {/* Labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>{t('gamification.completed', { defaultValue: '{{progress}}% completo', progress })}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <NextIcon size={11} className={nextDef.iconColor} />
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{nextDef.name}</span>
              <span>{t('gamification.nextLevelIn', { defaultValue: 'em {{xp}} XP', xp: xpToNextLevel })}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default XpProgressBar;
