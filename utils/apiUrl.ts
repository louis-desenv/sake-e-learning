const DEFAULT_DEV_API_BASE_URL = 'http://localhost:8080';
const DEFAULT_PROD_API_BASE_URL = 'https://sakaeelearning-webapi.fly.dev';

const normalizeBaseUrl = (value: string) =>
  value
    .replace(/['"]+/g, '')
    .replace(/\/+$/, '')
    .replace(/\/api\/v1\/auth$/i, '')
    .replace(/\/api$/i, '');

export const getBackendBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_URL as string | undefined;
  const fallbackUrl = import.meta.env.DEV
    ? DEFAULT_DEV_API_BASE_URL
    : DEFAULT_PROD_API_BASE_URL;

  return normalizeBaseUrl(configuredUrl || fallbackUrl);
};

export const getApiRootUrl = () => `${getBackendBaseUrl()}/api`;

export const getAuthApiUrl = () => `${getApiRootUrl()}/v1/auth`;
