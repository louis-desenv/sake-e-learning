/**
 * SessionSummaryModal
 *
 * Exibido ao final de cada sessão de Voice Chat ou Text Chat.
 * Mostra o XP ganho, duração, e um incentivo de progressão.
 * Segue o mesmo padrão visual do LevelUpModal.
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { Zap, Mic, MessageSquare, Clock, TrendingUp, Lock, Sparkles, Flame, Lightbulb, Bot } from 'lucide-react';
import { getLevelDef } from '../levelDefinitions';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';

interface SessionSummaryModalProps {
  xpGained: number;
  durationSeconds: number;
  isVoice: boolean;
  isAvatar?: boolean;
  currentLevel: number;
  currentXp: number;         // total XP (para exibir no badge)
  xpToNextLevel: number;     // XP restante até o próximo nível
  currentLevelXp: number;    // XP acumulado dentro do nível atual
  levelXpRange: number;      // tamanho do intervalo do nível (nextMinXp - currentMinXp)
  onDismiss: () => void;
}

const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  xpGained,
  durationSeconds,
  isVoice,
  isAvatar = false,
  currentLevel,
  currentXp,
  xpToNextLevel,
  currentLevelXp,
  levelXpRange,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const def = getLevelDef(currentLevel);
  const Icon = def.icon;

  // Animação progressiva da barra de XP
  const [barWidth, setBarWidth] = useState(0);

  // ✅ FIX B3: fórmula correta — divide XP no nível atual pelo tamanho do intervalo
  // Antes: currentXp / xpToNextLevel (errado! dividia total pelo restante)
  const progressPercent = levelXpRange > 0
    ? Math.min(100, Math.round((currentLevelXp / levelXpRange) * 100))
    : 100;

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(progressPercent), 150);
    return () => clearTimeout(t);
  }, [progressPercent]);

  useEffect(() => {
    if (xpGained > 0) {
      // Dispara confetes lindos para comemorar os ganhos de XP na sessão de voz!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#3b82f6', '#8b5cf6', '#6366f1', '#10b981', '#f59e0b']
      });
    }
  }, [xpGained]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m > 0) return t('common.durationFormat', { m, sec, defaultValue: `${m}m ${sec}s` });
    return t('common.durationFormatSec', { sec, defaultValue: `${sec}s` });
  };

  const isLevel1NoXp = currentLevel === 1 && isVoice;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 md:pl-[240px]"
      onClick={onDismiss}
    >
      <div
        className={clsx(
          'rounded-2xl shadow-2xl w-full max-w-sm border-t-4 flex flex-col max-h-[90vh] overflow-hidden',
          def.borderTop,
        )}
        style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className={clsx('bg-gradient-to-br px-6 pt-6 pb-10 text-center text-white shrink-0', def.gradient)}>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            {isAvatar ? <Bot size={32} className="text-white" /> : isVoice ? <Mic size={32} className="text-white" /> : <MessageSquare size={32} className="text-white" />}
          </div>
          <h2 className="text-xl font-bold mb-1">
            {isLevel1NoXp ? t('session.trialDone', { defaultValue: 'Trial Completed!' }) : t('session.sessionEnded', { defaultValue: 'Sessão Finalizada!' })}
          </h2>
          <p className="text-white/80 text-sm">
            {isAvatar ? t('profilePage.distributionAvatar', { defaultValue: 'Avatar' }) : isVoice ? t('session.voiceChat', { defaultValue: 'Voice Chat' }) : t('session.textChat', { defaultValue: 'Text Chat' })}
          </p>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 -mt-5 space-y-3 overflow-y-auto flex-1">

          {/* Stats card */}
          <div className="rounded-xl shadow-lg p-4 flex items-center justify-around relative z-10" style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)' }}>
            {/* Duration */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}>
                <Clock size={13} />
                <span className="text-xs font-medium">{t('session.duration', { defaultValue: 'Duration' })}</span>
              </div>
              <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatDuration(durationSeconds)}</span>
            </div>

            <div className="w-px h-10" style={{ background: 'var(--border-subtle)' }} />

            {/* XP */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}>
                <Zap size={13} />
                <span className="text-xs font-medium">{t('session.xpEarned', { defaultValue: 'XP Earned' })}</span>
              </div>
              {isLevel1NoXp ? (
                <div className="flex items-center gap-1">
                  <Lock size={14} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{t('session.locked', { defaultValue: 'Locked' })}</span>
                </div>
              ) : (
                <span className="text-lg font-bold" style={{ color: xpGained > 0 ? 'var(--accent-purple)' : 'var(--text-muted)' }}>
                  {xpGained > 0 ? `+${xpGained}` : '0'} XP
                </span>
              )}
            </div>
          </div>

          {/* XP Progress bar */}
          <div className="rounded-xl p-3" style={{ background: 'var(--bg-card-alt)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={13} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {t('session.progress', { defaultValue: 'Progress — Level {{level}}', level: currentLevel })}
                </span>
              </div>
              <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{progressPercent}%</span>
            </div>
            <div className="w-full rounded-full h-2.5 overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
              <div
                className={clsx('h-2.5 rounded-full transition-all duration-700 ease-out', `bg-gradient-to-r ${def.gradient}`)}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            {/* ✅ FIX B7: mostra XP no nível atual / intervalo do nível (ex: 20 / 60 XP) */}
            <p className="text-xs mt-1.5 text-right" style={{ color: 'var(--text-muted)' }}>
              {currentLevelXp} / {levelXpRange} {t('session.xpToLevel', { defaultValue: 'XP to Level {{level}}', level: currentLevel + 1 })}
            </p>

          </div>

          {/* Incentive message */}
          {(() => {
            const style = isLevel1NoXp
              ? { bg: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', IconComp: Sparkles, msg: t('session.msg.trialOnly', { defaultValue: 'The trial was just the beginning! Reach Level 2 to earn XP in voice sessions.' }) }
              : xpGained > 0
                ? { bg: 'rgba(16, 185, 129, 0.12)', color: '#34d399', IconComp: Flame, msg: t('session.msg.great', { defaultValue: 'Great work! Keep practicing to level up faster.' }) }
                : { bg: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', IconComp: Lightbulb, msg: t('session.msg.longer', { defaultValue: 'Longer sessions earn more XP. Try practicing for longer!' }) };
            return (
              <div className="rounded-xl p-3 text-sm font-medium flex items-start gap-2.5" style={{ background: style.bg, color: style.color }}>
                <style.IconComp size={16} className="flex-shrink-0 mt-0.5" />
                <span>{style.msg}</span>
              </div>
            );
          })()}

          <button
            onClick={onDismiss}
            className={clsx(
              'w-full text-white font-bold py-3 rounded-xl transition-opacity hover:opacity-90',
              `bg-gradient-to-r ${def.gradient}`,
            )}
          >
            {t('session.continue', { defaultValue: 'Continue' })}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SessionSummaryModal;
