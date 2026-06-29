import { getApiRootUrl } from '../utils/apiUrl';

const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Handles 401 Unauthorized responses by dispatching a global event.
 * App.tsx listens for this event and performs automatic logout.
 */
const handleUnauthorized = () => {
    console.warn('[GamificationApiService] Token expirado ou inválido (401). Fazendo logout automático...');
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
};

const GAMIFICATION_API_URL = `${getApiRootUrl()}/Gamification`;

export interface GamificationStatusDto {
    totalXP: number;
    currentLevel: number;
    voiceSecondsUsedToday: number;
    voiceDailyLimitSeconds: number;
    textMessagesUsedToday: number;
    textDailyLimitMessages: number;
    avatarSecondsUsedToday: number;
    avatarDailyLimitSeconds: number;
    streakDays: number;
    nextResetTimeUtc: string;
}

export const fetchGamificationStatus = async (): Promise<GamificationStatusDto | null> => {
    try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${GAMIFICATION_API_URL}/status`, { headers });
        if (res.status === 401) {
            handleUnauthorized();
            return null;
        }
        if (!res.ok) {
            console.error('[GamificationApiService] get status failed', res.statusText);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error('[GamificationApiService] error:', err);
        return null;
    }
};

export const reportVoiceUsage = async (secondsUsed: number): Promise<boolean> => {
    try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${GAMIFICATION_API_URL}/voice/use`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ secondsUsed })
        });
        if (res.status === 401) {
            handleUnauthorized();
            return false;
        }
        return res.ok;
    } catch (err) {
        console.error('[GamificationApiService] error:', err);
        return false;
    }
};

export const reportAvatarUsage = async (secondsUsed: number): Promise<boolean> => {
    try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${GAMIFICATION_API_URL}/avatar/use`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ secondsUsed })
        });
        if (res.status === 401) {
            handleUnauthorized();
            return false;
        }
        return res.ok;
    } catch (err) {
        console.error('[GamificationApiService] error:', err);
        return false;
    }
};

export const addXp = async (xpGained: number): Promise<GamificationStatusDto | null> => {
    try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${GAMIFICATION_API_URL}/xp/add`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ xpGained })
        });
        if (res.status === 401) {
            handleUnauthorized();
            return null;
        }
        if (!res.ok) {
            console.error('[GamificationApiService] add xp failed', res.statusText);
            return null;
        }
        return await res.json();
    } catch (err) {
        console.error('[GamificationApiService] error:', err);
        return null;
    }
};
