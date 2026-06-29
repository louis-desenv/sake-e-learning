/**
 * Shared language mapping utility.
 * Maps display language names to BCP-47 codes used by i18n.
 */
export const LANG_MAP: Record<string, string> = {
  'Portuguese': 'pt',
  'Spanish':    'es',
  'French':     'fr',
  'German':     'de',
  'Italian':    'it',
  'Japanese':   'ja',
  'Korean':     'ko',
  'Chinese':    'zh',
  'Russian':    'ru',
  'Arabic':     'ar',
  'English':    'en',
};

export function mapLangCode(nativeLanguage: string | undefined | null): string {
  if (!nativeLanguage) return 'en';
  const code = LANG_MAP[nativeLanguage] ?? 'en';
  return code === 'pt' ? 'pt' : 'en';
}

/**
 * Given a user profile, resolve the correct interface language code.
 */
export function resolveInterfaceLang(profile: {
  nativeLanguage?: string;
  interfaceLanguage?: string;
}): string {
  if (profile.interfaceLanguage === 'learning') return 'en';
  return mapLangCode(profile.nativeLanguage);
}

// ---------------------------------------------------------------------------
// Browser / Device locale detection
// ---------------------------------------------------------------------------

/**
 * Maps a BCP-47 language tag (e.g. "pt-BR", "fr-FR", "zh-CN")
 * to our display Language name (e.g. "Portuguese", "French", "Chinese").
 *
 * Priority: navigator.languages[0] > navigator.language > 'English'
 * Works on desktop browsers AND mobile WebViews (iOS/Android).
 */
const BCP47_TO_LANG: Record<string, string> = {
  // Portuguese
  'pt': 'Portuguese', 'pt-br': 'Portuguese', 'pt-pt': 'Portuguese',
  // Spanish
  'es': 'Spanish', 'es-mx': 'Spanish', 'es-ar': 'Spanish',
  'es-co': 'Spanish', 'es-cl': 'Spanish', 'es-419': 'Spanish',
  // French
  'fr': 'French', 'fr-fr': 'French', 'fr-be': 'French',
  'fr-ca': 'French', 'fr-ch': 'French',
  // German
  'de': 'German', 'de-de': 'German', 'de-at': 'German', 'de-ch': 'German',
  // Italian
  'it': 'Italian', 'it-it': 'Italian', 'it-ch': 'Italian',
  // Japanese
  'ja': 'Japanese', 'ja-jp': 'Japanese',
  // Korean
  'ko': 'Korean', 'ko-kr': 'Korean',
  // Chinese (Simplified & Traditional)
  'zh': 'Chinese', 'zh-cn': 'Chinese', 'zh-tw': 'Chinese',
  'zh-hk': 'Chinese', 'zh-sg': 'Chinese',
  // Russian
  'ru': 'Russian', 'ru-ru': 'Russian',
  // Arabic
  'ar': 'Arabic', 'ar-sa': 'Arabic', 'ar-eg': 'Arabic',
  'ar-ae': 'Arabic', 'ar-ma': 'Arabic',
  // English (already the default — listed for completeness)
  'en': 'English', 'en-us': 'English', 'en-gb': 'English',
  'en-au': 'English', 'en-ca': 'English',
};

/**
 * Returns the user's native language display name (e.g. "Portuguese")
 * by reading the browser / OS locale — zero network, zero latency.
 *
 * Returns null if the detected language is not in our supported set
 * (so the caller can decide whether to pre-select or leave blank).
 */
export function detectBrowserLanguage(): string | null {
  try {
    // navigator.languages is an ordered list of the user's preferred languages
    // navigator.language is the primary language (legacy fallback)
    const candidates = [
      ...(navigator.languages ?? []),
      navigator.language,
    ].filter(Boolean);

    for (const tag of candidates) {
      const lower = tag.toLowerCase();

      // Exact match first (e.g. "pt-BR")
      if (BCP47_TO_LANG[lower]) return BCP47_TO_LANG[lower];

      // Prefix match (e.g. "pt" from "pt-BR")
      const prefix = lower.split('-')[0];
      if (BCP47_TO_LANG[prefix]) return BCP47_TO_LANG[prefix];
    }
  } catch {
    // Browsers may restrict navigator in some sandboxed contexts
  }
  return null;
}

/**
 * Returns the BCP-47 code for the browser language (e.g. "pt" for Portuguese).
 * Used by i18n.ts to set the UI language before the user completes onboarding.
 */
export function detectBrowserLangCode(): string {
  const lang = detectBrowserLanguage();
  const code = lang ? (LANG_MAP[lang] ?? 'en') : 'en';
  return code === 'pt' ? 'pt' : 'en';
}
