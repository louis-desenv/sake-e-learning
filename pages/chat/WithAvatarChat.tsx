/**
 * Avatar Chat Page (No Scenario)
 *
 * Simple wrapper for avatar chat without a specific scenario.
 * Renders the VoiceChatUI component without scenario context.
 *
 * @fileoverview This component provides a generic avatar chat interface
 * without any scenario-specific context or routing.
 *
 * @dependencies react, ../../components
 *
 * @author SAke E-Learning Team
 * @version 3.2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import VoiceChatUI from '../../components/VoiceChatUI';
import { useGamification } from '../../gamification/hooks/useGamification';
import { FeatureLockScreen } from '../../components/access/FeatureLockScreen';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../context/UserContext';
import { isFeatureTourActive } from '../../utils/featureTourState';

const AVATAR_TRIAL_SECONDS = 120;

/**
 * Generic avatar chat page component.
 * Renders VoiceChatUI without a specific scenario.
 *
 * @component WithAvatarChat
 * @returns {JSX.Element} VoiceChatUI without scenario
 */
const WithAvatarChat = () => {
  const { 
    isAvatarUnlocked, 
    level, 
    xpToNextLevel, 
    avatarSecondsRemaining,
    voiceSecondsRemaining 
  } = useGamification();
  
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useUser();
  const tourActive = isFeatureTourActive();

  const isPaidUser = !!user?.activePlan && user.activePlan.type !== 'free' && user.activePlan.type !== 'start';
  
  const [hasStartedTrial, setHasStartedTrial] = useState(false);
  const availableTrialSeconds = avatarSecondsRemaining ?? 0;

  const formatTrialDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0 && remainingSeconds === 0) {
      if (i18n.language?.startsWith('en')) {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
      }
      return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }
    if (minutes > 0) {
      return `${minutes} min ${remainingSeconds}s`;
    }
    return i18n.language?.startsWith('en')
      ? `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`
      : `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`;
  };

  const fullTrialLabel = formatTrialDuration(AVATAR_TRIAL_SECONDS);
  const availableTrialLabel = formatTrialDuration(availableTrialSeconds);

  // --- FREE USER PAYWALL & TRIAL ---
  if (!isPaidUser && !tourActive) {
    if (!hasStartedTrial && availableTrialSeconds > 0) {
      return (
        <FeatureLockScreen
          decision={{
            feature: 'avatar_chat',
            plan: 'free',
            status: 'locked',
            limit: AVATAR_TRIAL_SECONDS,
            used: AVATAR_TRIAL_SECONDS - availableTrialSeconds,
            remaining: availableTrialSeconds,
            resetAtUtc: null,
            requiredPlan: 'pro',
            reasonCode: 'plan_locked'
          }}
          onBack={() => navigate('/real-life')}
          customTitle={t('avatar.locked.title', { defaultValue: 'Avatar Exclusivo PRO' })}
          customDescription={t('avatar.trial.descFree', {
            defaultValue: 'O Avatar com Inteligência Artificial é um recurso exclusivo para assinantes PRO.'
          })}
          customHighlightedDescription={t('avatar.trial.descFreeHighlight', {
            duration: fullTrialLabel,
            defaultValue: `Experimente agora com um teste gratuito único de ${fullTrialLabel}!`
          })}
          showUpgradeButton={true}
          customAction={() => setHasStartedTrial(true)}
          customActionIcon={<FlaskConical size={18} />}
          customActionLabel={t('avatar.trial.start', {
            seconds: availableTrialSeconds,
            duration: availableTrialLabel,
            defaultValue: `Iniciar teste (${availableTrialLabel})`,
          })}
        />
      );
    } else if (availableTrialSeconds <= 0) {
      return (
        <FeatureLockScreen
          decision={{
            feature: 'avatar_chat',
            plan: 'free',
            status: 'quota_exhausted',
            limit: AVATAR_TRIAL_SECONDS,
            used: AVATAR_TRIAL_SECONDS,
            remaining: 0,
            resetAtUtc: null, // Signals it's a one-time thing
            requiredPlan: 'pro',
            reasonCode: 'quota_exhausted'
          }}
          onBack={() => navigate('/real-life')}
          customTitle={t('avatar.locked.title', { defaultValue: 'Avatar Exclusivo PRO' })}
          customDescription={t('avatar.trial.ended', {
            duration: fullTrialLabel,
            defaultValue: `Seu teste único de ${fullTrialLabel} do Avatar acabou. Faça upgrade para o plano PRO para continuar praticando com IA realista.`
          })}
          showUpgradeButton={true}
        />
      );
    }
  }

  // --- PRO USER LEVEL GATING ---
  if (isPaidUser && !isAvatarUnlocked && !tourActive) {
    return (
      <FeatureLockScreen
        decision={{
          feature: 'avatar_chat',
          plan: 'pro',
          status: 'locked',
          limit: null,
          used: 0,
          remaining: 0,
          resetAtUtc: null,
          requiredPlan: 'pro',
          reasonCode: 'level_locked'
        }}
        onBack={() => navigate('/real-life')}
        customTitle={t('avatar.locked.title', { defaultValue: 'Avatar Bloqueado' })}
        customDescription={t('avatar.locked.descPro', { defaultValue: 'O Avatar completo com IA é liberado no Nível 3. Continue praticando as simulações e chats de texto para evoluir e desbloquear esta funcionalidade!' })}
        levelInfo={{
          level: level,
          levelLabel: t('avatar.locked.currentLevel', { defaultValue: 'Seu Nível Atual' }),
          xpToNextLevel: xpToNextLevel,
          progressPercent: 0,
          description: t('avatar.level3Unlocks', { defaultValue: 'Nível 3 desbloqueia o Avatar completo' })
        }}
        showUpgradeButton={false}
      />
    );
  }

  const avatarTimeLimit = tourActive
    ? AVATAR_TRIAL_SECONDS
    : (!isPaidUser ? availableTrialSeconds : avatarSecondsRemaining ?? voiceSecondsRemaining);

  return (
    <div id="tour-avatar-page" className="chat-page-shell max-w-4xl mx-auto w-full h-[calc(100dvh-86px)] md:h-[88vh] md:my-auto flex flex-col overflow-hidden px-3 pt-2 pb-1 sm:px-4 md:pt-8 md:pb-4 relative">
      <VoiceChatUI
        timeLimitSeconds={avatarTimeLimit}
        awardXp={isPaidUser && isAvatarUnlocked && !tourActive}
        recordUsage={!tourActive}
        featureToRecord="avatar_chat"
      />
    </div>
  );
};

export default WithAvatarChat;
