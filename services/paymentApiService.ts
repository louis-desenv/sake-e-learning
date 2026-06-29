import { getApiRootUrl } from '../utils/apiUrl';

const API_BASE_URL = getApiRootUrl();

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Authentication is required.');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const readJson = async (response: Response) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || payload.error || 'Payment request failed.');
  }
  return payload;
};

export const createCheckoutSession = async (
  planType: 'standard' | 'pro' | 'super',
  billingCycle: 'monthly' | 'annual',
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/payment/checkout`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ planType, billingCycle }),
  });
  const payload = await readJson(response);
  if (!payload.paymentUrl) {
    throw new Error('Payment URL was not returned.');
  }
  return payload.paymentUrl;
};

export const createBillingPortalSession = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/payment/portal`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({}),
  });
  const payload = await readJson(response);
  if (!payload.url) {
    throw new Error('Billing portal URL was not returned.');
  }
  return payload.url;
};
