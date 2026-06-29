import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './translations/en.json';
import ptTranslation from './translations/pt.json';
import { getBackendBaseUrl } from './utils/apiUrl';

const resources = {
  en: { translation: enTranslation },
  pt: { translation: ptTranslation },
};

// ---------------------------------------------------------------------------
// Language detection — priority chain:
//   1. Saved user profile (returning user)
//   2. Browser / OS locale (new user — zero-friction first experience)
//   3. English (always the final fallback)
// ---------------------------------------------------------------------------
import { resolveInterfaceLang, detectBrowserLangCode } from './utils/langUtils';

const savedProfile = localStorage.getItem('userProfile');
let defaultLang = 'en'; // English is always the final fallback

if (savedProfile) {
  // Returning user: respect their saved interface language preference
  try {
    const profile = JSON.parse(savedProfile);
    defaultLang = resolveInterfaceLang(profile);
  } catch { /* corrupt profile — fall through to browser detection */ }
}

if (defaultLang === 'en' && !savedProfile) {
  // New user: detect from browser/OS locale for zero-friction first experience
  // e.g. a French user will see the interface in French before even selecting language
  const browserLang = detectBrowserLangCode();
  if (browserLang !== 'en') {
    defaultLang = browserLang;
    console.info(`[i18n] Auto-detected browser language: "${browserLang}"`);
  }
}

// Languages that are already bundled statically in this file
const BUNDLED_LANGUAGES = new Set(['en', 'pt']);

// Track which languages have been fully applied this session (lang → en-fingerprint)
const loadedRemoteLangs = new Map<string, string>();

// Debounce timer for batching i18next re-renders
let _rerenderTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleRerender() {
  if (_rerenderTimer) clearTimeout(_rerenderTimer);
  _rerenderTimer = setTimeout(() => { i18n.emit('languageChanged', i18n.language); }, 80);
}

// ---------------------------------------------------------------------------
// Lazy import of translationStore (avoids circular dep at module init time)
// ---------------------------------------------------------------------------
import { translationStore } from './stores/translationStore';

// ---------------------------------------------------------------------------
// Core: stream a language pack from the backend (SSE) and apply each key
// as it arrives — near real-time for the first selection of any language.
// ---------------------------------------------------------------------------
export async function loadLanguagePack(lang: string): Promise<void> {
  const enResources = i18n.getResourceBundle('en', 'translation') || {};
  const enFlat = flattenI18nBundle(enResources);
  const enFingerprint = JSON.stringify(enFlat).length.toString();

  // Switch immediately so the user sees the static bundle (or English fallback) right away
  await i18n.changeLanguage(lang);
  if (lang === 'en' || lang === 'pt') return;

  // ── 1. Apply cached translations from localStorage if available ──────────
  const cacheKey = `sakae:i18n:${lang}:${enFingerprint}`;
  const cachedSessionFingerprint = loadedRemoteLangs.get(lang);

  let needsStream = true;

  if (cachedSessionFingerprint === enFingerprint) {
    // Already fully applied this session — no need to stream again
    return;
  }

  try {
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      const dict: Record<string, string> = JSON.parse(stored);
      const missing = Object.keys(enFlat).filter(k => !dict[k] || !dict[k].trim());

      if (missing.length === 0) {
        // Full cache hit — apply it and skip the network call
        Object.entries(dict).forEach(([key, val]) => {
          i18n.addResource(lang, 'translation', key, val);
        });
        loadedRemoteLangs.set(lang, enFingerprint);
        i18n.emit('languageChanged', i18n.language);
        needsStream = false;
      }
    }
  } catch { /* ignore */ }

  if (!needsStream) return;

  // ── 2. Stream from backend in background ─────────────────────────────────
  const apiBaseUrl = getBackendBaseUrl();

  console.info(`[i18n] Streaming "${lang}" from backend (${Object.keys(enFlat).length} keys)…`);

  fetch(`${apiBaseUrl}/api/v1/translations/stream/${lang}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
    body: JSON.stringify(enFlat),
  }).then(async (response) => {
    if (!response.ok || !response.body) {
      console.warn(`[i18n] Stream for "${lang}" failed (${response.status}).`);
      translationStore.done();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let receivedCount = 0;
    const receivedDict: Record<string, string> = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const event of events) {
        const line = event.trim();
        if (!line.startsWith('data:')) continue;

        const payload = line.slice('data:'.length).trim();

        if (payload === '[DONE]') {
          try { localStorage.setItem(cacheKey, JSON.stringify(receivedDict)); } catch { /* quota */ }
          loadedRemoteLangs.set(lang, enFingerprint);
          i18n.emit('languageChanged', i18n.language);
          translationStore.done();
          console.info(`[i18n] "${lang}" stream complete (${receivedCount} keys).`);
          return;
        }

        if (payload.startsWith('[ERROR]')) {
          console.error(`[i18n] Stream error: ${payload}`);
          continue;
        }

        try {
          const parsed = JSON.parse(payload);
          if (parsed.meta === 'total') {
            translationStore.startLoading(lang, parsed.count);
            continue;
          }

          const { key, value: val } = parsed as { key: string; value: string };
          if (val && val.trim()) {
            i18n.addResource(lang, 'translation', key, val);
            receivedDict[key] = val;
            receivedCount++;
            translationStore.tick(receivedCount);
            scheduleRerender();
          }
        } catch { /* malformed */ }
      }
    }

    console.warn(`[i18n] Stream for "${lang}" ended without [DONE].`);
    i18n.emit('languageChanged', i18n.language);
    translationStore.done();
  }).catch((err) => {
    console.error(`[i18n] Stream fetch error for "${lang}":`, err);
    translationStore.done();
  });
}

// ---------------------------------------------------------------------------
// Helper: flatten a nested i18next resource bundle into dot-notation keys
// e.g. { chat: { listening: "Listening" } } → { "chat.listening": "Listening" }
// ---------------------------------------------------------------------------
function flattenI18nBundle(
  obj: Record<string, unknown>,
  prefix = '',
  result: Record<string, string> = {}
): Record<string, string> {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        result[`${fullKey}.${idx}`] = String(item);
      });
    } else if (typeof value === 'object' && value !== null) {
      flattenI18nBundle(value as Record<string, unknown>, fullKey, result);
    } else {
      result[fullKey] = String(value ?? '');
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// i18next init — no missingKeyHandler needed; packs are loaded up front
// ---------------------------------------------------------------------------
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    // If a key is genuinely missing from a remote pack, fall back silently
    saveMissing: false,
  });

// If the startup language is not bundled, kick off a background load
// so the interface updates as soon as the pack arrives (typically < 2s).
if (!BUNDLED_LANGUAGES.has(defaultLang)) {
  loadLanguagePack(defaultLang);
}

export default i18n;
