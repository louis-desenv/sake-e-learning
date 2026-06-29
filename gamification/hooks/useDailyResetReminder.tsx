import React, { useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Clock } from 'lucide-react';

const TOAST_ID = 'flowspeak-reset-reminder-toast';
const SESSION_OPEN_KEY = 'flowspeak_reset_open_hint_shown';
export const RESET_REMINDER_ENABLED_KEY = 'flowspeak_reset_reminder_enabled';
export const RESET_REMINDER_SETTINGS_EVENT = 'flowspeak:reset-reminder-settings-changed';
const CLOSE_DELAY_MS = 4200;
const CHECK_INTERVAL_MS = 60_000;
const REMINDER_THRESHOLDS = [60, 15, 5];

type ResetReminderOptions = {
    enabled?: boolean;
    nextResetTimeUtc?: string | null;
    userId?: string | null;
};

export const isResetReminderEnabled = () => {
    if (typeof localStorage === 'undefined') return true;
    return localStorage.getItem(RESET_REMINDER_ENABLED_KEY) !== 'false';
};

export const setResetReminderEnabled = (enabled: boolean) => {
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem(RESET_REMINDER_ENABLED_KEY, enabled ? 'true' : 'false');
    }

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(RESET_REMINDER_SETTINGS_EVENT, { detail: { enabled } }));
    }
};

const isEnglish = () =>
    typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en');

const getBrazilDateParts = () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());

    const valueFor = (type: string) => Number(parts.find(part => part.type === type)?.value);
    return {
        year: valueFor('year'),
        month: valueFor('month'),
        day: valueFor('day'),
    };
};

const getNextBrazilReset = () => {
    const { year, month, day } = getBrazilDateParts();
    const brazilTodayMidnightUtc = new Date(
        `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00-03:00`
    );
    brazilTodayMidnightUtc.setUTCDate(brazilTodayMidnightUtc.getUTCDate() + 1);
    return brazilTodayMidnightUtc;
};

const getResetDate = (nextResetTimeUtc?: string | null) => {
    if (nextResetTimeUtc) {
        const parsed = new Date(nextResetTimeUtc);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }

    return getNextBrazilReset();
};

const getMinutesUntilReset = (nextResetTimeUtc?: string | null) => {
    const diffMs = getResetDate(nextResetTimeUtc).getTime() - Date.now();
    return Math.max(0, Math.floor(diffMs / 60_000));
};

const formatTimeLeft = (minutes: number) => {
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (isEnglish()) {
            return remainingMinutes > 0
                ? `${hours}h ${remainingMinutes}m`
                : `${hours}h`;
        }

        return remainingMinutes > 0
            ? `${hours}h ${remainingMinutes}min`
            : `${hours}h`;
    }

    return isEnglish()
        ? `${minutes} min`
        : `${minutes} min`;
};

const ResetToast: React.FC<{ minutesLeft: number; tone: 'soft' | 'urgent' }> = ({ minutesLeft, tone }) => {
    const title = isEnglish() ? 'Daily reset' : 'Reset diário';
    const description = isEnglish()
        ? `Your daily limits renew in ${formatTimeLeft(minutesLeft)}.`
        : `Seus limites diários renovam em ${formatTimeLeft(minutesLeft)}.`;

    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                position: 'fixed',
                right: 16,
                bottom: 16,
                zIndex: 9999,
                width: 'min(360px, calc(100vw - 32px))',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 16,
                border: tone === 'urgent'
                    ? '1px solid rgba(168,85,247,0.38)'
                    : '1px solid rgba(148,163,184,0.16)',
                background: 'rgba(18, 19, 28, 0.94)',
                color: '#f8fafc',
                boxShadow: '0 18px 55px rgba(0,0,0,0.28)',
                backdropFilter: 'blur(12px)',
                pointerEvents: 'none',
            }}
        >
            <span
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: '#c084fc',
                    background: 'rgba(124,92,255,0.14)',
                    border: '1px solid rgba(124,92,255,0.22)',
                }}
            >
                <Clock size={18} strokeWidth={2.4} />
            </span>
            <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>
                    {title}
                </span>
                <span style={{ display: 'block', marginTop: 3, fontSize: 12, lineHeight: 1.35, color: '#c4bdd8' }}>
                    {description}
                </span>
            </span>
        </div>
    );
};

const showResetToast = (minutesLeft: number, tone: 'soft' | 'urgent') => {
    if (typeof document === 'undefined') return;

    document.getElementById(TOAST_ID)?.remove();

    const toastEl = document.createElement('div');
    toastEl.id = TOAST_ID;
    document.body.appendChild(toastEl);

    let root: Root | null = createRoot(toastEl);
    root.render(<ResetToast minutesLeft={minutesLeft} tone={tone} />);

    window.setTimeout(() => {
        root?.unmount();
        root = null;
        toastEl.remove();
    }, CLOSE_DELAY_MS);
};

export const useDailyResetReminder = (options: boolean | ResetReminderOptions = true) => {
    const enabled = typeof options === 'boolean' ? options : options.enabled ?? true;
    const nextResetTimeUtc = typeof options === 'boolean' ? null : options.nextResetTimeUtc ?? null;
    const userId = typeof options === 'boolean' ? null : options.userId ?? null;
    const notifiedKeys = useRef<Set<number>>(new Set());

    useEffect(() => {
        if (!enabled) return;

        const checkTime = () => {
            const minutesLeft = getMinutesUntilReset(nextResetTimeUtc);
            const resetKey = nextResetTimeUtc || getResetDate(nextResetTimeUtc).toISOString();
            const openHintKey = `${SESSION_OPEN_KEY}:${userId || 'anonymous'}:${resetKey}`;

            if (
                minutesLeft > 0 &&
                sessionStorage.getItem(openHintKey) !== 'true'
            ) {
                sessionStorage.setItem(openHintKey, 'true');
                showResetToast(minutesLeft, minutesLeft <= 15 ? 'urgent' : 'soft');
                return;
            }

            if (REMINDER_THRESHOLDS.includes(minutesLeft) && !notifiedKeys.current.has(minutesLeft)) {
                notifiedKeys.current.add(minutesLeft);
                showResetToast(minutesLeft, minutesLeft <= 15 ? 'urgent' : 'soft');
            }
        };

        const initialTimer = window.setTimeout(checkTime, 1600);
        const interval = window.setInterval(checkTime, CHECK_INTERVAL_MS);

        return () => {
            window.clearTimeout(initialTimer);
            window.clearInterval(interval);
        };
    }, [enabled, nextResetTimeUtc, userId]);
};
