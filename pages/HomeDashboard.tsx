/**
 * Home Dashboard — "Para você"
 *
 * Bold Voice inspired dark-mode dashboard.
 * Shows personalized greeting, streak tracker, XP progress,
 * featured hero card and quick-access action cards.
 *
 * @version 4.0.0 (Bold Voice Redesign)
 */

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useGamification } from '../gamification/hooks/useGamification';
import XpGainToast from '../gamification/components/XpGainToast';
import LevelUpModal from '../gamification/components/LevelUpModal';
import { useTranslation } from 'react-i18next';
import { Zap, Mic, MessageCircle, BookOpen, User, Flame, ChevronRight, Star, Trophy, Bot, Check, Mic2, UserRound, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { conversationService, Conversation } from '../services/conversationService';

const getUserId = (user: { id?: string; name?: string } | null): string => {
  return user?.id || user?.name || 'guest';
};

const getLocalDateKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDailyGoalMinutes = (dailyGoal?: string): number => {
  switch (dailyGoal) {
    case 'Spark':
      return 3;
    case 'Flow':
      return 10;
    case 'Surge':
      return 30;
    case 'Boost':
    default:
      return 20;
  }
};

// ============================================================================
// HELPERS
// ============================================================================

// ============================================================================
// COMPONENT
// ============================================================================

const HomeDashboard: React.FC = () => {
  const { user, updateUser } = useUser();
  const location = useLocation();
  const { t } = useTranslation();
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const {
    totalXp, level, levelLabel, progress, xpToNextLevel, currentLevelXp, levelXpRange, isMaxLevel,
    lastXpGained, didLevelUp, newlyUnlockedTopics,
    dismissLevelUp, dismissXpToast, resetProfile,
  } = useGamification();

  // Load real conversations to compute streak
  useEffect(() => {
    if (user) {
      const userId = getUserId(user);
      conversationService.getConversations(userId, 60, {
        plan: user?.activePlan?.type,
        isTrial: user?.isInTrial,
      })
        .then(data => setConversations(data))
        .catch(err => console.error('[HomeDashboard] Error loading conversations:', err));
    }
  }, [user]);

  // Reset Tour via URL param (Somente Local/Desenvolvimento)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('reset_tour') === '1' && import.meta.env.DEV) {
      localStorage.removeItem('flowspeak_tour_completed');
      sessionStorage.removeItem('flowspeak_feature_tour_active');
      window.location.href = '/home'; // Remove query param and reload
    }
  }, [location.search]);

  // Compute actual streak from conversations
  const getStreakAndActiveDays = () => {
    if (conversations.length === 0) return { streak: 0 };

    const activeDates = new Set<string>();
    conversations.forEach(conv => {
      if (conv.started_at) {
        activeDates.add(new Date(conv.started_at).toDateString());
      }
    });

    const sortedDates = Array.from(activeDates)
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    if (sortedDates.length === 0) return { streak: 0 };

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const mostRecent = sortedDates[0];
    mostRecent.setHours(0, 0, 0, 0);

    if (mostRecent.getTime() === today.getTime() || mostRecent.getTime() === yesterday.getTime()) {
      let expectedDate = mostRecent;
      for (const date of sortedDates) {
        date.setHours(0, 0, 0, 0);
        if (date.getTime() === expectedDate.getTime()) {
          streak++;
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else if (date.getTime() < expectedDate.getTime()) {
          break;
        }
      }
    }

    return { };
  };

  const { streakDays, nextResetTimeUtc } = useGamification();
  const [timeLeftText, setTimeLeftText] = useState('');
  const [showWarningCard, setShowWarningCard] = useState(false);
  const [showPracticeNudge, setShowPracticeNudge] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetTime = nextResetTimeUtc ? new Date(nextResetTimeUtc) : (() => {
        const d = new Date();
        d.setUTCHours(24, 0, 0, 0);
        return d;
      })();

      const now = new Date().getTime();
      const diffMs = targetTime.getTime() - now;

      // Only show warning when remaining time is <= 60 minutes (1 hour)
      setShowWarningCard(diffMs > 0 && diffMs <= 3600000);

      if (diffMs <= 0) {
        return t('dashboard.streakWarning.minutesRemaining', { minutes: 0, defaultValue: 'Faltam 0 min' });
      }

      const totalMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours > 0) {
        return t('dashboard.streakWarning.hoursMinutesRemaining', { hours, minutes, defaultValue: `Faltam ${hours}h ${minutes}min` });
      } else {
        return t('dashboard.streakWarning.minutesRemaining', { minutes, defaultValue: `Faltam ${minutes} min` });
      }
    };

    setTimeLeftText(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeftText(calculateTimeLeft());
    }, 30000);

    return () => clearInterval(interval);
  }, [nextResetTimeUtc, t]);

  // Sum today's practice duration in minutes
  const getTodayPracticeMinutes = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const seconds = conversations.reduce((acc, conv) => {
      if (!conv.started_at) return acc;
      const convDate = new Date(conv.started_at);
      convDate.setHours(0, 0, 0, 0);
      if (convDate.getTime() === today.getTime()) {
        return acc + (conv.duration_seconds || 0);
      }
      return acc;
    }, 0);
    return Math.round(seconds / 60);
  };

  const todayMinutes = getTodayPracticeMinutes();
  const dailyTarget = getDailyGoalMinutes(user?.dailyGoal);
  const minutesLeft = Math.max(0, dailyTarget - todayMinutes);
  const shouldShowDailyPracticeCard = minutesLeft > 0 && (showWarningCard || showPracticeNudge);

  useEffect(() => {
    if (!user || todayMinutes <= 0 || minutesLeft <= 0) {
      setShowPracticeNudge(false);
      return;
    }

    const storageKey = `flowspeak_daily_practice_nudge:${getUserId(user)}:${getLocalDateKey()}`;
    if (sessionStorage.getItem(storageKey) === 'true') {
      setShowPracticeNudge(false);
      return;
    }

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(storageKey, 'true');
      setShowPracticeNudge(true);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [minutesLeft, todayMinutes, user]);

  // Build streak days with translated labels (Mon–Sun order to match UI)
  const weekdayLabels = [
    t('profilePage.weekdays.0', { defaultValue: 'Seg' }),
    t('profilePage.weekdays.1', { defaultValue: 'Ter' }),
    t('profilePage.weekdays.2', { defaultValue: 'Qua' }),
    t('profilePage.weekdays.3', { defaultValue: 'Qui' }),
    t('profilePage.weekdays.4', { defaultValue: 'Sex' }),
    t('profilePage.weekdays.5', { defaultValue: 'Sáb' }),
    t('profilePage.weekdays.6', { defaultValue: 'Dom' }),
  ];

  const getWeekDates = () => {
    const now = new Date();
    const currentDay = now.getDay(); // Sun=0, Mon=1, ..., Sat=6
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    
    const weekDates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + mondayOffset + i);
      date.setHours(0, 0, 0, 0);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getWeekDates();
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const speakScanStreakDays = weekdayLabels.map((label, i) => {
    const date = weekDates[i];
    const isToday = date.getTime() === todayDate.getTime();
    const done = conversations.some(conv => {
      if (!conv.started_at) return false;
      const convDate = new Date(conv.started_at);
      convDate.setHours(0, 0, 0, 0);
      return convDate.getTime() === date.getTime();
    });
    return { label, done, today: isToday };
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search || window.location.hash.split('?')[1]);
    if (searchParams.get('payment') === 'success') {
      setShowPaymentSuccess(true);
      const needsUpdate = !user?.activePlan || typeof user?.activePlan === 'string';
      if (needsUpdate && user) {
        const planType = typeof user.activePlan === 'string' ? user.activePlan : 'super';
        updateUser({
          ...user,
          activePlan: {
            id: 'sub_live_' + Date.now(),
            type: planType,
            cycle: planType === 'super' ? 'annual' : 'monthly',
            startDate: new Date().toISOString(),
          },
        });
      }
      window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0]);
      setTimeout(() => setShowPaymentSuccess(false), 5000);
    }
  }, [location.search, user, updateUser]);

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning', { defaultValue: 'Bom dia' });
    if (hour < 18) return t('dashboard.goodAfternoon', { defaultValue: 'Boa tarde' });
    return t('dashboard.goodEvening', { defaultValue: 'Boa noite' });
  };

  if (!user) return null;

  const firstName = user.name?.split(' ')[0] ?? user.name;

  return (
    <div className="bv-page animate-fade-up">

      {/* ====================================================================
          TOASTS & MODALS (unchanged logic)
          ==================================================================== */}
      {lastXpGained > 0 && <XpGainToast xpGained={lastXpGained} onDismiss={dismissXpToast} />}

      {showPaymentSuccess && (
        <div className="fixed top-20 right-4 z-50 animate-bounce rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg,#00d4a8,#3b82f6)', color: '#fff' }}>
          <Star size={18} />
          <div>
            <p className="font-bold text-sm">{t('dashboard.paymentConfirmed', { defaultValue: 'Pagamento confirmado!' })}</p>
            <p className="text-xs opacity-80">{t('dashboard.planActive', { defaultValue: 'Seu plano Premium está ativo.' })}</p>
          </div>
          <button onClick={() => setShowPaymentSuccess(false)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {didLevelUp && (
        <LevelUpModal
          newLevel={level}
          newLevelLabel={levelLabel}
          newlyUnlockedTopics={newlyUnlockedTopics}
          onDismiss={dismissLevelUp}
        />
      )}

      {/* ====================================================================
          LAYOUT BODY — Wide Stacking (100% width)
          ==================================================================== */}
      <div className="flex flex-col gap-6 w-full">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {getGreeting()}, {firstName}!
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="bv-streak" style={{ background: 'var(--bg-card-alt)', color: 'var(--text-primary)', border: 'none', padding: '6px 12px' }}>
              <Flame size={14} className="text-orange-400" />
              {streakDays}
            </span>
            <span className="bv-xp-badge" style={{ background: 'var(--bg-card-alt)', color: 'var(--text-primary)', border: 'none', padding: '6px 12px' }}>
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              {totalXp}
            </span>
          </div>
        </div>

        {/* XP Progress Card */}
        <div id="tour-xp-progress" className="bv-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                background: 'rgba(245,158,11,0.15)',
                borderRadius: '50%',
                padding: '7px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Zap size={16} className="text-yellow-400" />
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('dashboard.xpProgressLabel', { level, levelLabel, defaultValue: `Nível ${level} · ${levelLabel}` })}
              </span>
            </div>
            {/* ✅ FIX B6: mostra XP no nível atual / intervalo do nível (ex: 20 / 60 XP) */}
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{currentLevelXp} / {levelXpRange} XP</span>
          </div>
          <div style={{ height: 8, background: 'var(--bg-card-alt)', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div
              style={{
                height: '100%',
                borderRadius: 99,
                background: 'linear-gradient(90deg, #f59e0b, #ef4444)'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}>
            {t('dashboard.xpProgressDetail', { xp: xpToNextLevel, defaultValue: `faltam ${xpToNextLevel} XP para o próximo nível` })}
          </p>
        </div>

        {/* Daily Practice CTA Box / Success Card */}
        {minutesLeft > 0 ? (
          shouldShowDailyPracticeCard ? (
            <div className="bv-card" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '20px 24px',
              border: '1px solid var(--accent-amber)',
              background: 'rgba(245, 158, 11, 0.04)'
            }}>
              <Flame size={24} className="text-orange-500 fill-orange-500 animate-pulse flex-shrink-0" />
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {todayMinutes === 0 
                    ? t('dashboard.streakWarning.notPracticed', { defaultValue: 'Você ainda não praticou hoje' }) 
                    : t('dashboard.streakWarning.dailyPractice', { defaultValue: 'Prática Diária' })
                  }
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 3 }}>
                  {todayMinutes === 0
                    ? (streakDays === 0 
                        ? t('dashboard.streakWarning.timeLeftStart', { timeLeft: timeLeftText, defaultValue: `${timeLeftText} para iniciar sua sequência de 1 dia` })
                        : (streakDays === 1 
                            ? t('dashboard.streakWarning.timeLeftMaintain_one', { timeLeft: timeLeftText, defaultValue: `${timeLeftText} para manter sua sequência de 1 dia` })
                            : t('dashboard.streakWarning.timeLeftMaintain_other', { timeLeft: timeLeftText, streakDays, defaultValue: `${timeLeftText} para manter sua sequência de ${streakDays} dias` })
                          )
                      )
                    : t('dashboard.streakWarning.practicedXMinutes', { todayMinutes, minutesLeft, defaultValue: `Você praticou ${todayMinutes} min hoje. Faltam ${minutesLeft} min para bater a meta!` })
                  }
                </div>
              </div>
              <Link to="/real-life" style={{ marginLeft: 'auto', textDecoration: 'none' }}>
                <button style={{
                  background: 'var(--accent-purple)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 800,
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 10px rgba(124, 92, 255, 0.2)'
                }}>
                  {t('dashboard.practiceNow', { defaultValue: 'Praticar agora' })}
                </button>
              </Link>
            </div>
          ) : null
        ) : (
          <div className="bv-card" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '20px 24px',
            border: '1px solid var(--accent-teal)',
            background: 'rgba(0, 212, 168, 0.04)'
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--accent-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(0, 212, 168, 0.3)',
              flexShrink: 0
            }}>
              <Check size={16} color="#fff" strokeWidth={3} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('dashboard.goalMetToday', { defaultValue: 'Meta batida hoje!' })}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 3 }}>
                {t('dashboard.goalMetTodayDesc', { todayMinutes, defaultValue: `Você praticou ${todayMinutes} min hoje. Parabéns por manter sua sequência ativa!` })}
              </div>
            </div>
          </div>
        )}

        {/* Weekly Streak Card */}
        <div id="tour-weekly-streak" className="bv-card" style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%' }}>
            {speakScanStreakDays.map((day) => {
              const firstLetter = day.label.charAt(0);
              return (
                <div key={day.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  {day.done ? (
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 12px rgba(16,185,129,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Check size={16} color="#fff" strokeWidth={3} />
                    </div>
                  ) : day.today ? (
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: '2px solid #10b981',
                      boxShadow: '0 0 8px rgba(16,185,129,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>{firstLetter}</span>
                    </div>
                  ) : (
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--bg-card-alt)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{firstLetter}</span>
                    </div>
                  )}
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: day.today ? '#10b981' : 'var(--text-muted)'
                  }}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>


        {/* Avatar Hero Card */}
        <Link to="/chat/with-avatar" id="tour-avatar-hero" style={{ textDecoration: 'none' }}>
          <div className="bv-card-press" style={{
            background: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
            borderRadius: 16,
            padding: '28px 26px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.25)'
          }}>
            <div style={{ flex: '1 1 200px' }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.2 }}>
                {t('dashboard.featuredTitle', { defaultValue: 'Fale com um Avatar Ultra-realista' })}
              </h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.45, margin: 0 }}>
                {t('dashboard.featuredDesc', { defaultValue: 'Pratique sua fala e audição conversando em tempo real com seu tutor IA.' })}
              </p>
            </div>
            <button style={{
              background: '#fff',
              color: '#6d28d9',
              fontWeight: 700,
              fontSize: 15,
              border: 'none',
              borderRadius: 8,
              padding: '14px 28px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {t('dashboard.featuredBtn', { defaultValue: 'Falar Agora' })}
            </button>
          </div>
        </Link>

        {/* QUICK ACCESS — 4-Column Grid on Desktop */}
        <div id="tour-quick-access">
          <p className="bv-section-label" style={{ marginTop: 8, marginBottom: 12 }}>{t('dashboard.quickAccess', { defaultValue: 'Acesso rápido' })}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ width: '100%' }}>
            {/* Real Life */}
            <Link to="/real-life" id="tour-real-life-card" style={{ textDecoration: 'none' }}>
              <div className="bv-card bv-card-press" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'linear-gradient(135deg,#3b82f6,#7c5cff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MessageSquare size={22} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 3 }}>
                    {t('dashboard.cards.realLifeTitle', { defaultValue: 'Trilha Vida Real' })}
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    {t('dashboard.cards.realLifeDesc', { defaultValue: 'Exercícios rápidos e desafios diários.' })}
                  </p>
                </div>
              </div>
            </Link>

            {/* Voice */}
            <Link to="/livekit-chat" id="tour-voice-card" style={{ textDecoration: 'none' }}>
              <div className="bv-card bv-card-press" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'linear-gradient(135deg,#a855f7,#ec4899)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Mic2 size={22} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 3 }}>
                    {t('dashboard.cards.voiceTitle', { defaultValue: 'Voz' })}
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    {t('dashboard.cards.voiceDesc', { defaultValue: 'Converse em tempo real com seu tutor de inglês.' })}
                  </p>
                </div>
              </div>
            </Link>

            {/* Plans */}
            <Link to="/plans" id="tour-plans-card" style={{ textDecoration: 'none' }}>
              <div className="bv-card bv-card-press" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Star size={22} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 3 }}>
                    {t('dashboard.cards.plansTitle', { defaultValue: 'Planos' })}
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    {t('dashboard.cards.plansDesc', { defaultValue: 'Faça upgrade e desbloqueie mais recursos.' })}
                  </p>
                </div>
              </div>
            </Link>

            {/* Profile */}
            <Link to="/profile" id="tour-profile-card" style={{ textDecoration: 'none' }}>
              <div className="bv-card bv-card-press" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'linear-gradient(135deg,#00d4a8,#3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <UserRound size={22} color="#fff" />
                </div>
                <div>
                  <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 3 }}>
                    {t('dashboard.cards.profileTitle', { defaultValue: 'Perfil' })}
                  </p>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    {t('dashboard.cards.profileDesc', { defaultValue: 'Acompanhe seu progresso e conquistas.' })}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>


      </div>
      {/* FeatureTour is now rendered globally in App.tsx */}
    </div>
  );
};

export default HomeDashboard;
