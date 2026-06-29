/**
 * My Profile Page — Bold Voice Redesign
 *
 * Dark-mode profile with avatar, activity calendar,
 * stats grid, XP progress, badges and conversation history.
 *
 * @version 4.0.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { conversationService, Conversation, Message } from '../services/conversationService';
import { useGamification } from '../gamification/hooks/useGamification';
import XpProgressBar from '../gamification/components/XpProgressBar';
import BadgesSection from '../gamification/components/BadgesSection';
import { useTranslation } from 'react-i18next';
import { LogOut, ChevronDown, ChevronUp, Download, Zap, MessageCircle, Trophy, Clock, Flame, Languages, Target, ChevronLeft, ChevronRight, Check, Star, Award, Settings, Camera, Mic, Globe, Trash2, Sun, Moon, Crown, Bot, BarChart2, ExternalLink, Users, Activity, KeyRound, Mail, Bell } from 'lucide-react';
import { restartFeatureTour } from '../utils/featureTourState';
import { isResetReminderEnabled, setResetReminderEnabled } from '../gamification/hooks/useDailyResetReminder';
import { isLocalOnlyFeatureEnabled } from '../utils/localOnlyFeatures';
import { motion } from 'framer-motion';
import { authService } from '../services/api';
import { ENGLISH_LEVELS, LEARNING_GOALS, LANGUAGES } from '../constants';
import { EnglishLevel, LearningGoal, Language, DailyGoal } from '../types';
import { createBillingPortalSession } from '../services/paymentApiService';

const getUserId = (user: { id?: string; name?: string } | null): string => {
  return user?.id || user?.name || 'guest';
};

// ============================================================================
// INDIVIDUAL HISTORIC ITEM COMPONENT
// ============================================================================

interface ConversationItemProps {
  id: string;
  scenario: string;
  startedAt: string;
  durationSeconds: number;
  messageCount: number;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  id,
  scenario,
  startedAt,
  durationSeconds,
  messageCount,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [preparingDownload, setPreparingDownload] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);

  useEffect(() => {
    if (expanded && !messages.length) {
      loadMessages();
    }
  }, [expanded]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await conversationService.getConversationWithMessages(id);
      setMessages(data?.messages || []);
    } catch (err) {
      console.error('[MyProfile] Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getLabel = () => {
    return t(`scenarios.${scenario}.title`, { defaultValue: scenario });
  };
  const displayedMessageCount = messages.length > 0 ? messages.length : messageCount;

  const downloadConversation = () => {
    if (!messages.length) return;
    let content = `=${getLabel().toUpperCase()}=\n`;
    content += `Data: ${formatDate(startedAt)}\nDuração: ${formatDuration(durationSeconds)}\n${'='.repeat(40)}\n\n`;
    messages.forEach(msg => {
      const sender = msg.role === 'user' ? 'Você' : 'IA Tutor';
      content += `[${sender.toUpperCase()}]\n${msg.content}\n\n`;
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${scenario}-${startedAt.split('T')[0]}.txt`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const requestDownloadConversation = async () => {
    if (!messages.length) {
      setPreparingDownload(true);
      try {
        const data = await conversationService.getConversationWithMessages(id);
        if (!data?.messages?.length) return;
        setMessages(data.messages);
      } catch (err) {
        console.error('[MyProfile] Error preparing download:', err);
        return;
      } finally {
        setPreparingDownload(false);
      }
    }

    setShowDownloadConfirm(true);
  };

  if (loading) {
    return (
      <div className="animate-shimmer" style={{ borderRadius: 12, height: 56 }} />
    );
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--accent-purple2)' }}>{getLabel()}</span>
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {formatDate(startedAt)} · {formatDuration(durationSeconds)} · {displayedMessageCount} msgs
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={e => { e.stopPropagation(); void requestDownloadConversation(); }}
            disabled={preparingDownload}
            style={{
              background: 'none',
              border: 'none',
              cursor: preparingDownload ? 'wait' : 'pointer',
              color: preparingDownload ? 'var(--accent-purple2)' : 'var(--text-muted)',
              padding: 0,
              minWidth: 40,
              minHeight: 40,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Download size={14} />
          </button>
          {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
        </div>
      </div>

      {/* Messages */}
      {expanded && (
        <div style={{
          padding: '12px 16px', maxHeight: 320, overflowY: 'auto',
          background: 'var(--bg-base)', borderTop: '1px solid var(--border-subtle)',
        }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
              <div style={{
                maxWidth: '85%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                background: msg.role === 'user' ? 'var(--accent-purple)' : 'var(--bg-card)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-secondary)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
              }}>
                <p style={{ fontSize: 10, fontWeight: 600, marginBottom: 4, opacity: 0.7 }}>
                  {msg.role === 'user' ? t('profilePage.you', { defaultValue: 'Você' }) : t('profilePage.aiTutor', { defaultValue: 'IA Tutor' })}
                </p>
                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDownloadConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          background: 'rgba(0,0,0,0.62)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            width: '100%',
            maxWidth: 420,
            borderRadius: 18,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
            padding: 24,
          }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              {t('chat.confirmDownloadTitle', { defaultValue: 'Baixar conversa?' })}
            </h3>
            <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              {t('chat.confirmDownloadDesc', {
                title: getLabel(),
                count: displayedMessageCount,
                defaultValue: `Você vai baixar "${getLabel()}" com ${displayedMessageCount} mensagens em um arquivo .txt.`,
              })}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button
                onClick={() => { downloadConversation(); setShowDownloadConfirm(false); }}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  border: 'none',
                  background: 'var(--accent-purple)',
                  color: '#fff',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {t('chat.confirmDownloadAction', { defaultValue: 'Baixar agora' })}
              </button>
              <button
                onClick={() => setShowDownloadConfirm(false)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 12,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card-alt)',
                  color: 'var(--text-secondary)',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {t('common.cancel', { defaultValue: 'Cancelar' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DYNAMIC WEEKLY STREAK COMPONENT
// ============================================================================

interface WeeklyStreakRowProps {
  conversations: Conversation[];
}

const WeeklyStreakRow: React.FC<WeeklyStreakRowProps> = ({ conversations }) => {
  const { t } = useTranslation();

  // Seg = 0, Ter = 1, ..., Dom = 6
  const weekDaysShort = [
    t('profilePage.weekdays.0', { defaultValue: 'Seg' }),
    t('profilePage.weekdays.1', { defaultValue: 'Ter' }),
    t('profilePage.weekdays.2', { defaultValue: 'Qua' }),
    t('profilePage.weekdays.3', { defaultValue: 'Qui' }),
    t('profilePage.weekdays.4', { defaultValue: 'Sex' }),
    t('profilePage.weekdays.5', { defaultValue: 'Sáb' }),
    t('profilePage.weekdays.6', { defaultValue: 'Dom' }),
  ];

  // Helper to map index (0=Seg) to first letters
  const firstLetters = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check which days of the week had practice
  const weekActiveFlags = weekDates.map(date => {
    return conversations.some(conv => {
      const convDate = new Date(conv.started_at);
      convDate.setHours(0, 0, 0, 0);
      return convDate.getTime() === date.getTime();
    });
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%', marginBottom: 8 }}>
      {weekDaysShort.map((dayName, index) => {
        const isCompleted = weekActiveFlags[index];
        const isToday = weekDates[index].getTime() === today.getTime();

        return (
          <div key={dayName} style={{ display: 'flex', flexDirection: 'column', alignSelf: 'center', alignItems: 'center', gap: '6px' }}>
            <div 
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...(isCompleted 
                  ? {
                      background: 'rgb(16, 185, 129)',
                      boxShadow: 'rgba(16, 185, 129, 0.4) 0px 0px 12px',
                      border: 'none'
                    }
                  : isToday
                    ? {
                        border: '2px solid rgb(16, 185, 129)',
                        boxShadow: 'rgba(16, 185, 129, 0.2) 0px 0px 8px',
                        background: 'transparent'
                      }
                    : {
                        background: 'var(--bg-card-alt)',
                        border: 'none'
                      })
              }}
            >
              {isCompleted ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <span 
                  style={{ 
                    fontSize: '12px', 
                    fontWeight: isToday ? '750' : '600', 
                    color: isToday ? 'var(--text-primary)' : 'var(--text-muted)' 
                  }}
                >
                  {firstLetters[index]}
                </span>
              )}
            </div>
            <span 
              style={{ 
                fontSize: '11px', 
                fontWeight: '600', 
                color: isCompleted || isToday ? 'rgb(16, 185, 129)' : 'var(--text-muted)' 
              }}
            >
              {dayName}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// DYNAMIC ACTIVITY CALENDAR COMPONENT
// ============================================================================

interface ActivityCalendarProps {
  conversations: Conversation[];
  totalTimeLabel: string;
}

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ conversations, totalTimeLabel }) => {
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthName = currentDate.toLocaleDateString(i18n.language || 'pt-BR', { month: 'long', year: 'numeric' });
  const weekDays = [
    t('profilePage.weekdays.0', { defaultValue: 'Seg' }),
    t('profilePage.weekdays.1', { defaultValue: 'Ter' }),
    t('profilePage.weekdays.2', { defaultValue: 'Qua' }),
    t('profilePage.weekdays.3', { defaultValue: 'Qui' }),
    t('profilePage.weekdays.4', { defaultValue: 'Sex' }),
    t('profilePage.weekdays.5', { defaultValue: 'Sáb' }),
    t('profilePage.weekdays.6', { defaultValue: 'Dom' }),
  ];

  // Dynamic calendar math
  const firstDay = new Date(currentYear, currentMonth, 1);
  const rawOffset = firstDay.getDay(); // Sun=0, Mon=1, ..., Sat=6
  const offset = rawOffset === 0 ? 6 : rawOffset - 1; // Map Mon=0, Tue=1, ..., Sun=6
  
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Prev month trailing days
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const totalDaysPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

  const paddingSlots = Array.from({ length: offset }, (_, i) => ({
    day: totalDaysPrevMonth - offset + i + 1,
    isCurrentMonth: false,
    monthOffset: -1
  }));

  const daysArray = Array.from({ length: totalDays }, (_, i) => ({
    day: i + 1,
    isCurrentMonth: true,
    monthOffset: 0
  }));

  const nextMonthPaddingCount = 42 - (offset + totalDays);
  const nextMonthPadding = Array.from({ length: nextMonthPaddingCount }, (_, i) => ({
    day: i + 1,
    isCurrentMonth: false,
    monthOffset: 1
  }));

  const calendarSlots = [...paddingSlots, ...daysArray, ...nextMonthPadding];

  // Filter conversations to a set of "YYYY-MM-DD"
  const activeDateStrings = new Set<string>();
  conversations.forEach(conv => {
    if (conv.started_at) {
      const d = new Date(conv.started_at);
      const dateStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      activeDateStrings.add(dateStr);
    }
  });

  const today = new Date();

  // Sum practice time for the viewed month
  const monthDurationSeconds = conversations.reduce((acc, conv) => {
    if (conv.started_at) {
      const d = new Date(conv.started_at);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        return acc + (conv.duration_seconds || 0);
      }
    }
    return acc;
  }, 0);

  const monthMinutes = Math.round(monthDurationSeconds / 60);
  const monthTimeLabel = monthMinutes >= 60 
    ? `${Math.round(monthMinutes / 60)}h`
    : `${monthMinutes}m`;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getPracticeMins = (day: number, m: number, y: number) => {
    const secs = conversations.reduce((acc, conv) => {
      if (conv.started_at) {
        const d = new Date(conv.started_at);
        if (d.getDate() === day && d.getMonth() === m && d.getFullYear() === y)
          return acc + (conv.duration_seconds || 0);
      }
      return acc;
    }, 0);
    return Math.round(secs / 60);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <button
          onClick={handlePrevMonth}
          style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)', borderRadius: 8, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
        >
          <ChevronLeft size={13} style={{ color: 'var(--text-muted)' }} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', margin: 0, textTransform: 'capitalize' }}>{monthName}</p>
        </div>
        <button
          onClick={handleNextMonth}
          style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)', borderRadius: 8, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
        >
          <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      {/* Weekday header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: 4 }}>
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em', padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {calendarSlots.map((cell, idx) => {
          let y = currentYear;
          let m = currentMonth + cell.monthOffset;
          if (m < 0) { m = 11; y = currentYear - 1; }
          else if (m > 11) { m = 0; y = currentYear + 1; }

          const dateStr = `${y}-${m}-${cell.day}`;
          const active = activeDateStrings.has(dateStr);
          const isToday = today.getDate() === cell.day && today.getMonth() === m && today.getFullYear() === y;
          const mins = getPracticeMins(cell.day, m, y);
          const timeLabel = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : mins > 0 ? `${mins}m` : '0m';

          // Intensity level
          let bg = 'transparent';
          let textColor = cell.isCurrentMonth ? 'var(--text-primary)' : 'var(--border-mid)';
          let border = 'none';
          let shadow = 'none';
          let fontWeight: number = 400;

          const isFuture = new Date(y, m, cell.day) > today;

          if (active && !isFuture) {
            if (mins < 5)        { bg = 'rgba(124,92,255,0.18)'; textColor = 'var(--accent-purple)'; }
            else if (mins < 15)  { bg = 'rgba(124,92,255,0.35)'; textColor = 'var(--accent-purple)'; }
            else if (mins < 30)  { bg = 'rgba(124,92,255,0.60)'; textColor = '#fff'; }
            else                 { bg = 'var(--accent-purple)'; textColor = '#fff'; shadow = '0 0 6px rgba(124,92,255,0.3)'; }
            fontWeight = 700;
          }
          if (isToday) {
            border = '1.5px solid var(--accent-amber)';
            if (!active) { textColor = 'var(--accent-amber)'; fontWeight = 700; }
          }

          return (
            <div
              key={`day-${idx}`}
              className="relative group"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              {/* Tooltip */}
              {cell.isCurrentMonth && (
                <div
                  className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max scale-0 rounded-lg z-[60] whitespace-nowrap transition-all duration-150 group-hover:scale-100"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '5px 10px', fontSize: 11, color: 'var(--text-primary)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
                >
                  <span style={{ fontWeight: 700 }}>{cell.day}/{m + 1}</span>
                  {' · '}
                  <span style={{ color: active ? 'var(--accent-purple2)' : 'var(--text-muted)' }}>{timeLabel}</span>
                  {isToday && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--accent-amber)', fontWeight: 700 }}>● {t('profilePage.hoje', { defaultValue: 'Hoje' })}</span>}
                </div>
              )}
              <div style={{
                width: '100%', aspectRatio: '1', maxWidth: 32, maxHeight: 32,
                borderRadius: 7,
                background: bg,
                border,
                boxShadow: shadow,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight,
                color: textColor,
                transition: 'all 0.15s',
                cursor: cell.isCurrentMonth ? 'default' : 'default',
              }}>
                {cell.day}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { bg: 'rgba(124,92,255,0.18)', label: '' },
            { bg: 'rgba(124,92,255,0.35)', label: '' },
            { bg: 'rgba(124,92,255,0.60)', label: '' },
            { bg: 'var(--accent-purple)', label: '' },
          ].map((s, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: s.bg }} />
          ))}
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginLeft: 2 }}>{t('profilePage.menos', { defaultValue: 'menos' })}</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
          <span style={{ color: 'var(--accent-purple2)', fontWeight: 800 }}>{monthTimeLabel}</span> {t('profilePage.praticados', { defaultValue: 'praticados' }).toLowerCase()}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const MyProfile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, updateUser } = useUser();
  const {
    totalXp, level, levelLabel, progress, xpToNextLevel, isMaxLevel,
    currentLevelXp, levelXpRange,
  } = useGamification();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'progress' | 'history' | 'badges'>('badges');
  const [showSettings, setShowSettings] = useState(false);
  const [showLearningSettings, setShowLearningSettings] = useState(false);
  const [passwordActionLoading, setPasswordActionLoading] = useState(false);
  const [passwordActionMessage, setPasswordActionMessage] = useState('');
  const [passwordActionStatus, setPasswordActionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [passwordActionDevLink, setPasswordActionDevLink] = useState('');
  const [dailyResetReminderEnabled, setDailyResetReminderEnabled] = useState(isResetReminderEnabled);
  const localOnlyFeaturesEnabled = isLocalOnlyFeatureEnabled();

  useEffect(() => {
    const openSettingsForTour = () => {
      setShowLearningSettings(false);
      setShowSettings(true);
    };
    window.addEventListener('flowspeak:open-profile-settings', openSettingsForTour);
    const showOverviewForTour = () => {
      setShowLearningSettings(false);
      setShowSettings(false);
    };
    window.addEventListener('flowspeak:show-profile-overview', showOverviewForTour);
    return () => {
      window.removeEventListener('flowspeak:open-profile-settings', openSettingsForTour);
      window.removeEventListener('flowspeak:show-profile-overview', showOverviewForTour);
    };
  }, []);

  const handleDailyResetReminderToggle = () => {
    setDailyResetReminderEnabled(prev => {
      const next = !prev;
      setResetReminderEnabled(next);
      return next;
    });
  };

  // States for onboarding editing
  const [editLevel, setEditLevel] = useState<string>('');
  const [editNativeLanguage, setEditNativeLanguage] = useState<string>('');
  const [editDailyGoal, setEditDailyGoal] = useState<string>('');
  const [editGoals, setEditGoals] = useState<string[]>([]);
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  useEffect(() => {
    if (user) {
      setEditLevel(user.level || '');
      setEditNativeLanguage(user.nativeLanguage || '');
      setEditDailyGoal(user.dailyGoal || 'Boost');
      setEditGoals(user.goals || []);
    }
  }, [user, showSettings, showLearningSettings]);

  const handleEditGoalToggle = (goal: string) => {
    setEditGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleSaveOnboarding = async () => {
    if (!user) return;
    setIsSavingOnboarding(true);
    try {
      const onboardingData = {
        name: user.name,
        englishLevel: editLevel,
        goals: editGoals,
        nativeLanguage: editNativeLanguage,
        interfaceLanguage: user.interfaceLanguage || 'native',
        dailyGoal: editDailyGoal
      };
      await authService.saveOnboarding(onboardingData);
    } catch (error) {
      console.warn('[MyProfile] Backend saveOnboarding failed (possibly offline or unauthorized), updating locally:', error);
    }

    try {
      updateUser({
        ...user,
        level: editLevel as any,
        goals: editGoals as any,
        nativeLanguage: editNativeLanguage as any,
        dailyGoal: editDailyGoal as any
      });
      setShowSettings(true);
      setShowLearningSettings(false);
    } catch (error) {
      console.error('Failed to update local user state:', error);
      alert('Erro ao salvar as configurações localmente.');
    } finally {
      setIsSavingOnboarding(false);
    }
  };

  const handlePasswordEmailRequest = async () => {
    if (!user?.email) {
      setPasswordActionMessage(t('profilePage.passwordAccess.noEmail', { defaultValue: 'Nao encontramos um email nesta conta.' }));
      setPasswordActionStatus('error');
      return;
    }

    setPasswordActionLoading(true);
    setPasswordActionMessage('');
    setPasswordActionStatus('idle');
    setPasswordActionDevLink('');

    try {
      const response = await authService.forgotPassword(user.email);
      setPasswordActionMessage(response.message || t('profilePage.passwordAccess.emailSent', { defaultValue: 'Se o email estiver cadastrado, enviaremos as instrucoes.' }));
      setPasswordActionStatus('success');
      if (response.resetUrl) {
        setPasswordActionDevLink(response.resetUrl);
      }
    } catch (err: any) {
      console.error('[MyProfile] Password email request failed:', err);
      const timeoutMessage = err?.code === 'ECONNABORTED'
        ? t('profilePage.passwordAccess.timeout', { defaultValue: 'A requisicao demorou demais. Verifique o SMTP da API local e tente novamente.' })
        : t('profilePage.passwordAccess.error', { defaultValue: 'Nao foi possivel enviar o email agora.' });
      setPasswordActionMessage(timeoutMessage);
      setPasswordActionStatus('error');
    } finally {
      setPasswordActionLoading(false);
    }
  };
  const [achievementsPage, setAchievementsPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [statsTab, setStatsTab] = useState<'tempo' | 'modalidades' | 'consistencia'>('consistencia');
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
    date: Date;
    text: number;
    voice: number;
    avatar: number;
    total: number;
  } | null>(null);
  const [consistencyView, setConsistencyView] = useState<'heatmap' | 'calendar'>('heatmap');
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLanguageChange = () => {
    const newLang = i18n.language?.startsWith('en') ? 'pt' : 'en';
    i18n.changeLanguage(newLang);
  };

  // Dynamic calculations based on real conversation logs
  const getStreakAndActiveDays = () => {
    if (conversations.length === 0) return { activeDaysList: [] as number[] };

    const activeDates = new Set<string>();
    conversations.forEach(conv => {
      if (conv.started_at) {
        activeDates.add(new Date(conv.started_at).toDateString());
      }
    });

    const sortedDates = Array.from(activeDates)
      .map(d => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    if (sortedDates.length === 0) return { activeDaysList: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const activeDaysList = sortedDates
      .filter(d => d.getMonth() === currentMonth && d.getFullYear() === currentYear)
      .map(d => d.getDate());

    return { activeDaysList };
  };

  const { activeDaysList } = getStreakAndActiveDays();
  const { streakDays } = useGamification();
  const activeDaysThisMonth = activeDaysList.length;
  const activityStats = useMemo(() => {
    const toLocalDateKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const activeDateKeys = Array.from(new Set(
      conversations
        .filter(conv => conv.started_at)
        .map(conv => {
          const date = new Date(conv.started_at);
          date.setHours(0, 0, 0, 0);
          return toLocalDateKey(date);
        })
    )).sort();

    let bestStreak = 0;
    let currentStreak = 0;
    let previousTime: number | null = null;

    activeDateKeys.forEach((dateKey) => {
      const time = new Date(`${dateKey}T00:00:00`).getTime();
      if (previousTime !== null && time - previousTime === 24 * 60 * 60 * 1000) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
      bestStreak = Math.max(bestStreak, currentStreak);
      previousTime = time;
    });

    return {
      activeDaysTotal: activeDateKeys.length,
      bestStreak,
    };
  }, [conversations]);

  // Sum total practice time
  const totalDurationSeconds = conversations.reduce((acc, conv) => acc + (conv.duration_seconds || 0), 0);
  const totalMinutes = Math.round(totalDurationSeconds / 60);
  const totalTimeLabel = totalMinutes >= 60 
    ? `${Math.round(totalMinutes / 60)}h`
    : `${totalMinutes}m`;
  const dailyGoalMinutes = useMemo(() => {
    switch (user.dailyGoal) {
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
  }, [user.dailyGoal]);
  const dailyGoalLabel = i18n.language?.startsWith('en')
    ? `${dailyGoalMinutes} min/day`
    : `${dailyGoalMinutes} min/dia`;
  const allTimeModalityTotals = conversations.reduce(
    (acc, conv) => {
      const durationMinutes = (conv.duration_seconds || 0) / 60;
      if (conv.category === 'avatar') {
        acc.avatar += durationMinutes;
      } else if (conv.category === 'voice-only' || conv.scenario === 'free-conversation') {
        acc.voice += durationMinutes;
      } else {
        acc.text += durationMinutes;
      }
      return acc;
    },
    { text: 0, voice: 0, avatar: 0 },
  );
  const primaryModality = [
    { key: 'text', value: allTimeModalityTotals.text, label: t('profilePage.distributionText', { defaultValue: 'Texto' }) },
    { key: 'voice', value: allTimeModalityTotals.voice, label: t('profilePage.distributionVoice', { defaultValue: 'Voz' }) },
    { key: 'avatar', value: allTimeModalityTotals.avatar, label: t('profilePage.distributionAvatar', { defaultValue: 'Avatar' }) },
  ].sort((a, b) => b.value - a.value)[0];
  const primaryModalityLabel = primaryModality.value > 0
    ? primaryModality.label
    : t('profilePage.noDataShort', { defaultValue: '-' });

  // Dynamic Achievements List based on user's real stats
  const achievementsList = [
    { id: 1, Icon: Zap, title: t('gamification.badges.xp-first.title', { defaultValue: 'Primeira Prática' }), desc: t('gamification.badges.xp-first.description', { defaultValue: 'Ganhou seu primeiro XP' }), earned: totalXp > 0 },
    { id: 2, Icon: Award, title: 'Mestre da Trilha', desc: 'Praticou na Trilha Vida Real', earned: conversations.some(c => c.category === 'real-life') },
    { id: 3, Icon: Bot, title: 'Astro do Avatar', desc: 'Praticou com o Avatar virtual', earned: conversations.some(c => c.category === 'avatar') },
    { id: 4, Icon: Mic, title: 'Foco na Voz', desc: 'Praticou com Chat de Voz', earned: conversations.some(c => c.category === 'voice-only' || c.scenario === 'free-conversation') },
    { id: 5, Icon: Flame, title: t('gamification.badges.level-2.title', { defaultValue: 'Explorador' }), desc: t('gamification.badges.level-2.description', { defaultValue: 'Chegou ao Nível 2' }), earned: level >= 2 },
    { id: 6, Icon: Clock, title: t('gamification.badges.time-1h.title', { defaultValue: '1h Prática' }), desc: t('gamification.badges.time-1h.description', { defaultValue: '1 hora no total' }), earned: totalMinutes >= 60 },
    { id: 7, Icon: Target, title: t('gamification.badges.level-3.title', { defaultValue: 'Fluente' }), desc: t('gamification.badges.level-3.description', { defaultValue: 'Chegou ao Nível 3' }), earned: level >= 3 },
    { id: 8, Icon: MessageCircle, title: t('gamification.badges.streak-3d.title', { defaultValue: 'Firme e Forte' }), desc: t('gamification.badges.streak-3d.description', { defaultValue: 'Ofensiva de 3 dias' }), earned: streakDays >= 3 },
  ];

  const ITEMS_PER_PAGE = 8;
  const startIndex = achievementsPage * ITEMS_PER_PAGE;
  const paginatedAchievements = achievementsList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const totalPages = Math.ceil(achievementsList.length / ITEMS_PER_PAGE);

  // Dynamic Weekly Stacked Chart Data (Monday to Sunday)
  const getWeeklyChartData = () => {
    const daysOfWeek = [
      t('profilePage.weekdays.0', { defaultValue: 'Seg' }),
      t('profilePage.weekdays.1', { defaultValue: 'Ter' }),
      t('profilePage.weekdays.2', { defaultValue: 'Qua' }),
      t('profilePage.weekdays.3', { defaultValue: 'Qui' }),
      t('profilePage.weekdays.4', { defaultValue: 'Sex' }),
      t('profilePage.weekdays.5', { defaultValue: 'Sáb' }),
      t('profilePage.weekdays.6', { defaultValue: 'Dom' }),
    ];

    const getSegIndex = (date: Date) => {
      const day = date.getDay();
      return day === 0 ? 6 : day - 1;
    };

    const weeklyData = daysOfWeek.map(name => ({
      name,
      avatar: 0,
      voice: 0,
      text: 0,
    }));

    const now = new Date();
    const currentMonday = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    currentMonday.setDate(diff);
    currentMonday.setHours(0, 0, 0, 0);

    const currentSunday = new Date(currentMonday);
    currentSunday.setDate(currentMonday.getDate() + 6);
    currentSunday.setHours(23, 59, 59, 999);

    conversations.forEach(conv => {
      const convDate = new Date(conv.started_at);
      if (convDate >= currentMonday && convDate <= currentSunday) {
        const dayIndex = getSegIndex(convDate);
        const durationMinutes = Math.round((conv.duration_seconds || 0) / 60 * 10) / 10;

        if (conv.category === 'avatar') {
          weeklyData[dayIndex].avatar += durationMinutes;
        } else if (conv.category === 'voice-only' || conv.scenario === 'free-conversation') {
          weeklyData[dayIndex].voice += durationMinutes;
        } else if (conv.category === 'real-life') {
          weeklyData[dayIndex].text += durationMinutes;
        }
      }
    });

    return weeklyData;
  };

  const chartData = getWeeklyChartData().map(d => ({
    ...d,
    avatar: Math.round(d.avatar * 10) / 10,
    voice: Math.round(d.voice * 10) / 10,
    text: Math.round(d.text * 10) / 10,
  }));

  const getHeatmapData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() + mondayOffset);
    thisMonday.setHours(0, 0, 0, 0);

    const weeks: { date: Date; text: number; voice: number; avatar: number; isFuture: boolean; isToday: boolean }[][] = [];

    for (let w = 11; w >= 0; w--) {
      const week: { date: Date; text: number; voice: number; avatar: number; isFuture: boolean; isToday: boolean }[] = [];
      const weekMonday = new Date(thisMonday);
      weekMonday.setDate(thisMonday.getDate() - w * 7);

      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(weekMonday);
        cellDate.setDate(weekMonday.getDate() + d);

        const isFuture = cellDate > today;
        const isTodayCell = cellDate.getTime() === today.getTime();

        let text = 0, voice = 0, avatar = 0;
        if (!isFuture) {
          conversations.forEach(conv => {
            if (conv.started_at) {
              const convDate = new Date(conv.started_at);
              convDate.setHours(0, 0, 0, 0);
              if (convDate.getTime() === cellDate.getTime()) {
                const durationMinutes = (conv.duration_seconds || 0) / 60;
                if (conv.category === 'avatar') {
                  avatar += durationMinutes;
                } else if (conv.category === 'voice-only' || conv.scenario === 'free-conversation') {
                  voice += durationMinutes;
                } else if (conv.category === 'real-life') {
                  text += durationMinutes;
                }
              }
            }
          });
        }

        week.push({
          date: cellDate,
          text: Math.round(text * 10) / 10,
          voice: Math.round(voice * 10) / 10,
          avatar: Math.round(avatar * 10) / 10,
          isFuture,
          isToday: isTodayCell
        });
      }
      weeks.push(week);
    }
    return weeks;
  };

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  const loadConversations = async () => {
    const userId = getUserId(user);
    setLoadingConversations(true);
    try {
      const data = await conversationService.getAllConversations(userId, 1000, {
        plan: user?.activePlan?.type,
        isTrial: user?.isInTrial,
      });
      setConversations(data);
    } catch (err) {
      console.error('[MyProfile] Error loading conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Computed values for stats tabs
  const weeklyTotals = chartData.map(d => d.avatar + d.voice + d.text);
  const totalWeeklyMinutes = weeklyTotals.reduce((a, b) => a + b, 0);
  const weeklyTarget = dailyGoalMinutes * 7;
  const weeklyProgressPct = Math.min(100, Math.round((totalWeeklyMinutes / weeklyTarget) * 100));
  const weeklyMinutesLeft = Math.max(0, weeklyTarget - totalWeeklyMinutes);
  const daysBatidos = weeklyTotals.filter(t => t >= dailyGoalMinutes).length;
  const bestDayMinutes = Math.max(...weeklyTotals, 0);

  const totalText = chartData.reduce((acc, d) => acc + d.text, 0);
  const totalVoice = chartData.reduce((acc, d) => acc + d.voice, 0);
  const totalAvatar = chartData.reduce((acc, d) => acc + d.avatar, 0);
  const grandTotal = totalText + totalVoice + totalAvatar || 1;
  const textPct = Math.round((totalText / grandTotal) * 100);
  const voicePct = Math.round((totalVoice / grandTotal) * 100);
  const avatarPct = Math.round((totalAvatar / grandTotal) * 100);

  const heatmapWeeks = getHeatmapData();

  // Group columns (weeks) by month to render clean labels spanning them on top
  const headerCols: { label: string; colSpan: number }[] = [];
  heatmapWeeks.forEach((week) => {
    const firstDate = week[0].date;
    const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = i18n.language === 'en' ? MONTHS_EN[firstDate.getMonth()] : MONTHS_PT[firstDate.getMonth()];
    
    if (headerCols.length === 0 || headerCols[headerCols.length - 1].label !== monthName) {
      headerCols.push({ label: monthName, colSpan: 1 });
    } else {
      headerCols[headerCols.length - 1].colSpan += 1;
    }
  });

  if (!user) return null;

  const firstName = user.name?.split(' ')[0] ?? user.name;

  const userLevelStr = (user.level as string) || '';

  const levelLocalized = i18n.language?.startsWith('en')
    ? userLevelStr.replace(/\s*\(.*\)/, '')
    : userLevelStr.includes('Beginner') || userLevelStr.includes('Iniciante') ? 'Iniciante'
    : userLevelStr.includes('Elementary') || userLevelStr.includes('Básico') ? 'Básico'
    : userLevelStr.includes('Intermediate') || userLevelStr.includes('Intermediário') ? 'Intermediário'
    : userLevelStr.includes('Upper') ? 'Intermediário Superior'
    : userLevelStr.includes('Advanced') || userLevelStr.includes('Avançado') ? 'Avançado'
    : userLevelStr.includes('Proficient') || userLevelStr.includes('Fluente') ? 'Fluente'
    : userLevelStr || 'Intermediário';



  // ── Configurações: tela separada (estilo original) ──
  if (showSettings) {
    if (showLearningSettings) {
      const dailyGoalOptions = [
        { id: 'Spark', icon: Zap,    label: 'Spark', desc: t('onboarding.dailyGoals.SparkMinutes', { defaultValue: '3 min / dia' }),  color: '#f59e0b' },
        { id: 'Flow',  icon: Clock,   label: 'Flow',  desc: t('onboarding.dailyGoals.FlowMinutes', { defaultValue: '10 min / dia' }), color: '#06b6d4' },
        { id: 'Boost', icon: Target,  label: 'Boost', desc: t('onboarding.dailyGoals.BoostMinutes', { defaultValue: '20 min / dia' }), color: '#8b5cf6' },
        { id: 'Surge', icon: Flame,   label: 'Surge', desc: t('onboarding.dailyGoals.SurgeMinutes', { defaultValue: '30 min / dia' }), color: '#ef4444' },
      ];

      return (
        <div className="bv-page animate-fade-up px-4 md:px-8 py-6 pb-24 w-full max-w-2xl mx-auto flex flex-col gap-6">
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr) 40px', alignItems: 'center', columnGap: 12, marginBottom: 24 }}>
            <button
              onClick={() => { setShowLearningSettings(false); setShowLanguagePicker(false); }}
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-primary)'
              }}
            >
              <ChevronLeft size={20} />
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, textAlign: 'center', lineHeight: 1.2 }}>
              {t('profilePage.editLearningSettings.title', { defaultValue: 'Configurações de Aprendizado' })}
            </h1>
            <div style={{ width: 40 }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Nível de Inglês */}
            <div>
              <p className="bv-section-label" style={{ marginBottom: 10 }}>{t('profilePage.editLearningSettings.englishLevel', { defaultValue: 'Nível de Inglês' })}</p>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
                {ENGLISH_LEVELS.map((lvl, idx) => {
                  const active = editLevel === lvl;
                  const label = lvl === 'Beginner' ? t('profilePage.editLearningSettings.levels.Beginner', { defaultValue: 'Iniciante' }) : lvl === 'Intermediate' ? t('profilePage.editLearningSettings.levels.Intermediate', { defaultValue: 'Intermediário' }) : t('profilePage.editLearningSettings.levels.Advanced', { defaultValue: 'Avançado' });
                  const desc  = lvl === 'Beginner' ? t('profilePage.editLearningSettings.levels.BeginnerDesc', { defaultValue: 'Conhecimento básico do idioma' }) : lvl === 'Intermediate' ? t('profilePage.editLearningSettings.levels.IntermediateDesc', { defaultValue: 'Me comunico no dia a dia' }) : t('profilePage.editLearningSettings.levels.AdvancedDesc', { defaultValue: 'Converso com fluência natural' });
                  const Icon  = lvl === 'Beginner' ? Star : lvl === 'Intermediate' ? Zap : Crown;
                  return (
                    <div key={lvl} onClick={() => setEditLevel(lvl)} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 16px', cursor: 'pointer', transition: 'background 0.15s',
                      borderBottom: idx < ENGLISH_LEVELS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      background: active ? 'rgba(124,92,255,0.06)' : 'transparent'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: active ? 'rgba(124,92,255,0.15)' : 'var(--bg-card-alt)',
                          border: `1px solid ${active ? 'rgba(124,92,255,0.3)' : 'var(--border-subtle)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
                        }}>
                          <Icon size={14} color={active ? 'var(--accent-purple2)' : 'var(--text-muted)'} />
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: active ? 'var(--accent-purple2)' : 'var(--text-primary)', margin: 0 }}>{label}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{desc}</p>
                        </div>
                      </div>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: active ? '2px solid var(--accent-purple)' : '2px solid var(--border-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
                      }}>
                        {active && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-purple)' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Idioma Nativo */}
            <div>
              <p className="bv-section-label" style={{ marginBottom: 10 }}>{t('profilePage.editLearningSettings.nativeLanguage', { defaultValue: 'Idioma Nativo' })}</p>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
                {/* Trigger row */}
                <div onClick={() => setShowLanguagePicker(p => !p)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 16px', cursor: 'pointer', transition: 'background 0.15s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Languages size={16} color="var(--text-secondary)" />
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{t('profilePage.editLearningSettings.selectedLanguage', { defaultValue: 'Idioma selecionado' })}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {t(`onboarding.languages.${editNativeLanguage}`, { defaultValue: editNativeLanguage })}
                    </span>
                    <ChevronRight size={16} color="var(--text-muted)" style={{ transform: showLanguagePicker ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </div>
                </div>
                {/* Expandable list */}
                {showLanguagePicker && (
                  <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    {LANGUAGES.map((lang, idx) => {
                      const active = editNativeLanguage === lang;
                      return (
                        <div key={lang} onClick={() => { setEditNativeLanguage(lang as any); setShowLanguagePicker(false); }} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px 16px', cursor: 'pointer', transition: 'background 0.15s',
                          borderBottom: idx < LANGUAGES.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                          background: active ? 'rgba(124,92,255,0.08)' : 'var(--bg-card-alt)'
                        }}>
                          <span style={{ fontSize: 14, fontWeight: active ? 600 : 400, color: active ? 'var(--accent-purple2)' : 'var(--text-primary)' }}>
                            {t(`onboarding.languages.${lang}`, { defaultValue: lang })}
                          </span>
                          {active && <Check size={14} color="var(--accent-purple)" strokeWidth={2.5} />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Meta Diária */}
            <div>
              <p className="bv-section-label" style={{ marginBottom: 10 }}>{t('profilePage.editLearningSettings.dailyGoal', { defaultValue: 'Meta Diária de Prática' })}</p>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
                {dailyGoalOptions.map(({ id, icon: GoalIcon, label, desc, color }, idx) => {
                  const active = editDailyGoal === id;
                  return (
                    <div key={id} onClick={() => setEditDailyGoal(id as any)} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 16px', cursor: 'pointer', transition: 'background 0.15s',
                      borderBottom: idx < dailyGoalOptions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      background: active ? 'rgba(124,92,255,0.06)' : 'transparent'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: active ? `${color}22` : 'var(--bg-card-alt)',
                          border: `1px solid ${active ? color + '55' : 'var(--border-subtle)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
                        }}>
                          <GoalIcon size={14} color={active ? color : 'var(--text-muted)'} />
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: active ? 'var(--accent-purple2)' : 'var(--text-primary)', margin: 0 }}>{label}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{desc}</p>
                        </div>
                      </div>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: active ? '2px solid var(--accent-purple)' : '2px solid var(--border-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
                      }}>
                        {active && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-purple)' }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Objetivos */}
            <div>
              <p className="bv-section-label" style={{ marginBottom: 10 }}>{t('profilePage.editLearningSettings.learningGoals', { defaultValue: 'Objetivos de Aprendizado' })}</p>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
                {LEARNING_GOALS.map((goal, idx) => {
                  const active = editGoals.includes(goal);
                  return (
                    <div key={goal} onClick={() => handleEditGoalToggle(goal)} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 16px', cursor: 'pointer', transition: 'background 0.15s',
                      borderBottom: idx < LEARNING_GOALS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      background: active ? 'rgba(124,92,255,0.06)' : 'transparent'
                    }}>
                      <span style={{ fontSize: 14, fontWeight: active ? 600 : 400, color: active ? 'var(--accent-purple2)' : 'var(--text-primary)' }}>
                        {t(`onboarding.goals.${goal}`, { defaultValue: goal })}
                      </span>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        border: active ? 'none' : '2px solid var(--border-subtle)',
                        background: active ? 'var(--accent-purple)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
                      }}>
                        {active && <Check size={12} strokeWidth={3} color="#fff" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Salvar */}
            <button
              type="button"
              disabled={isSavingOnboarding}
              onClick={handleSaveOnboarding}
              style={{
                width: '100%', padding: '14px', borderRadius: 16, fontSize: 15, fontWeight: 800,
                background: 'var(--accent-purple)', color: '#fff', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(124,92,255,0.25)', transition: 'all 0.2s',
                opacity: isSavingOnboarding ? 0.7 : 1
              }}
            >
              {isSavingOnboarding ? t('profilePage.editLearningSettings.saving', { defaultValue: 'Salvando...' }) : t('profilePage.editLearningSettings.saveChanges', { defaultValue: 'Salvar Alterações' })}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bv-page animate-fade-up px-4 md:px-8 py-6 pb-24 w-full max-w-2xl mx-auto flex flex-col gap-6">
        <div style={{ display: 'grid', gridTemplateColumns: '40px minmax(0, 1fr) 40px', alignItems: 'center', columnGap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setShowSettings(false)}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-primary)'
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, textAlign: 'center', lineHeight: 1.2 }}>{t('profilePage.settings', { defaultValue: 'Configurações' })}</h1>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Detalhes da conta */}
          <div>
            <p className="bv-section-label" style={{ marginBottom: 10 }}>{t('profilePage.accountDetails', { defaultValue: 'Detalhes da conta' })}</p>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 16, display: 'flex', flexDirection: 'column'
            }}>
              {[
                { label: t('profilePage.fieldName', { defaultValue: 'Nome' }), value: user.name },
                { label: t('profilePage.fieldEmail', { defaultValue: 'E-mail' }), value: user.email || `${user.name.toLowerCase().replace(/\s+/g, '')}@email.com` },
              ].map((item, idx) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 16px',
                    borderBottom: idx < 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Configurações de Aprendizado (Onboarding Link) */}
          {localOnlyFeaturesEnabled && (
          <div>
            <p className="bv-section-label" style={{ marginBottom: 10 }}>
              {t('profilePage.passwordAccess.title', { defaultValue: 'Acesso e senha' })}
            </p>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 16,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(124,92,255,0.12)',
                  border: '1px solid rgba(124,92,255,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <KeyRound size={16} style={{ color: 'var(--accent-purple2)' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {user.hasPassword === false
                      ? t('profilePage.passwordAccess.createTitle', { defaultValue: 'Criar senha para esta conta' })
                      : t('profilePage.passwordAccess.resetTitle', { defaultValue: 'Redefinir senha' })}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, lineHeight: 1.45, color: 'var(--text-muted)' }}>
                    {user.hasPassword === false
                      ? t('profilePage.passwordAccess.createDesc', { defaultValue: 'Sua conta pode continuar entrando com Google e tambem receber uma senha para login por email.' })
                      : t('profilePage.passwordAccess.resetDesc', { defaultValue: 'Enviaremos um link para seu email para criar uma nova senha.' })}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={passwordActionLoading || !user.email}
                onClick={handlePasswordEmailRequest}
                style={{
                  width: '100%',
                  minHeight: 42,
                  borderRadius: 12,
                  border: '1px solid rgba(124,92,255,0.32)',
                  background: 'rgba(124,92,255,0.10)',
                  color: 'var(--accent-purple2)',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: passwordActionLoading || !user.email ? 'not-allowed' : 'pointer',
                  opacity: passwordActionLoading || !user.email ? 0.65 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <Mail size={14} />
                {passwordActionLoading
                  ? t('profilePage.passwordAccess.sending', { defaultValue: 'Enviando...' })
                  : user.hasPassword === false
                    ? t('profilePage.passwordAccess.createButton', { defaultValue: 'Enviar link para criar senha' })
                    : t('profilePage.passwordAccess.resetButton', { defaultValue: 'Enviar link de redefinicao' })}
              </button>

              {passwordActionMessage && (
                <div style={{
                  margin: 0,
                  fontSize: 12,
                  lineHeight: 1.45,
                  color: passwordActionStatus === 'error' ? '#fecaca' : '#a7f3d0',
                  background: passwordActionStatus === 'error' ? 'rgba(239,68,68,0.10)' : 'rgba(20,184,166,0.10)',
                  border: passwordActionStatus === 'error' ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(20,184,166,0.25)',
                  borderRadius: 10,
                  padding: '10px 12px'
                }}>
                  {passwordActionMessage}
                </div>
              )}

              {passwordActionDevLink && (
                <a
                  href={passwordActionDevLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, color: 'var(--accent-purple2)', fontWeight: 700, wordBreak: 'break-all' }}
                >
                  {passwordActionDevLink}
                </a>
              )}
            </div>
          </div>
          )}

          {localOnlyFeaturesEnabled && (
          <div>
            <p className="bv-section-label" style={{ marginBottom: 10 }}>
              {t('profilePage.notifications.title', { defaultValue: 'Notificacoes' })}
            </p>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 16,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(124,92,255,0.12)',
                  border: '1px solid rgba(124,92,255,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bell size={16} style={{ color: 'var(--accent-purple2)' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {t('profilePage.notifications.dailyResetTitle', { defaultValue: 'Aviso de reset diario' })}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, lineHeight: 1.45, color: 'var(--text-muted)' }}>
                    {dailyResetReminderEnabled
                      ? t('profilePage.notifications.dailyResetOn', { defaultValue: 'Ao entrar, mostramos quanto tempo falta para renovar seus limites diarios.' })
                      : t('profilePage.notifications.dailyResetOff', { defaultValue: 'O aviso de tempo ate o reset diario esta desativado.' })}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={dailyResetReminderEnabled}
                onClick={handleDailyResetReminderToggle}
                style={{
                  width: 52,
                  height: 30,
                  borderRadius: 999,
                  border: 'none',
                  padding: 3,
                  background: dailyResetReminderEnabled ? 'var(--accent-purple)' : 'rgba(148,163,184,0.28)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: dailyResetReminderEnabled ? 'flex-end' : 'flex-start',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                title={dailyResetReminderEnabled
                  ? t('profilePage.notifications.disableDailyReset', { defaultValue: 'Desativar aviso de reset diario' })
                  : t('profilePage.notifications.enableDailyReset', { defaultValue: 'Ativar aviso de reset diario' })}
              >
                <span style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
                }} />
              </button>
            </div>
          </div>
          )}

          <div id="tour-learning-settings">
            <p className="bv-section-label" style={{ marginBottom: 10 }}>{t('profilePage.learningSection', { defaultValue: 'Aprendizado' })}</p>
            <div
              onClick={() => setShowLearningSettings(true)}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                borderRadius: 16, padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={16} color="var(--text-secondary)" />
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{t('profilePage.learningSettings', { defaultValue: 'Configurações de Aprendizado' })}</span>
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </div>
          </div>

          {/* Idioma do aplicativo */}
          <div id="tour-language-settings">
            <p className="bv-section-label" style={{ marginBottom: 10 }}>{t('profilePage.appLanguage', { defaultValue: 'Idioma do aplicativo' })}</p>
            <div
              onClick={handleLanguageChange}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                borderRadius: 16, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={16} color="var(--text-secondary)" />
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{t('profilePage.languageSelected', { defaultValue: 'Selecionado' })}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-primary)', fontSize: 14 }}>
                <span>{i18n.language?.startsWith('en') ? 'English' : 'Português'}</span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            </div>
          </div>

          {/* Tema do aplicativo */}
          <div id="tour-theme-settings">
            <p className="bv-section-label" style={{ marginBottom: 10 }}>{t('profilePage.appTheme', { defaultValue: 'Tema do aplicativo' })}</p>
            <div
              onClick={toggleTheme}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                borderRadius: 16, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {theme === 'light' ? <Sun size={16} color="var(--text-secondary)" /> : <Moon size={16} color="var(--text-secondary)" />}
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{t('profilePage.selectedTheme', { defaultValue: 'Tema selecionado' })}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-primary)', fontSize: 14 }}>
                <span>{theme === 'light' ? t('profilePage.themeLight', { defaultValue: 'Claro' }) : t('profilePage.themeDark', { defaultValue: 'Escuro' })}</span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            </div>
          </div>

          {/* Gerenciamento da conta */}
          <div id="tour-account-settings">
            <p className="bv-section-label" style={{ marginBottom: 10 }}>{t('profilePage.accountManagement', { defaultValue: 'Gerenciamento da conta' })}</p>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>


              {(user?.activePlan || user?.isInTrial) && (
                <button
                  onClick={async () => {
                    try {
                      window.location.href = await createBillingPortalSession();
                    } catch (err) {
                      console.error('Error opening billing portal:', err);
                      alert('Erro ao abrir o portal de assinatura.');
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '14px 16px', background: 'none', border: 'none',
                    borderBottom: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer', textAlign: 'left', width: '100%'
                  }}
                >
                  <Crown size={16} color="#a855f7" />
                  <span className="font-semibold text-purple-400">Gerenciar assinatura</span>
                </button>
              )}

              {import.meta.env.DEV && (
                <Link
                  to="/usage-dashboard"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '14px 16px', background: 'none', borderBottom: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer', textDecoration: 'none', width: '100%'
                  }}
                >
                  <Activity size={16} color="var(--text-secondary)" />
                  <span>Monitoramento de uso</span>
                </Link>
              )}

              <button
                onClick={() => {
                  setShowSettings(false);
                  restartFeatureTour();
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', background: 'none', border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer', textAlign: 'left', width: '100%'
                }}
              >
                <Star size={16} color="var(--text-secondary)" />
                <span>Reiniciar Tutorial do App</span>
              </button>

              <button
                onClick={logout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', background: 'none', border: 'none',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer', textAlign: 'left', width: '100%'
                }}
              >
                <LogOut size={16} color="var(--text-secondary)" />
                <span>{t('profilePage.logoutLabel', { defaultValue: 'Sair' })}</span>
              </button>
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', background: 'none', border: 'none',
                  color: '#ef4444', fontSize: 14, cursor: 'pointer', textAlign: 'left', width: '100%'
                }}
              >
                <Trash2 size={16} color="#ef4444" />
                <span>{t('profilePage.deleteAccount', { defaultValue: 'Excluir conta' })}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="tour-profile-overview" className="bv-page animate-fade-up px-4 md:px-6 py-4 pb-24 w-full max-w-6xl mx-auto flex flex-col gap-4">

      {/* ── FULL WIDTH LAYOUT BODY ── */}
      <div className="flex flex-col gap-4 w-full">

        {/* Title + Settings cog — igual à main */}
        <div className="flex justify-between items-center w-full">
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {t('profilePage.yourProfile', { defaultValue: 'Seu perfil' })}
          </h1>
          <button
            id="tour-profile-settings-button"
            onClick={() => setShowSettings(true)}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-secondary)'
            }}
            title={t('profilePage.settings', { defaultValue: 'Configurações' })}
          >
            <Settings size={18} />
          </button>
        </div>

        {/* PROFILE HEADER (Olá, user!) */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px 0 12px', textAlign: 'center', gap: 12
        }}>
          {/* Avatar Crown Icon */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--accent-purple)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(124,92,255,0.3)',
            border: '2px solid rgba(255,255,255,0.1)'
          }}>
            <Crown size={36} color="#fff" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Olá, {user.name}!
            </h2>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-purple2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {levelLocalized}
            </span>
          </div>

          <div style={{ display: 'flex', itemsCenter: 'center', gap: 12, fontSize: 13, fontWeight: 700 }}>
            <span style={{ color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={14} fill="var(--accent-amber)" /> {totalXp} XP
            </span>
            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Flame size={14} fill="#ef4444" /> {streakDays} dias
            </span>
          </div>
        </div>



        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full items-stretch">
          
          {/* Left Column: 3/5 width */}
          <div className="flex flex-col gap-6 lg:col-span-3 h-full">
            {/* STAT GRID */}
            <div className="grid grid-cols-3 gap-3 w-full">
              <div className="bv-stat-card p-3 flex flex-col items-center justify-center">
                <p className="bv-stat-value" style={{ color: 'var(--accent-purple2)', fontSize: 18 }}>{level}</p>
                <p className="bv-stat-label" style={{ fontSize: 12 }}>{t('gamification.level', { defaultValue: 'Nível' })}</p>
              </div>
              <div className="bv-stat-card p-3 flex flex-col items-center justify-center">
                <p className="bv-stat-value" style={{ color: 'var(--accent-amber)', fontSize: 18 }}>{totalXp}</p>
                <p className="bv-stat-label" style={{ fontSize: 12 }}>{t('profilePage.xpTotalLabel', { defaultValue: 'XP Total' })}</p>
              </div>
              <div className="bv-stat-card p-3 flex flex-col items-center justify-center">
                <p className="bv-stat-value" style={{ color: 'var(--accent-teal)', fontSize: 18 }}>{totalTimeLabel}</p>
                <p className="bv-stat-label" style={{ fontSize: 12 }}>{t('profilePage.totalTimeShort', { defaultValue: 'Tempo Total' })}</p>
              </div>
            </div>

            {/* TABBED PERFORMANCE & CONSISTENCY DASHBOARD */}
            <div className="bv-card p-4 flex flex-col gap-4 heatmap-card-container" style={{ position: 'relative', flex: 1 }}>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={18} style={{ color: 'var(--text-secondary)' }} />
                  {t('profilePage.dashboardTitle', { defaultValue: 'Desempenho & Hábitos' })}
                </p>
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-base)', padding: 3, borderRadius: 8 }}>
                  {(['tempo', 'modalidades', 'consistencia'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setStatsTab(tab)}
                      style={{
                        minHeight: 40,
                        padding: '8px 12px',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: 'none',
                        background: statsTab === tab ? 'var(--accent-purple)' : 'transparent',
                        color: statsTab === tab ? '#fff' : 'var(--text-secondary)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tab === 'tempo'
                        ? t('profilePage.tabTime', { defaultValue: 'Tempo' })
                        : tab === 'modalidades'
                        ? t('profilePage.tabModalities', { defaultValue: 'Modalidades' })
                        : t('profilePage.consistencia', { defaultValue: 'Consistência' })}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB VIEW: TEMPO */}
              {statsTab === 'tempo' && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{t('profilePage.dailyPractice', { defaultValue: 'Prática diária' })}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('profilePage.dailyPracticeGoal', { goal: dailyGoalLabel, defaultValue: `meta: ${dailyGoalLabel}` })}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {chartData.map((d, i) => {
                      const total = d.avatar + d.voice + d.text;
                      const maxWeeklyMinutes = Math.max(...weeklyTotals, 30);
                      const pct = Math.min(100, (total / maxWeeklyMinutes) * 100);
                      const isHit = total >= dailyGoalMinutes;
                      const targetPct = (dailyGoalMinutes / maxWeeklyMinutes) * 100;
                      return (
                        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 14, color: 'var(--text-secondary)', width: 36, flexShrink: 0, fontWeight: 600 }}>{d.name}</span>
                          <div style={{ flex: 1, height: 20, background: 'var(--bg-card-alt)', borderRadius: 4, position: 'relative', overflow: 'visible' }}>
                            <div style={{
                              height: '100%',
                              borderRadius: 4,
                              width: `${pct}%`,
                              background: isHit ? 'var(--accent-teal)' : 'var(--accent-purple)',
                              transition: 'width 0.3s ease'
                            }} />
                            {/* Daily goal marker */}
                            <div style={{
                              position: 'absolute',
                              top: -2,
                              bottom: -2,
                              left: `${targetPct}%`,
                              width: 2,
                              background: 'var(--accent-amber)',
                              opacity: 0.8,
                              zIndex: 10
                            }} title={i18n.language?.startsWith('en') ? `Goal: ${dailyGoalLabel}` : `Meta: ${dailyGoalLabel}`} />
                          </div>
                          <span style={{ fontSize: 14, color: 'var(--text-secondary)', width: 46, textAlign: 'right', flexShrink: 0, fontWeight: 600 }}>
                            {total > 0 ? `${Math.round(total)}m` : '—'}
                          </span>
                          <span style={{ width: 16, display: 'flex', justifyContent: 'center' }}>
                            {isHit && <Check size={16} className="text-green-500" strokeWidth={3} />}
                          </span>
                        </div>
                      );
                    })}
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      <span style={{ color: 'var(--accent-amber)', fontWeight: 'bold' }}>|</span> {t('profilePage.yellowLineHelp', { goal: dailyGoalLabel, defaultValue: `linha amarela representa a meta diária de ${dailyGoalLabel}` }).replace(/^\|\s*/, '')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3" style={{ marginTop: 16 }}>
                    <div style={{ background: 'var(--bg-card-alt)', borderRadius: 12, padding: '14px 16px' }}>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{t('profilePage.weeklyProgress', { defaultValue: 'Progresso semanal' })}</p>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                        <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-purple2)' }}>{Math.round(totalWeeklyMinutes)}</span>
                        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>/ {weeklyTarget} min</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg-base)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-amber))', width: `${weeklyProgressPct}%`, borderRadius: 99 }} />
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                        {weeklyProgressPct}% — {Math.round(weeklyMinutesLeft)} {t('profilePage.minutesRemaining', { defaultValue: 'min restantes' })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div style={{ background: 'var(--bg-card-alt)', borderRadius: 12, padding: '12px 16px', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('profilePage.daysGoalHit', { defaultValue: 'Dias batidos' })}</span>
                        <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--accent-teal)' }}>{daysBatidos}</span>
                      </div>
                      <div style={{ background: 'var(--bg-card-alt)', borderRadius: 12, padding: '12px 16px', flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('profilePage.bestDay', { defaultValue: 'Melhor dia' })}</span>
                        <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--accent-amber)' }}>{Math.round(bestDayMinutes)}m</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB VIEW: MODALIDADES */}
              {statsTab === 'modalidades' && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{t('profilePage.howYouPracticed', { defaultValue: 'Como você praticou' })}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('profilePage.distributionByActivity', { defaultValue: 'Distribuição por atividade' })}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {chartData.map((d) => {
                      const total = d.avatar + d.voice + d.text;
                      const maxDayTotal = Math.max(...weeklyTotals, 1);
                      const tPct = (d.text / maxDayTotal) * 100;
                      const vPct = (d.voice / maxDayTotal) * 100;
                      const aPct = (d.avatar / maxDayTotal) * 100;
                      return (
                        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 14, color: 'var(--text-secondary)', width: 36, flexShrink: 0, fontWeight: 600 }}>{d.name}</span>
                          <div style={{ flex: 1, height: 22, background: 'var(--bg-card-alt)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                            {d.text > 0 && <div style={{ width: `${tPct}%`, background: 'var(--accent-purple)' }} title={`Texto: ${d.text}m`} />}
                            {d.voice > 0 && <div style={{ width: `${vPct}%`, background: '#3b82f6', marginLeft: d.text > 0 ? 1 : 0 }} title={`Voz: ${d.voice}m`} />}
                            {d.avatar > 0 && <div style={{ width: `${aPct}%`, background: 'var(--accent-amber)', marginLeft: (d.text > 0 || d.voice > 0) ? 1 : 0 }} title={`Avatar: ${d.avatar}m`} />}
                          </div>
                          <span style={{ fontSize: 14, color: 'var(--text-secondary)', width: 46, textAlign: 'right', flexShrink: 0, fontWeight: 600 }}>
                            {total > 0 ? `${Math.round(total)}m` : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ background: 'var(--bg-card-alt)', borderRadius: 12, padding: '16px 20px', marginTop: 8 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{t('profilePage.totalSessionsDistribution', { defaultValue: 'Distribuição total das sessões' })}</p>
                    <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
                      {totalText > 0 && <div style={{ width: `${textPct}%`, background: 'var(--accent-purple)' }} />}
                      {totalVoice > 0 && <div style={{ width: `${voicePct}%`, background: '#3b82f6' }} />}
                      {totalAvatar > 0 && <div style={{ width: `${avatarPct}%`, background: 'var(--accent-amber)' }} />}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 18px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-purple)' }} />
                        {t('profilePage.distributionText', { defaultValue: 'Texto' })}: {Math.round(totalText)}m ({textPct}%)
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6' }} />
                        {t('profilePage.distributionVoice', { defaultValue: 'Voz' })}: {Math.round(totalVoice)}m ({voicePct}%)
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-amber)' }} />
                        {t('profilePage.distributionAvatar', { defaultValue: 'Avatar' })}: {Math.round(totalAvatar)}m ({avatarPct}%)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB VIEW: CONSISTÊNCIA / HEATMAP */}
              {statsTab === 'consistencia' && (
                <div className="flex flex-col gap-4 animate-fade-in">

                  {/* ── HERO METRICS: 3 KPIs destacados ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {/* Sequência atual */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(251,146,60,0.12) 0%, rgba(239,68,68,0.07) 100%)',
                      border: '1px solid rgba(251,146,60,0.35)',
                      borderRadius: 12,
                      padding: '10px 8px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      position: 'relative', overflow: 'hidden'
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(251,146,60,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 1 }}>
                        <Flame size={15} style={{ color: '#fb923c' }} className="animate-pulse" />
                      </div>
                      <span style={{ fontSize: 24, fontWeight: 900, color: '#fb923c', lineHeight: 1 }}>{streakDays}</span>
                      <span style={{ fontSize: 11, color: '#fb923c', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0, textAlign: 'center' }}>{t('profilePage.diasSeguidos', { defaultValue: 'Dias Seguidos' })}</span>
                    </div>

                    {/* Meta semanal */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(124,92,255,0.12) 0%, rgba(139,92,246,0.07) 100%)',
                      border: '1px solid rgba(124,92,255,0.35)',
                      borderRadius: 12,
                      padding: '10px 8px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      position: 'relative', overflow: 'hidden'
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(124,92,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 1 }}>
                        <Target size={15} style={{ color: 'var(--accent-purple)' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                        <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-purple)', lineHeight: 1 }}>{daysBatidos}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(139,92,246,0.6)' }}>/7</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--accent-purple)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0, textAlign: 'center' }}>{t('profilePage.metaSemanal', { defaultValue: 'Meta Semanal' })}</span>
                    </div>

                    {/* Consistência */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(20,184,166,0.12) 0%, rgba(6,182,212,0.07) 100%)',
                      border: '1px solid rgba(20,184,166,0.35)',
                      borderRadius: 12,
                      padding: '10px 8px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      position: 'relative', overflow: 'hidden'
                    }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(20,184,166,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 1 }}>
                        <Zap size={15} style={{ color: 'var(--accent-teal)' }} />
                      </div>
                      <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-teal)', lineHeight: 1 }}>{Math.min(100, Math.round((daysBatidos / 7) * 100))}%</span>
                      <span style={{ fontSize: 11, color: 'var(--accent-teal)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0, textAlign: 'center' }}>{t('profilePage.consistencia', { defaultValue: 'Consistência' })}</span>
                    </div>
                  </div>

                  {/* ── WEEKLY 7-DOT PROGRESS ── */}
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex', flexDirection: 'column', gap: 8
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Target size={14} style={{ color: 'var(--accent-purple2)' }} />
                        {t('profilePage.metaSemanalSubtitle', { defaultValue: 'Meta desta semana' })}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: daysBatidos >= 7 ? 'var(--accent-teal)' : 'var(--text-primary)' }}>
                        {daysBatidos >= 7 ? <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Check size={13} strokeWidth={3} /> {t('profilePage.completa', { defaultValue: 'Completa!' })}</span> : `${daysBatidos} / 7 ${t('profilePage.diasLabel', { defaultValue: 'dias' })}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d, i) => {
                        const hit = i < daysBatidos;
                        const isLast = i === daysBatidos - 1 && hit;
                        const weekdayLabel = t('profilePage.weekdays.' + i, { defaultValue: d }).charAt(0);
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <div style={{
                              width: '100%',
                              height: 7,
                              borderRadius: 99,
                              background: hit ? 'linear-gradient(90deg, var(--accent-purple), var(--accent-purple2))' : 'rgba(255,255,255,0.06)',
                              boxShadow: isLast ? '0 0 10px rgba(124,92,255,0.6)' : 'none',
                              transition: 'background 0.3s ease'
                            }} />
                            <span style={{ fontSize: 12, color: hit ? 'var(--accent-purple2)' : 'var(--text-muted)', fontWeight: 700 }}>{weekdayLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── HEATMAP PANEL ── */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(124,92,255,0.05) 0%, rgba(20,184,166,0.03) 100%)',
                    border: '1px solid rgba(124,92,255,0.10)',
                    borderRadius: 16,
                    padding: '14px 12px 10px',
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        <Star size={ Star.name === 'Star' ? 14 : 14 } style={{ color: 'var(--accent-amber)' }} />
                        {consistencyView === 'calendar' ? t('profilePage.activityCalendar', { defaultValue: 'Calendário de atividade' }) : t('profilePage.weeklyPerformance', { defaultValue: '12 semanas de atividade' })}
                      </span>
                      {/* View toggle */}
                      <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <button
                          onClick={() => setConsistencyView('heatmap')}
                          style={{
                            minHeight: 40, padding: '8px 12px', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                            background: consistencyView === 'heatmap' ? 'var(--accent-purple)' : 'transparent',
                            color: consistencyView === 'heatmap' ? '#fff' : 'var(--text-secondary)',
                            transition: 'all 0.15s ease'
                          }}
                        >{t('profilePage.grade', { defaultValue: 'Grade' })}</button>
                        <button
                          onClick={() => setConsistencyView('calendar')}
                          style={{
                            minHeight: 40, padding: '8px 12px', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
                            background: consistencyView === 'calendar' ? 'var(--accent-purple)' : 'transparent',
                            color: consistencyView === 'calendar' ? '#fff' : 'var(--text-secondary)',
                            transition: 'all 0.15s ease'
                          }}
                        >{t('profilePage.calendario', { defaultValue: 'Calendário' })}</button>
                      </div>
                    </div>

                    {consistencyView === 'heatmap' ? (
                      <>
                        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
                          <table style={{ borderCollapse: 'separate', borderSpacing: '3px', margin: '0 auto' }}>
                            <thead>
                              <tr>
                                <th style={{ width: 26 }}></th>
                                {headerCols.map((col, idx) => (
                                  <th
                                    key={`month-hdr-${idx}`}
                                    colSpan={col.colSpan}
                                    style={{
                                      fontSize: 11,
                                      color: col.label ? 'var(--accent-purple2)' : 'transparent',
                                      fontWeight: 800,
                                      textAlign: 'left',
                                      paddingBottom: 6,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.07em'
                                    }}
                                  >
                                    {col.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                                const daysNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
                                const weekdayLabel = t('profilePage.weekdays.' + dayOffset, { defaultValue: daysNames[dayOffset] }).slice(0, 3);
                                return (
                                  <tr key={`day-row-${dayOffset}`}>
                                    <td style={{
                                      fontSize: 11,
                                      color: 'var(--text-muted)',
                                      textAlign: 'right',
                                      paddingRight: 7,
                                      height: 18,
                                      whiteSpace: 'nowrap',
                                      verticalAlign: 'middle',
                                      fontWeight: 600,
                                      userSelect: 'none' as const
                                    }}>
                                      {weekdayLabel}
                                    </td>
                                    {heatmapWeeks.map((week, wIdx) => {
                                      const cell = week[dayOffset];
                                      const totalPractice = cell.text + cell.voice + cell.avatar;

                                      let cellColor = 'var(--bg-card-alt)';
                                      if (totalPractice > 0 && !cell.isFuture) {
                                        if (totalPractice < 3) cellColor = 'rgba(124,92,255,0.20)';
                                        else if (totalPractice < 10) cellColor = 'rgba(124,92,255,0.42)';
                                        else if (totalPractice < 20) cellColor = 'rgba(124,92,255,0.65)';
                                        else if (totalPractice < 30) cellColor = 'rgba(124,92,255,0.85)';
                                        else cellColor = 'rgba(124,92,255,1)';
                                      }

                                      const isGoalHit = totalPractice >= dailyGoalMinutes && !cell.isFuture;

                                      return (
                                        <td key={`cell-${wIdx}-${dayOffset}`} style={{ padding: 0 }}>
                                          <div
                                            onMouseEnter={(e) => {
                                              const rect = e.currentTarget.getBoundingClientRect();
                                              const container = e.currentTarget.closest('.heatmap-card-container');
                                              if (container) {
                                                const containerRect = container.getBoundingClientRect();
                                                setHoveredCell({
                                                  x: rect.left - containerRect.left + rect.width / 2,
                                                  y: rect.top - containerRect.top,
                                                  date: cell.date,
                                                  text: cell.text,
                                                  voice: cell.voice,
                                                  avatar: cell.avatar,
                                                  total: totalPractice
                                                });
                                              }
                                            }}
                                            onMouseLeave={() => setHoveredCell(null)}
                                            style={{
                                              width: 16,
                                              height: 16,
                                              borderRadius: 3,
                                              background: cell.isFuture ? 'var(--bg-base)' : cellColor,
                                              opacity: cell.isFuture ? 0.3 : 1,
                                              cursor: cell.isFuture ? 'default' : 'pointer',
                                              outline: cell.isToday ? '2px solid var(--accent-amber)' : 'none',
                                              outlineOffset: cell.isToday ? '1px' : '0px',
                                              display: 'block',
                                              transition: 'transform 0.12s ease',
                                              boxShadow: isGoalHit ? '0 0 5px rgba(124,92,255,0.45)' : 'none'
                                            }}
                                            onMouseOver={(e) => { if (!cell.isFuture) (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.45)'; }}
                                            onMouseOut={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
                                          />
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{t('profilePage.menos', { defaultValue: 'Menos' })}</span>
                          {['var(--bg-card-alt)', 'rgba(124,92,255,0.20)', 'rgba(124,92,255,0.42)', 'rgba(124,92,255,0.65)', 'rgba(124,92,255,0.85)', 'rgba(124,92,255,1)'].map((bg, i) => (
                            <span key={i} style={{ width: 12, height: 12, borderRadius: 2, background: bg, display: 'inline-block', border: '1px solid rgba(255,255,255,0.05)' }} />
                          ))}
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{t('profilePage.mais', { defaultValue: 'Mais' })}</span>
                          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent-amber)', fontWeight: 700 }}>
                            <span style={{ width: 12, height: 12, borderRadius: 2, border: '2px solid var(--accent-amber)', display: 'inline-block' }} /> {t('profilePage.hoje', { defaultValue: 'Hoje' })}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="animate-fade-in">
                        <ActivityCalendar conversations={conversations} totalTimeLabel={totalTimeLabel} />
                      </div>
                    )}
                  </div>

                  {/* ── STATS ROW: 3 mini-cards ── */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      { icon: Flame, label: t('profilePage.melhor', { defaultValue: 'Melhor' }), sub: t('profilePage.sequencia', { defaultValue: 'sequência' }), value: `${activityStats.bestStreak}d`, color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.30)' },
                      { icon: Trophy, label: t('profilePage.praticados', { defaultValue: 'Praticados' }), sub: t('profilePage.total', { defaultValue: 'total' }), value: `${activityStats.activeDaysTotal}d`, color: 'var(--accent-purple)', bg: 'rgba(124,92,255,0.12)', border: 'rgba(124,92,255,0.30)' },
                      { icon: Clock, label: t('profilePage.estudado', { defaultValue: 'Estudado' }), sub: t('profilePage.acumulado', { defaultValue: 'acumulado' }), value: totalTimeLabel, color: 'var(--accent-teal)', bg: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.30)' },
                    ].map(({ icon: Icon, label, sub, value, color, bg, border }) => (
                      <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <Icon size={16} style={{ color }} />
                        <span style={{ fontSize: 18, fontWeight: 900, color, lineHeight: 1, marginTop: 2 }}>{value}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>{label}</span>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', opacity: 0.8, textTransform: 'lowercase', marginTop: -2 }}>{sub}</span>
                      </div>
                    ))}
                  </div>

                  {/* Floating Tooltip */}
                  {hoveredCell && (
                    <div style={{
                      position: 'absolute',
                      left: hoveredCell.x,
                      top: hoveredCell.y,
                      transform: 'translate(-50%, -100%)',
                      marginTop: -8,
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-mid)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      fontSize: 11,
                      color: 'var(--text-primary)',
                      zIndex: 100,
                      width: 170,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                      pointerEvents: 'none',
                      lineHeight: 1.4
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: 5 }}>
                        {hoveredCell.date.toLocaleDateString(i18n.language || 'pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </div>
                      {hoveredCell.total > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.7 }}>{t('profilePage.distributionText', { defaultValue: 'Texto' })}:</span><span>{Math.round(hoveredCell.text)}m</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.7 }}>{t('profilePage.distributionVoice', { defaultValue: 'Voz' })}:</span><span>{Math.round(hoveredCell.voice)}m</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.7 }}>{t('profilePage.distributionAvatar', { defaultValue: 'Avatar' })}:</span><span>{Math.round(hoveredCell.avatar)}m</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', marginTop: 4, paddingTop: 4, fontWeight: 700 }}>
                            <span>{t('profilePage.total', { defaultValue: 'Total' })}:</span><span>{Math.round(hoveredCell.total)}m</span>
                          </div>
                          {hoveredCell.total >= dailyGoalMinutes ? (
                            <div style={{ color: 'var(--accent-teal)', fontSize: 10, marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><Check size={10} strokeWidth={3} /> {t('profilePage.goalAchieved', { defaultValue: 'Meta batida!' })}</div>
                          ) : (
                            <div style={{ color: 'var(--accent-purple2)', fontSize: 10, marginTop: 4, fontWeight: 600 }}>{t('profilePage.goalRemainingHelp', { minutes: Math.max(0, dailyGoalMinutes - Math.round(hoveredCell.total)), defaultValue: '{{minutes}}m para a meta' })}</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ opacity: 0.6 }}>{t('profilePage.noPractice', { defaultValue: 'Sem prática registrada' })}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Learning Preferences — 2/5 width */}
          <div className="flex flex-col lg:col-span-2 gap-4">
            {/* SEÇÃO DE ASSINATURA */}
            <div id="tour-profile-subscription" className="bv-card p-6 flex flex-col gap-4">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <Crown size={16} style={{ color: '#a855f7' }} />
                  {t('profilePage.subscriptionBilling', { defaultValue: 'Assinatura & Faturamento' })}
                </h3>
                {user?.isInTrial && user?.trialEndDate && (
                  <div style={{ background: 'rgba(236,72,153,0.15)', color: '#ec4899', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                    {t('plansPage.daysRemaining', { count: Math.max(0, Math.ceil((new Date(user.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{t('profilePage.planStatus', { defaultValue: 'Status do plano:' })}</span>
                  <span style={{ fontWeight: 800, color: '#a855f7' }}>
                    {user?.activePlan
                      ? `${user.activePlan.type.toUpperCase()} (${user.activePlan.cycle === 'annual' ? t('plansPage.annual', { defaultValue: 'Anual' }) : t('plansPage.monthly', { defaultValue: 'Mensal' })})`
                      : user?.isInTrial
                        ? t('profilePage.freeTrial', { defaultValue: 'Teste Grátis (Trial)' })
                        : t('profilePage.freePlan', { defaultValue: 'Plano Gratuito' })}
                  </span>
                </div>

                {(user?.activePlan || user?.isInTrial) ? (
                  <button
                    onClick={async () => {
                      try {
                        window.location.href = await createBillingPortalSession();
                      } catch (err) {
                        console.error('Error opening billing portal:', err);
                        alert(t('profilePage.stripeError', { defaultValue: 'Erro ao abrir o portal de assinatura.' }));
                      }
                    }}
                    className="bv-btn-primary"
                    style={{
                      width: '100%',
                      height: 40,
                      background: 'linear-gradient(90deg, #7c5cff, #ec4899)',
                      color: 'white',
                      fontWeight: 800,
                      border: 'none',
                      borderRadius: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontSize: 12
                    }}
                  >
                    <Crown size={12} />
                    {t('profilePage.manageStripe', { defaultValue: 'Gerenciar assinatura' })}
                  </button>
                ) : (
                  <Link
                    to="/plans"
                    className="bv-btn-secondary"
                    style={{
                      width: '100%',
                      height: 40,
                      background: 'rgba(124,92,255,0.1)',
                      border: '1px solid rgba(124,92,255,0.3)',
                      borderRadius: 12,
                      color: 'var(--accent-purple2)',
                      fontWeight: 700,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none'
                    }}
                  >
                    {t('profilePage.viewPlansUpgrade', { defaultValue: 'Ver planos e fazer upgrade' })}
                  </Link>
                )}
              </div>
            </div>

            {/* PROFILE PREFERENCES CARD */}
            <div className="bv-card p-6 flex flex-col gap-4">
              {/* Header with settings button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <Settings size={16} style={{ color: 'var(--text-secondary)' }} />
                  {t('profilePage.learningSettings', { defaultValue: 'Configurações de Aprendizado' })}
                </h3>
                <button
                  onClick={() => {
                    setShowSettings(true);
                    setShowLearningSettings(true);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border-subtle)', borderRadius: 8,
                    minHeight: 40, padding: '8px 12px', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4,
                    flexShrink: 0
                  }}
                  title={t('profilePage.settings', { defaultValue: 'Configurações' })}
                >
                  <Settings size={12} /> Editar
                </button>
              </div>

              {/* English Level */}
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.06em' }}>
                  {t('profilePage.englishLevel', { defaultValue: 'Nível de Inglês' })}
                </p>
                <div style={{
                  background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)',
                  borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600
                }}>
                  {levelLocalized}
                </div>
              </div>

              {/* Native Language */}
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.06em' }}>
                  {t('profilePage.nativeLanguage', { defaultValue: 'Idioma Nativo' })}
                </p>
                <div style={{
                  background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)',
                  borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600
                }}>
                  {t(`onboarding.languages.${user.nativeLanguage}`, { defaultValue: user.nativeLanguage })}
                </div>
              </div>

              {/* Daily goal */}
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.06em' }}>
                  {t('profilePage.dailyGoalQuestion', { defaultValue: 'Meta Diária de Prática' })}
                </p>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.15)',
                  borderRadius: 10, padding: '12px 14px', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600
                }}>
                  <span>{user.dailyGoal || 'Boost'}</span>
                  <span style={{ fontSize: 12, color: 'var(--accent-purple2)', background: 'rgba(124,92,255,0.15)', padding: '4px 10px', borderRadius: 99, fontWeight: 700 }}>
                    {user.dailyGoal === 'Spark' ? '3 min / dia' : user.dailyGoal === 'Flow' ? '10 min / dia' : user.dailyGoal === 'Surge' ? '30 min / dia' : '20 min / dia'}
                  </span>
                </div>
              </div>

              {/* Learning goals list */}
              {user.goals && user.goals.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.06em' }}>
                    {t('profilePage.learningGoals', { defaultValue: 'Objetivo' })}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {user.goals.map(goal => (
                      <div key={goal} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: 'var(--bg-card-alt)', borderRadius: 10, padding: '10px 14px',
                        border: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--text-secondary)'
                      }}>
                        <Check size={14} strokeWidth={3} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
                        <span>{t(`onboarding.goals.${goal}`, { defaultValue: goal })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estatísticas Gerais */}
              <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.06em' }}>
                  {t('profilePage.generalStats', { defaultValue: 'Estatísticas Gerais' })}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  {[
                    {
                      label: t('profilePage.activeDaysStat', { defaultValue: 'Dias ativos' }),
                      value: `${activeDaysThisMonth}${t('profilePage.diasLabelShort', { defaultValue: 'd' })}`,
                      color: 'var(--accent-amber)',
                      Icon: Activity,
                    },
                    {
                      label: t('profilePage.weeklyGoalStat', { defaultValue: 'Meta semanal' }),
                      value: `${weeklyProgressPct}%`,
                      color: 'var(--accent-purple2)',
                      Icon: Target,
                    },
                    {
                      label: t('profilePage.mainFocusStat', { defaultValue: 'Foco principal' }),
                      value: primaryModalityLabel,
                      color: 'var(--accent-teal)',
                      Icon: BarChart2,
                    },
                  ].map(stat => (
                    <div key={stat.label} style={{
                      background: 'var(--bg-card-alt)', border: '1px solid var(--border-subtle)',
                      borderRadius: 12, padding: '16px 8px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
                    }}>
                      <stat.Icon size={20} style={{ color: stat.color }} />
                      <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, textAlign: 'center' }}>{stat.value}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Multi-Tab (Achievements/Conquistas + Session History) */}
        <div className="w-full">
          <div className="bv-card p-6 flex flex-col gap-6">
            {/* TABS SELECTOR */}
            <div className="bv-tab-pill w-full flex">
              {/* History is temporarily hidden from the profile UI. Keep the code below ready to re-enable. */}
              {(['badges'] as const).map(tab => (
                <button
                  key={tab}
                  className={`bv-tab-btn ${activeTab === tab ? 'active' : ''}`}
                  style={{ flex: '1 1 0', minWidth: 0 }}
                  onClick={() => setActiveTab(tab)}
                >
                  {t('gamification.achievementsTitle', { defaultValue: 'Conquistas' })}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            <div>
              {/* Conquistas */}
              {activeTab === 'badges' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="grid grid-cols-4 gap-3">
                    {paginatedAchievements.map((ach) => (
                      <motion.div
                        key={ach.id}
                        whileTap={{ scale: 0.95 }}
                        className="rounded-2xl p-2 flex flex-col items-center justify-center gap-1 border cursor-pointer"
                        style={{
                          background: ach.earned ? 'var(--bg-card-alt)' : 'var(--bg-base)',
                          borderColor: 'var(--border-subtle)',
                          opacity: ach.earned ? 1 : 0.4,
                          aspectRatio: '1 / 1'
                        }}
                        data-testid={`achievement-${ach.id}`}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: ach.earned ? 'rgba(245,158,11,0.15)' : 'var(--bg-card-alt)' }}>
                          <ach.Icon className="w-4 h-4" style={{ color: ach.earned ? 'var(--accent-amber)' : 'var(--text-muted)' }} />
                        </div>
                        <p className="text-[10px] font-bold text-center leading-tight" style={{ color: 'var(--text-primary)' }}>{ach.title}</p>
                        {ach.earned && <Check className="w-3 h-3 text-green-400 flex-shrink-0" />}
                      </motion.div>
                    ))}
                  </div>

                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                      <button
                        onClick={() => setAchievementsPage(prev => Math.max(0, prev - 1))}
                        disabled={achievementsPage === 0}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border"
                        style={{
                          background: 'var(--bg-card-alt)',
                          borderColor: 'var(--border-subtle)',
                          color: achievementsPage === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                          cursor: achievementsPage === 0 ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4
                        }}
                      >
                        <ChevronLeft size={12} />
                        <span>{t('common.prev', { defaultValue: 'Anterior' })}</span>
                      </button>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                        {achievementsPage + 1} / {totalPages}
                      </span>
                      <button
                        onClick={() => setAchievementsPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={achievementsPage === totalPages - 1}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border"
                        style={{
                          background: 'var(--bg-card-alt)',
                          borderColor: 'var(--border-subtle)',
                          color: achievementsPage === totalPages - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                          cursor: achievementsPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: 4
                        }}
                      >
                        <span>{t('common.next', { defaultValue: 'Próximo' })}</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Histórico */}
              {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {loadingConversations ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        border: '3px solid var(--accent-purple)',
                        borderTopColor: 'transparent',
                        animation: 'spin 0.7s linear infinite',
                      }} />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <MessageCircle size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        {t('profilePage.noConversations', { defaultValue: 'Sem conversas ainda. Comece a praticar!' })}
                      </p>
                    </div>
                  ) : (() => {
                    const HIST_PER_PAGE = 5;
                    const histTotalPages = Math.ceil(conversations.length / HIST_PER_PAGE);
                    const pagedConvs = conversations.slice(
                      historyPage * HIST_PER_PAGE,
                      historyPage * HIST_PER_PAGE + HIST_PER_PAGE
                    );
                    return (
                      <>
                        {pagedConvs.map(conv => (
                          <ConversationItem
                            key={conv.id}
                            id={conv.id}
                            scenario={conv.scenario}
                            startedAt={conv.started_at}
                            durationSeconds={conv.duration_seconds || 0}
                            messageCount={conv.message_count ?? 0}
                          />
                        ))}
                        {histTotalPages > 1 && (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 8 }}>
                            <button
                              onClick={() => setHistoryPage(prev => Math.max(0, prev - 1))}
                              disabled={historyPage === 0}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border"
                              style={{
                                background: 'var(--bg-card-alt)', borderColor: 'var(--border-subtle)',
                                color: historyPage === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                                cursor: historyPage === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <ChevronLeft size={12} />
                              <span>{t('common.prev', { defaultValue: 'Anterior' })}</span>
                            </button>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                              {historyPage + 1} / {histTotalPages}
                            </span>
                            <button
                              onClick={() => setHistoryPage(prev => Math.min(histTotalPages - 1, prev + 1))}
                              disabled={historyPage === histTotalPages - 1}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border"
                              style={{
                                background: 'var(--bg-card-alt)', borderColor: 'var(--border-subtle)',
                                color: historyPage === histTotalPages - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                                cursor: historyPage === histTotalPages - 1 ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <span>{t('common.next', { defaultValue: 'Próximo' })}</span>
                              <ChevronRight size={12} />
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;

