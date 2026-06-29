import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { CheckCircle2, Unlock, Mic, Clock, Gift } from 'lucide-react';
import { topicSlugs } from '../../constants/topicSlugs';
import LevelBadge from './LevelBadge';
import { getLevelDef } from '../levelDefinitions';
import { DEFAULT_GAMIFICATION_CONFIG } from '../gamification.config';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';

interface LevelUpModalProps {
  newLevel: number;
  newLevelLabel: string;
  newlyUnlockedTopics: string[];
  onDismiss: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({
  newLevel,
  newLevelLabel,
  newlyUnlockedTopics,
  onDismiss,
}) => {
  const { t } = useTranslation();
  useEffect(() => {
    // Foguetório de confete maravilhoso no level up!
    // Dispara continuamente das duas laterais durante 3 segundos para um efeito de celebração épico!
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ['#3b82f6', '#8b5cf6', '#6366f1', '#10b981', '#f59e0b']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ['#3b82f6', '#8b5cf6', '#6366f1', '#10b981', '#f59e0b']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);
  const def = getLevelDef(newLevel);
  const Icon = def.icon;
  const unlockedTopicConfigs = newlyUnlockedTopics
    .map(id => topicSlugs.find(t => t.id === id))
    .filter(Boolean);

  const voiceLimit = DEFAULT_GAMIFICATION_CONFIG.voiceChatLimitByLevel[newLevel];
  const voiceText = voiceLimit === null
    ? t('levelUp.voiceUnlimited', { defaultValue: 'Unlimited Voice Chat' })
    : voiceLimit === 0
      ? null
      : t('levelUp.voiceMinutes', { defaultValue: '{{time}} of Voice Chat', time: voiceLimit >= 60 ? `${Math.floor(voiceLimit / 60)} min` : `${voiceLimit} sec` });

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 md:pl-[240px]"
      onClick={onDismiss}
    >
      <div
        className={clsx('rounded-2xl shadow-2xl w-full max-w-sm border-t-4 flex flex-col max-h-[90vh] overflow-hidden', def.borderTop)}
        style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header gradient - fixed */}
        <div className={clsx('bg-gradient-to-br px-6 pt-6 pb-10 text-center text-white shrink-0', def.gradient)}>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Icon size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold mb-1">{t('levelUp.congrats', { defaultValue: 'Congratulations!' })}</h2>
          <p className="text-white/80 text-sm">{t('levelUp.leveledUp', { defaultValue: 'You leveled up' })}</p>
        </div>

        {/* Body - Scrollable */}
        <div className="px-5 pb-5 -mt-5 overflow-y-auto flex-1">
          {/* Level badge card */}
          <div 
            className="rounded-xl shadow-inner p-4 mb-4 flex items-center justify-center border transition-all" 
            style={{ 
              background: 'linear-gradient(135deg, var(--bg-card-alt) 0%, var(--bg-card-hover) 100%)', 
              borderColor: 'var(--border-mid)' 
            }}
          >
            <LevelBadge level={newLevel} label={newLevelLabel} size="lg" />
          </div>

          {/* Benefit */}
          <div className="rounded-xl p-3 mb-4 text-sm font-medium flex items-center justify-center gap-2" style={{ background: 'var(--bg-card-alt)', color: 'var(--text-secondary)' }}>
            <Gift size={15} style={{ color: 'var(--text-muted)' }} className="flex-shrink-0" />
            <span>{t(`gamification.levels.${newLevel}.benefit`, { defaultValue: def.benefit })}</span>
          </div>

          {/* Voice chat unlock */}
          {voiceText && (
            <div className="flex items-center gap-2 rounded-xl p-3 mb-4 text-sm font-medium" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--text-primary)' }}>
              <Mic size={15} className="text-blue-400 flex-shrink-0" />
              <span>{voiceText} {t('levelUp.unlocked', { defaultValue: 'unlocked' })}</span>
            </div>
          )}

          {/* Unlocked topics */}
          {unlockedTopicConfigs.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
                <Unlock size={12} />
                <span>{t('levelUp.newTopics', { defaultValue: 'New Topics' })}</span>
              </div>
              <ul className="space-y-1.5">
                {unlockedTopicConfigs.map(topic => (
                  <li
                    key={topic!.id}
                    className={clsx(
                      'flex items-center gap-3 p-2.5 rounded-xl border-l-4',
                      topic!.borderColor.replace('border-t-', 'border-l-'),
                    )}
                    style={{ background: 'var(--bg-card-alt)' }}
                  >
                    <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t(`scenarios.${topic!.id}.title`, { defaultValue: topic!.title })}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={onDismiss}
            className={clsx(
              'w-full text-white font-bold py-3 rounded-xl transition-opacity hover:opacity-90',
              `bg-gradient-to-r ${def.gradient}`,
            )}
          >
            {t('levelUp.continue', { defaultValue: 'Continue' })}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LevelUpModal;
