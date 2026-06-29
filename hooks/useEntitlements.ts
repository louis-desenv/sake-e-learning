import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { isUnrestrictedTestAccount } from '../utils/testAccounts';
import { getApiRootUrl } from '../utils/apiUrl';

export type FeatureLockStatus =
  | 'allowed'
  | 'trial_available'
  | 'quota_exhausted'
  | 'plan_required'
  | 'level_required'
  | 'trial_expired' | 'locked';

export interface EntitlementDecision {
  feature: string;
  plan: string;
  status: FeatureLockStatus;
  limit: number | null;
  used: number;
  remaining: number | null;
  resetAtUtc: string | null;
  requiredPlan: string | null;
  reasonCode: string;
  paywall?: {
    title?: string | null;
    message?: string | null;
    ctaLabel?: string | null;
    targetPlan?: string | null;
    canRetryAfterReset?: boolean | null;
  } | null;
}

export interface EntitlementsStatus {
  plan: string;
  isTrial: boolean;
  trialEndsAtUtc: string | null;
  features: Record<string, EntitlementDecision>;
}

const buildUnavailableDecision = (feature: string): EntitlementDecision => ({
  feature,
  plan: 'unknown',
  status: 'plan_required',
  limit: null,
  used: 0,
  remaining: null,
  resetAtUtc: null,
  requiredPlan: 'standard',
  reasonCode: 'entitlements_unavailable',
});

export const useEntitlements = () => {
  const { user } = useUser();
  const bypassAccess = isUnrestrictedTestAccount(user?.email);
  const [status, setStatus] = useState<EntitlementsStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const getEntitlementsUrl = useCallback((path: string) => {
    return `${getApiRootUrl()}/Entitlements/${path}`;
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      if (!token) {
        setStatus(null);
        return;
      }

      const response = await fetch(getEntitlementsUrl('status'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setStatus(await response.json());
      } else {
        setStatus(null);
      }
    } catch (err) {
      console.error('Failed to fetch entitlements', err);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [getEntitlementsUrl]);

  const consume = useCallback(async (feature: string, amount: number = 1): Promise<EntitlementDecision | null> => {
    if (bypassAccess) {
      return {
        feature,
        plan: 'test',
        status: 'allowed',
        limit: null,
        used: 0,
        remaining: null,
        resetAtUtc: null,
        requiredPlan: null,
        reasonCode: 'test_account_bypass',
      };
    }

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
      if (!token) return null;

      const response = await fetch(getEntitlementsUrl('consume'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feature, amount }),
      });

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return null;
      }

      const payload = await response.json().catch(() => null);
      const decision = payload?.entitlement as EntitlementDecision | undefined;

      if (decision) {
        setStatus((current) => current
          ? {
              ...current,
              features: {
                ...current.features,
                [feature]: decision,
              },
            }
          : current);
      }

      if (!response.ok && (response.status === 403 || response.status === 429)) {
        return decision ?? {
          ...buildUnavailableDecision(feature),
          status: response.status === 429 ? 'quota_exhausted' : 'plan_required',
          reasonCode: response.status === 429 ? 'daily_limit_reached' : 'feature_locked_for_plan',
        };
      }

      return decision ?? null;
    } catch (err) {
      console.error('Failed to consume entitlement', err);
      return null;
    }
  }, [bypassAccess, getEntitlementsUrl]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const canUse = useCallback((feature: string): boolean => {
    if (bypassAccess) return true;
    if (!status) return false;
    const decision = status.features[feature];
    return decision ? decision.status === 'allowed' : false;
  }, [bypassAccess, status]);

  const getLock = useCallback((feature: string): EntitlementDecision | null => {
    if (bypassAccess) return null;
    if (!status) return loading ? null : buildUnavailableDecision(feature);
    return status.features[feature] || null;
  }, [bypassAccess, loading, status]);

  return {
    status,
    loading,
    canUse,
    consume,
    getLock,
    refresh: fetchStatus,
  };
};
