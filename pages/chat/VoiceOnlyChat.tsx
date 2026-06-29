/**
 * Voice-Only Chat Page
 *
 * - Level 1: blocked (must reach Level 2 first)
 * - Level 2: 5 min limit, timer starts only when session begins
/**
 * Voice-Only Chat Page
 *
 * - Level 1: blocked (must reach Level 2 first)
 * - Level 2: 5 min limit, timer starts only when session begins
 *            Timer pauses while AI is speaking and only ends after AI finishes
 * - Level 3+: unlimited
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timer, Lock, Zap, Mic, FlaskConical, Crown } from 'lucide-react';
import GeminiVoiceChat from '../../components/GeminiVoiceChat';
import { useGamification } from '../../gamification/hooks/useGamification';
import LevelBadge from '../../gamification/components/LevelBadge';
import SessionSummaryModal from '../../gamification/components/SessionSummaryModal';
import { FeatureLockScreen } from '../../components/access/FeatureLockScreen';
import { calculateXpFromDuration } from '../../gamification/core/xpCalculator';
import { DEFAULT_GAMIFICATION_CONFIG } from '../../gamification/gamification.config';
import { useTranslation } from 'react-i18next';
import { isFeatureTourActive } from '../../utils/featureTourState';
import { useUser } from '../../context/UserContext';

const FREE_VOICE_TRIAL_SECONDS = 180;

const VoiceOnlyChat = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const { voiceSecondsRemaining, isVoiceChatUnlocked, level, levelLabel, xpToNextLevel, totalXp, addXp, voiceChatLimitSeconds } = useGamification();
  const navigate = useNavigate();
  const tourActive = isFeatureTourActive();
  const isPaidUser = !!user?.activePlan || !!user?.isInTrial;
  const trialStorageKey = useMemo(
    () => `sakae_voice_trial_v2_remaining_${user?.id || user?.email || user?.name || 'guest'}`,
    [user?.email, user?.id, user?.name],
  );
  const trialExpiryStorageKey = `${trialStorageKey}_expires_at`;
  const [trialRemaining, setTrialRemaining] = useState(() => {
    const storedValue = localStorage.getItem(trialStorageKey);
    const stored = storedValue === null ? FREE_VOICE_TRIAL_SECONDS : Number(storedValue);
    const expiresAt = Number(localStorage.getItem(`${trialStorageKey}_expires_at`));
    const remainingFromActiveSession = Number.isFinite(expiresAt) && expiresAt > 0
      ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      : FREE_VOICE_TRIAL_SECONDS;

    return Number.isFinite(stored)
      ? Math.max(0, Math.min(FREE_VOICE_TRIAL_SECONDS, stored, remainingFromActiveSession))
      : FREE_VOICE_TRIAL_SECONDS;
  });

  // Timer & Trial state
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() => {
    if (!isPaidUser) return trialRemaining;
    return voiceSecondsRemaining !== null ? voiceSecondsRemaining : FREE_VOICE_TRIAL_SECONDS;
  });
  const [secondsActive, setSecondsActive] = useState<number>(0);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const [hasStartedTrial, setHasStartedTrial] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<{ xp: number; duration: number } | null>(null);

  // Use Date.now() as reference to avoid setInterval drift
  const startTimeRef = useRef<number | null>(null);
  const pausedElapsedRef = useRef<number>(0); // seconds already elapsed before pause
  const rafRef = useRef<number | null>(null);
  const limitRef = useRef<number>(0);

  const tick = useCallback(() => {
    if (!startTimeRef.current) return;

    const elapsed = pausedElapsedRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000);
    setSecondsActive(elapsed);

    if (limitRef.current > 0) {
      const remaining = Math.max(0, limitRef.current - elapsed);
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        setTimeExpired(true);
        return; // stop ticking
      }
    }

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // When time expires, wait until AI stops speaking to trigger the end overlay
  useEffect(() => {
    if (timeExpired && !isAgentSpeaking && !showEndOverlay) {
      setShowEndOverlay(true);
    }
  }, [timeExpired, isAgentSpeaking, showEndOverlay]);

  // Once overlay shows, wait 4 seconds then fully tear down the session
  useEffect(() => {
    if (!showEndOverlay) return;

    const duration = limitRef.current;
    const timer = setTimeout(() => {
      if (duration > 0) {
        const xpGained = level > 1
          ? calculateXpFromDuration(duration, DEFAULT_GAMIFICATION_CONFIG, true)
          : 0;

        if (xpGained > 0) {
          addXp(xpGained, {
            type: 'voice-gemini',
            label: 'Gemini Voice Session (Timeout)',
            reason: t('gamification.reasons.voiceTimeout', { defaultValue: 'Talked to the audio tutor and completed daily speaking practice.' })
          });
        }

        if (!isPaidUser) {
          localStorage.setItem(trialStorageKey, '0');
          localStorage.removeItem(trialExpiryStorageKey);
          setTrialRemaining(0);
        }

        setSessionSummary({ xp: xpGained, duration });
      }

      setHasStartedTrial(false);
      setShowEndOverlay(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [showEndOverlay, level, addXp, isPaidUser, trialStorageKey, trialExpiryStorageKey, t]);
  // Timer agora roda continuamente, sem pausas quando a IA fala.
  // E quando o timer estiver parado (fora da ligacao), ele sincroniza com o banco de dados.
  useEffect(() => {
    if (!startTimeRef.current) {
      setSecondsLeft(!isPaidUser
        ? trialRemaining
        : voiceSecondsRemaining !== null ? voiceSecondsRemaining : FREE_VOICE_TRIAL_SECONDS);
    }
  }, [voiceSecondsRemaining, isPaidUser, trialRemaining]);

  // Called by GeminiVoiceChat when the user taps the mic button
  const handleSessionStart = useCallback(() => {
    // Level 1 em trial: usa o limite TOTAL do config, nao o saldo residual do banco.
    // Isso garante que o timer sempre comeca pelo tempo certo mesmo que o banco tenha saldo antigo.
    const timerStart = !isPaidUser
      ? trialRemaining
      : (level === 1 && hasStartedTrial && voiceChatLimitSeconds)
      ? voiceChatLimitSeconds
      : (voiceSecondsRemaining !== null ? voiceSecondsRemaining : FREE_VOICE_TRIAL_SECONDS);

    limitRef.current = timerStart;
    if (!isPaidUser) {
      localStorage.setItem(trialExpiryStorageKey, String(Date.now() + timerStart * 1000));
    }
    pausedElapsedRef.current = 0;
    startTimeRef.current = Date.now();
    setSecondsActive(0);
    setSecondsLeft(timerStart);
    setTimeExpired(false);

    rafRef.current = requestAnimationFrame(tick);
  }, [voiceSecondsRemaining, tick, level, hasStartedTrial, voiceChatLimitSeconds, isPaidUser, trialRemaining, trialExpiryStorageKey]);

  // Stop timer (called when user manually ends session)
  const stopTimer = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startTimeRef.current = null;
    setTimeExpired(false);
    setShowEndOverlay(false);
    limitRef.current = 0;
    pausedElapsedRef.current = 0;
    // Nao mudamos o secondsLeft para null. Isso garante que ele fique estatico na tela mostrando o que sobrou.
  }, []);

  // Called by GeminiVoiceChat when session ends manually
  const handleSessionEnd = useCallback((durationSeconds: number) => {
    stopTimer();
    if (!timeExpired) {
      const xpGained = level > 1
        ? calculateXpFromDuration(durationSeconds, DEFAULT_GAMIFICATION_CONFIG, true)
        : 0;
      if (xpGained > 0) {
        addXp(xpGained, {
          type: 'voice-gemini',
          label: 'Gemini Voice Session',
          reason: t('gamification.reasons.voiceManual', { defaultValue: 'Practiced pronunciation, conversation, and vocabulary via voice commands.' })
        });
      }
      if (!isPaidUser && durationSeconds > 0) {
        const nextRemaining = Math.max(0, trialRemaining - durationSeconds);
        localStorage.setItem(trialStorageKey, String(nextRemaining));
        localStorage.removeItem(trialExpiryStorageKey);
        setTrialRemaining(nextRemaining);
        setHasStartedTrial(false);
      }
      // Sempre mostra o resumo ao encerrar manualmente
      if (durationSeconds > 0) {
        setSessionSummary({ xp: xpGained, duration: durationSeconds });
      }
    }
  }, [stopTimer, addXp, level, timeExpired, isPaidUser, trialRemaining, trialStorageKey, trialExpiryStorageKey]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // --- Free user: one-time practice trial, then paid upgrade ---
  const limitSecs = !isPaidUser ? FREE_VOICE_TRIAL_SECONDS : (voiceChatLimitSeconds ?? FREE_VOICE_TRIAL_SECONDS);
  const limitLabel = limitSecs >= 60
    ? `${Math.round(limitSecs / 60)} ${t('common.minAbbr', { defaultValue: 'min' })}`
    : `${limitSecs} ${t('common.secAbbr', { defaultValue: 's' })}`;
  const availableTrialLabel = trialRemaining >= 60
    ? `${Math.round(trialRemaining / 60)} ${t('common.minAbbr', { defaultValue: 'min' })}`
    : `${trialRemaining} ${t('common.secAbbr', { defaultValue: 's' })}`;

  if (!tourActive && !isPaidUser && !hasStartedTrial && trialRemaining > 0) {
    return (
      <FeatureLockScreen
        decision={{
          feature: 'voice_chat',
          plan: 'free',
          status: 'locked',
          limit: trialRemaining,
          used: FREE_VOICE_TRIAL_SECONDS - trialRemaining,
          remaining: trialRemaining,
          resetAtUtc: null,
          requiredPlan: 'standard',
          reasonCode: 'plan_locked'
        }}
        onBack={() => navigate('/real-life')}
        customTitle={t('voice.locked.title', { defaultValue: 'Chat de Voz Bloqueado' })}
        customDescription={t('voice.locked.desc', { defaultValue: 'O Chat de Voz e um recurso dos planos pagos para uso continuo.' })}
        customHighlightedDescription={t('voice.locked.freeTrial', {
          limit: limitLabel,
          defaultValue: `Voce tem um teste gratuito unico de ${limitLabel} para experimentar antes de fazer upgrade.`
        })}
        showUpgradeButton={true}
        customAction={() => setHasStartedTrial(true)}
        customActionIcon={<FlaskConical size={18} />}
        customActionLabel={t('voice.startTrial', {
          limit: availableTrialLabel,
          defaultValue: `Iniciar teste pratico (${availableTrialLabel})`
        })}
      />
    );
  }

  if (!tourActive && !isPaidUser && trialRemaining <= 0) {
    return (
      <FeatureLockScreen
        decision={{
          feature: 'voice_chat',
          plan: 'free',
          status: 'quota_exhausted',
          limit: FREE_VOICE_TRIAL_SECONDS,
          used: FREE_VOICE_TRIAL_SECONDS,
          remaining: 0,
          resetAtUtc: null,
          requiredPlan: 'standard',
          reasonCode: 'one_time_trial_used'
        }}
        onBack={() => navigate('/real-life')}
        customTitle={t('voice.locked.title', { defaultValue: 'Chat de Voz Bloqueado' })}
        customDescription={t('voice.trialEnded', { defaultValue: 'Seu teste gratuito único de 3 minutos do Chat de Voz acabou. Faça upgrade para continuar praticando com IA por voz.' })}
        showUpgradeButton={true}
      />
    );
  }

  if (!tourActive && isPaidUser && level === 1) {
    return (
      <FeatureLockScreen
        decision={{
          feature: 'voice_chat',
          plan: 'pro',
          status: 'locked',
          limit: limitSecs,
          used: 0,
          remaining: limitSecs,
          resetAtUtc: null,
          requiredPlan: 'pro',
          reasonCode: 'level_locked'
        }}
        onBack={() => navigate('/real-life')}
        customTitle={t('voice.locked.title', { defaultValue: 'Chat de Voz Bloqueado' })}
        customDescription={t('voice.locked.desc', { defaultValue: 'O Chat de Voz e liberado para uso continuo a partir do Nivel 2.' })}
        customHighlightedDescription={t('voice.locked.keepPlaying', { defaultValue: 'Continue praticando no chat de texto para evoluir!' })}
        levelInfo={{
          level: level,
          levelLabel: levelLabel,
          xpToNextLevel: xpToNextLevel,
          progressPercent: 0,
          description: t('voice.level2Unlocks', { defaultValue: 'Nivel 2 libera o uso continuo do Chat de Voz.' })
        }}
        showUpgradeButton={false}
      />
    );
  }

  // --- Paid daily limit reached ---
  if (!tourActive && isPaidUser && voiceSecondsRemaining === 0) {
    return (
      <FeatureLockScreen
        decision={{
          feature: 'voice_chat',
          plan: 'pro',
          status: 'quota_exhausted',
          limit: limitSecs,
          used: limitSecs,
          remaining: 0,
          resetAtUtc: null,
          requiredPlan: 'pro',
          reasonCode: 'quota_exhausted'
        }}
        onBack={() => navigate('/real-life')}
        showUpgradeButton={false}
      />
    );
  }
  const isWarning = secondsLeft !== null && secondsLeft <= 60;

  return (
    <div id="tour-voice-page" className="chat-page-shell max-w-4xl mx-auto w-full h-[calc(100dvh-86px)] md:h-[88vh] md:my-auto flex flex-col overflow-hidden px-3 pt-2 pb-1 sm:px-4 md:pt-8 md:pb-4 relative">
      {/* O chat real continua atras do overlay... */}
      <GeminiVoiceChat
        onSessionStart={handleSessionStart}
        onAgentSpeakingChange={setIsAgentSpeaking}
        onSessionEnd={handleSessionEnd}
        isTimeExpired={timeExpired}
        timerSlot={
          secondsLeft !== null && (
            <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors min-w-[70px] ${
              isWarning
                ? 'bg-red-500 text-white animate-pulse shadow-md'
                : 'bg-indigo-100 border border-indigo-200 text-indigo-700 shadow-sm'
            }`}>
              <Timer size={14} />
              <span className="font-mono tabular-nums">{formatTime(secondsLeft)}</span>
            </div>
          )
        }
      />

      {/* SMOOTH TIME EXPIRED OVERLAY */}
      <div 
         className={`fixed inset-0 z-[100] bg-black/85 flex flex-col items-center justify-center transition-all duration-1000 ${
           showEndOverlay ? 'opacity-100 backdrop-blur-md pointer-events-auto' : 'opacity-0 pointer-events-none'
         }`}
      >
        <div className="bv-card" style={{ padding: 32, width: '90%', maxWidth: 400, textAlign: 'center', transition: 'all 0.7s ease' }}>
           {level === 1 ? <FlaskConical className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-bounce" /> : <Timer className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-bounce" />}
           <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
             {level === 1 ? t('voice.overlay.trialDone', { defaultValue: 'Trial Completed!' }) : t('voice.overlay.timeUp', { defaultValue: 'Time\'s Up!' })}
           </h2>
           <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
             {level === 1 ? (
               <>{t('voice.overlay.noXp', { defaultValue: 'Este teste nao gera XP.' })}<br/>{t('voice.overlay.reachLevel2', { defaultValue: 'Continue praticando para liberar o Chat de Voz continuo.' })}</>
             ) : (
               <>{t('voice.overlay.sessionExpired', { defaultValue: 'Your session timed out.' })}<br/>{t('voice.overlay.savingXp', { defaultValue: 'Wrapping up and saving XP...' })}</>
             )}
           </p>
           <div style={{ width: 32, height: 32, border: '3px solid rgba(124,92,255,0.2)', borderTopColor: 'var(--accent-purple)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }}></div>
        </div>
      </div>
      {/* SESSION SUMMARY MODAL */}
      {sessionSummary && (
        <SessionSummaryModal
          xpGained={sessionSummary.xp}
          durationSeconds={sessionSummary.duration}
          isVoice={true}
          currentLevel={level}
          currentXp={totalXp}
          xpToNextLevel={xpToNextLevel}
          onDismiss={() => setSessionSummary(null)}
        />
      )}
    </div>
  );
};

export default VoiceOnlyChat;

