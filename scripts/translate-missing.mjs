/**
 * Batch-translate missing i18n keys using Google Translate (free, no API key).
 *
 * Usage:
 *   node scripts/translate-missing.mjs [lang]
 *
 * Examples:
 *   node scripts/translate-missing.mjs de      # translate German only
 *   node scripts/translate-missing.mjs         # translate ALL languages
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const translationsDir = join(__dirname, '..', 'translations');

function readJson(path) {
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw.replace(/^\uFEFF/, ''));
}

function flatten(obj, prefix = '', result = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const fk = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => { result[`${fk}.${i}`] = String(item); });
    } else if (typeof v === 'object' && v !== null) {
      flatten(v, fk, result);
    } else {
      result[fk] = String(v ?? '');
    }
  }
  return result;
}

const LANG_MAP = {
  de: 'de', fr: 'fr', es: 'es', it: 'it',
  ja: 'ja', zh: 'zh-CN', pt: 'pt',
};

async function translateText(text, targetLang) {
  const tl = LANG_MAP[targetLang] || targetLang;
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl='
    + tl + '&dt=t&q=' + encodeURIComponent(text);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  return data[0][0][0];
}

async function translateLanguage(lang) {
  console.log(`\n── Translating ${lang.toUpperCase()} ──`);

  const en = readJson(join(translationsDir, 'en.json'));
  const target = readJson(join(translationsDir, `${lang}.json`));

  const enFlat = flatten(en);
  const targetFlat = flatten(target);

  const missingKeys = Object.keys(enFlat).filter(
    k => !targetFlat[k] || targetFlat[k] === enFlat[k] || !targetFlat[k].trim()
  );

  if (missingKeys.length === 0) {
    console.log('  ✓ No missing translations!');
    return;
  }

  console.log(`  ${missingKeys.length} keys to translate...`);
  let translated = 0;

  for (let i = 0; i < missingKeys.length; i++) {
    const key = missingKeys[i];
    const text = enFlat[key];

    // Skip placeholders-only text, empty text, or text starting with {{ }}
    if (!text || text.trim().startsWith('{{') || text.trim().length < 2) {
      targetFlat[key] = text;
      translated++;
      continue;
    }

    try {
      let result = await translateText(text, lang);
      // Restore {{placeholders}} that Google Translate might have altered
      // Also restore HTML tags
      targetFlat[key] = result;
      translated++;
    } catch (err) {
      console.error(`  Failed [${i+1}/${missingKeys.length}] "${text.substring(0,40)}": ${err.message}`);
      targetFlat[key] = text; // English fallback
    }

    if ((i + 1) % 10 === 0 || i === missingKeys.length - 1) {
      console.log(`  Progress: ${i + 1}/${missingKeys.length}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  // Reconstruct nested JSON
  function unflatten(flat) {
    const root = {};
    const arrayRe = /^(\d+)$/;
    for (const [key, value] of Object.entries(flat)) {
      const parts = key.split('.');
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (i === parts.length - 1) {
          if (arrayRe.test(p) && Array.isArray(current)) {
            current[parseInt(p)] = value;
          } else {
            current[p] = value;
          }
        } else {
          const nextNum = arrayRe.test(parts[i + 1]);
          if (!current[p] || typeof current[p] !== 'object') {
            current[p] = nextNum ? [] : {};
          }
          current = current[p];
        }
      }
    }
    return root;
  }

  // Preserve original top-level key order from en.json
  const enKeys = Object.keys(en);
  const nested = unflatten(targetFlat);
  const ordered = {};
  for (const k of enKeys) {
    if (k in nested) ordered[k] = nested[k];
  }

  writeFileSync(
    join(translationsDir, `${lang}.json`),
    JSON.stringify(ordered, null, 2) + '\n',
    'utf-8'
  );

  console.log(`  ✓ ${lang.toUpperCase()} done! ${translated} keys translated.`);
}

const langArg = process.argv[2];
const languages = langArg ? [langArg] : Object.keys(LANG_MAP);

(async () => {
  for (const lang of languages) {
    await translateLanguage(lang);
  }
  console.log('\n✓ All done!');
})();
