import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, AlertCircle, Timer, MessageSquare, Zap, Mic, FlaskConical, X } from 'lucide-react';
import { EntitlementDecision } from '../../hooks/useEntitlements';
import LevelBadge from '../../gamification/components/LevelBadge';

interface FeatureLockScreenProps {
  decision: EntitlementDecision | null;
  onBack?: () => void;
  onClose?: () => void;
  customIcon?: React.ReactNode; 
  customTitle?: string;
  customDescription?: React.ReactNode;
  customHighlightedDescription?: React.ReactNode;
  customAction?: () => void;
  customActionLabel?: string;
  customActionIcon?: React.ReactNode;
  showUpgradeButton?: boolean;
  variant?: 'page' | 'modal';
  levelInfo?: {
    level: number;
    levelLabel: string;
    xpToNextLevel: number;
    progressPercent: number;
    description: string;
  };
}

export const FeatureLockScreen: React.FC<FeatureLockScreenProps> = ({ 
  decision, 
  onBack,
  onClose,
  customIcon,
  customTitle,
  customDescription,
  customHighlightedDescription,
  customAction,
  customActionLabel,
  customActionIcon,
  showUpgradeButton = true,
  variant = 'page',
  levelInfo
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!decision?.resetAtUtc) return;

    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [decision?.resetAtUtc]);

  if (!decision) return null;

  // Icon definitions based on feature
  const getFeatureIcon = () => {
    if (customIcon) return customIcon;
    switch (decision.feature) {
      case 'text_chat': return <MessageSquare size={28} style={{ color: 'var(--accent-purple2)' }} />;
      case 'voice_chat': return <Mic size={28} style={{ color: 'var(--accent-purple2)' }} />;
      case 'avatar_chat': return <FlaskConical size={28} style={{ color: 'var(--accent-purple2)' }} />;
      default: return <AlertCircle size={28} style={{ color: 'var(--accent-purple2)' }} />;
    }
  };

  const getTitle = () => {
    if (customTitle) return customTitle;
    if (decision.paywall?.title) return decision.paywall.title;
    if (decision.reasonCode === 'free_trial_limit_reached') {
      return t('paywall.trialEndedTitle', {
        defaultValue: i18n.language?.startsWith('en') ? 'Free trial ended' : 'Teste gratis finalizado',
      });
    }
    if (decision.reasonCode === 'level_locked') {
      return t('paywall.levelLockedTitle', {
        defaultValue: i18n.language?.startsWith('en') ? 'Keep leveling up' : 'Continue evoluindo',
      });
    }
    if (decision.status === 'quota_exhausted' || decision.reasonCode === 'daily_limit_reached') {
      return t('paywall.limitReached', {
        defaultValue: i18n.language?.startsWith('en') ? 'Daily limit reached' : 'Limite diário atingido',
      });
    }
    return t('paywall.featureLocked', {
      defaultValue: i18n.language?.startsWith('en') ? 'Premium feature' : 'Recurso premium',
    });
  };

  const getDescription = () => {
    if (customDescription) return customDescription;
    if (decision.paywall?.message) return decision.paywall.message;
    if (decision.reasonCode === 'free_trial_limit_reached') {
      return t('paywall.freeTrialLimitReachedDesc', {
        defaultValue: i18n.language?.startsWith('en')
          ? 'Your free trial for this feature is over. Choose a plan to keep practicing with AI.'
          : 'Seu teste gratis deste recurso acabou. Escolha um plano para continuar praticando com IA.',
      });
    }
    if (decision.reasonCode === 'feature_locked_for_plan') {
      return t('paywall.featureLockedForPlanDesc', {
        defaultValue: i18n.language?.startsWith('en')
          ? 'This feature requires a paid plan. Upgrade to unlock guided practice.'
          : 'Este recurso exige um plano pago. Faca upgrade para liberar a pratica guiada.',
      });
    }
    if (decision.reasonCode === 'level_locked') {
      return t('paywall.levelLockedDesc', {
        defaultValue: i18n.language?.startsWith('en')
          ? 'This feature unlocks at a higher level. Keep practicing to reach it.'
          : 'Este recurso libera em um nivel maior. Continue praticando para chegar la.',
      });
    }
    if (decision.status === 'quota_exhausted' || decision.reasonCode === 'daily_limit_reached') {
      const featureName = getFeatureName();
      return t('paywall.limitReachedDesc', {
        feature: featureName,
        limit: getLimitLabel(),
        defaultValue: i18n.language?.startsWith('en')
          ? `You used today's free ${featureName} limit (${getLimitLabel()}). It renews tomorrow, or you can upgrade for more practice and tutor feedback.`
          : `Você usou o limite grátis de ${featureName} de hoje (${getLimitLabel()}). Ele renova amanhã, ou você pode fazer upgrade para praticar mais e receber feedback do tutor.`
      });
    }
    return t('paywall.featureLockedDesc', {
      defaultValue: i18n.language?.startsWith('en')
        ? 'This feature is available on paid plans. Choose a plan when you want to unlock more guided practice.'
        : 'Este recurso está disponível nos planos pagos. Escolha um plano quando quiser liberar mais prática guiada.'
    });
  };

  const getFeatureName = () => {
    switch (decision.feature) {
      case 'text_chat':
        return t('paywall.features.textChat', { defaultValue: i18n.language?.startsWith('en') ? 'text chat' : 'chat de texto' });
      case 'voice_chat':
        return t('paywall.features.voiceChat', { defaultValue: i18n.language?.startsWith('en') ? 'voice chat' : 'chat de voz' });
      case 'avatar_chat':
        return t('paywall.features.avatarChat', { defaultValue: i18n.language?.startsWith('en') ? 'avatar chat' : 'avatar com IA' });
      default:
        return t('paywall.features.generic', { defaultValue: i18n.language?.startsWith('en') ? 'this feature' : 'este recurso' });
    }
  };

  const formatAmount = (amount: number | null) => {
    if (amount === null) return '';
    if (decision.feature === 'voice_chat' || decision.feature === 'avatar_chat') {
      const minutes = Math.floor(amount / 60);
      const seconds = amount % 60;

      if (minutes > 0 && seconds === 0) {
        if (i18n.language?.startsWith('en')) {
          return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
        }
        return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
      }

      if (minutes > 0) {
        if (i18n.language?.startsWith('en')) {
          return `${minutes} min ${seconds}s`;
        }
        return `${minutes} min ${seconds}s`;
      }

      return `${amount}s`;
    }
    if (i18n.language?.startsWith('en')) {
      return `${amount} ${amount === 1 ? 'message' : 'messages'}`;
    }
    return `${amount} ${amount === 1 ? 'mensagem' : 'mensagens'}`;
  };

  const getLimitLabel = () => {
    if (decision.limit === null) return i18n.language?.startsWith('en') ? 'today’s limit' : 'limite de hoje';
    return formatAmount(decision.limit);
  };

  const getResetLabel = () => {
    if (decision.resetAtUtc === null) {
      return null; // One-time trial, never resets
    }
    if (!decision.resetAtUtc) {
      return t('paywall.renewsTomorrow', { defaultValue: 'Renova amanh\u00E3 \u00E0 meia-noite' });
    }

    const resetTime = new Date(decision.resetAtUtc).getTime();
    const totalSeconds = Math.max(0, Math.floor((resetTime - now) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const time = [hours, minutes, seconds]
      .map((value) => String(value).padStart(2, '0'))
      .join(':');

    return t('paywall.renewsIn', {
      time,
      defaultValue: i18n.language?.startsWith('en') ? `Renews in ${time}` : `Renova em ${time}`,
    });
  };

  const isTrialAvailable =
    decision.status === 'trial_available'
    || (decision.plan === 'free' && decision.status === 'locked');
  const targetPlan = decision.paywall?.targetPlan || decision.requiredPlan || 'standard';
  const plansUrl = `/plans?from_paywall=${decision.feature}&target_plan=${encodeURIComponent(targetPlan)}`;
  const upgradeLabel = decision.paywall?.ctaLabel || t('paywall.upgradeToPro', { defaultValue: 'Fazer upgrade para praticar mais' });

  return (
    <div
      className="bv-page flex flex-col items-center justify-center"
      style={{
        minHeight: variant === 'modal' ? 'auto' : '80vh',
        padding: variant === 'modal' ? 0 : '40px 20px',
        background: variant === 'modal' ? 'transparent' : undefined,
      }}
    >
      <div className="bv-card" style={{ padding: 32, width: '100%', maxWidth: 400, textAlign: 'center', position: 'relative' }}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#1f2130] text-white shadow-lg shadow-black/20 transition-colors hover:bg-[#2a2d3d]"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        )}
        
        {/* Icon Container */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(124,92,255,0.1)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          border: '1px solid rgba(124,92,255,0.2)',
        }}>
          {getFeatureIcon()}
        </div>

        {/* Text Content */}
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          {getTitle()}
        </h2>
        
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
          {getDescription()}
          {customHighlightedDescription && (
            <>
              <br />
              <span style={{ color: 'var(--accent-purple2)', fontWeight: 600 }}>
                {customHighlightedDescription}
              </span>
            </>
          )}
        </p>

        {/* Level Info Progress Box (Se for bloqueio de level) */}
        {levelInfo && (
          <div style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <LevelBadge level={levelInfo.level} label={levelInfo.levelLabel} size="sm" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Zap size={11} />
                {t('voice.xpNeeded', { defaultValue: '{{xp}} XP para o prÃ³ximo nÃ­vel', xp: levelInfo.xpToNextLevel })}
              </span>
            </div>
            <div style={{ width: '100%', bg: 'var(--bg-card)', height: 6, borderRadius: 3, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
              <div style={{ height: '100%', borderRadius: 3, background: 'var(--accent-purple)', width: `${levelInfo.progressPercent}%` }} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'left' }}>
              {levelInfo.description}
            </p>
          </div>
        )}

        {/* Usage Stats Box (Se for limite di\u00E1rio esgotado) */}
        {!levelInfo && decision.limit !== null && decision.limit > 0 && decision.status === 'quota_exhausted' && (
          <div style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {decision.resetAtUtc === null 
                  ? t('paywall.usageTrial', { defaultValue: 'Uso do teste único' }) 
                  : t('paywall.usage', { defaultValue: 'Uso de hoje' })}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 700 }}>{formatAmount(decision.used)} / {formatAmount(decision.limit)}</span>
            </div>
            <div style={{ width: '100%', height: 6, borderRadius: 3, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
              <div style={{ height: '100%', borderRadius: 3, background: 'var(--accent-teal)', width: '100%' }} />
            </div>
            {getResetLabel() && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Timer size={11} />
                {getResetLabel()}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {customAction ? (
            <button
              onClick={customAction}
              className="bv-btn-primary"
              style={{ width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {customActionIcon}
              {customActionLabel || t('paywall.continue', { defaultValue: 'Continuar' })}
            </button>
          ) : isTrialAvailable ? (
            <button
              onClick={() => navigate(plansUrl)}
              className="bv-btn-primary"
              style={{ width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <FlaskConical size={18} />
              {t('paywall.startTrial', { defaultValue: 'Iniciar Teste Gratuito' })}
            </button>
          ) : null}

          {showUpgradeButton && (
            <button
              onClick={() => navigate(plansUrl)}
              className="bv-btn-secondary"
              style={{ width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(124, 92, 255, 0.1)', border: '1px solid rgba(124, 92, 255, 0.3)', color: 'var(--accent-purple2)', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              <Crown size={16} />
              {upgradeLabel}
            </button>
          )}

          {onBack && (
            <button
              onClick={onBack}
              className="bv-btn-ghost"
              style={{ width: '100%', height: 44 }}
            >
              {t('paywall.goBack', { defaultValue: 'Voltar' })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
