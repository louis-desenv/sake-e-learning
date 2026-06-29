/**
 * i18n String Extractor
 *
 * Scans all .tsx / .ts files and extracts:
 *  1. Strings inside JSX text nodes (<span>Text</span>)
 *  2. String attribute values (title, placeholder, aria-label, alt, label)
 *  3. JavaScript string literals (alert, setError, error messages)
 *  4. Existing t() calls & defaultValue fallbacks vs en.json
 *
 * Run: node scripts/extract-i18n-strings.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = join(__filename, '..', '..');
const EN_JSON = join(ROOT, 'translations/en.json');

// ── 1. Load existing en.json ──────────────────────────────────────────────

function flattenKeys(obj, prefix = '', result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      flattenKeys(value, fullKey, result);
    } else if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        result[`${fullKey}[${idx}]`] = String(item);
      });
    } else {
      result[fullKey] = String(value ?? '');
    }
  }
  return result;
}

const enJson = existsSync(EN_JSON) ? JSON.parse(readFileSync(EN_JSON, 'utf-8')) : {};
const enFlat = flattenKeys(enJson);
const enKeySet = new Set(Object.keys(enFlat));

// ── 2. File crawler ────────────────────────────────────────────────────────

const EXTENSIONS = new Set(['.tsx', '.ts']);
const EXCLUDE_DIRS = new Set([
  'node_modules', 'dist', '.git', '.claude', '.github', '.kiro', '.docs',
  'server', 'scratch', 'video', 'docs', 'public',
]);

function* walkFiles(dir) {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.has(entry.name)) yield* walkFiles(fullPath);
      } else if (entry.isFile()) {
        const ext = entry.name.slice(entry.name.lastIndexOf('.'));
        if (EXTENSIONS.has(ext)) yield fullPath;
      }
    }
  } catch { /* skip */ }
}

// ── 3. Helper ─────────────────────────────────────────────────────────────

function getLineNum(content, index) {
  return content.slice(0, index).split('\n').length;
}

// ── 4. Collect files ──────────────────────────────────────────────────────

const fileSet = new Set();
for (const subdir of ['pages', 'components', 'gamification', 'hooks', 'stores', 'utils']) {
  const dir = join(ROOT, subdir);
  if (existsSync(dir)) {
    for (const f of walkFiles(dir)) fileSet.add(f);
  }
}
// Single root files
for (const name of ['App.tsx', 'constants.tsx', 'i18n.ts', 'index.tsx', 'types.ts']) {
  const p = join(ROOT, name);
  if (existsSync(p)) fileSet.add(p);
}
const files = [...fileSet].sort();

// ── 5. Extract strings from each file ─────────────────────────────────────

const allFindings = [];
const tUsage = [];
const tDefaultValues = [];

// Patterns
const JSX_TEXT_RE       = />\s*([A-Z][A-Za-z0-9\s\-'",.!?;:()]{2,}?)\s*<\//g;
const ATTR_RE           = /\b(title|placeholder|aria-label|alt|label|describe)=\{?["'`]([^"'`{]+)["'`]\}?/g;
const ALERT_RE          = /\b(alert|setError|setMessage|toast|notify)\(['"`]([^"'`]+)['"`]/g;
const SET_STRING_RE     = /\bset(?:Error|Message|Text|Status|Loading|Title|Desc|Description|Hint|Warning)\s*\(\s*['"`]([^"'`]+)['"`]/g;
const T_CALL_RE         = /t\(['"]([^'"]+)['"]/g;
const T_DEFAULT_RE      = /t\(['"]([^'"]+)['"][\s\S]*?defaultValue:\s*['"`]([^"'`]+)['"`]/g;
const ERROR_LITERAL_RE  = /['"`]([A-Z][A-Za-z0-9\s\-'",.!?;:()]{8,}(?:error|failed|invalid|not found|required|unavailable|denied|permission|try again|please)[^"'`]*)['"`]/gi;
const TEMPLATE_RE       = /`([^`$]{4,})`/g;
const STRING_COMPARE_RE = /['"]([A-Za-z][A-Za-z0-9\s\-'",.!?;:()]{3,})['"]/g;

for (const filePath of files) {
  const relPath = relative(ROOT, filePath).replace(/\\/g, '/');
  let content;
  try { content = readFileSync(filePath, 'utf-8'); } catch { continue; }

  const findings = [];

  let match;

  // a) JSX text content
  JSX_TEXT_RE.lastIndex = 0;
  while ((match = JSX_TEXT_RE.exec(content)) !== null) {
    const text = match[1].trim();
    if (text.length > 1 && !text.startsWith('{')) {
      findings.push({ type: 'jsx-text', text, line: getLineNum(content, match.index) });
    }
  }

  // b) String attributes
  ATTR_RE.lastIndex = 0;
  while ((match = ATTR_RE.exec(content)) !== null) {
    const text = match[2].trim();
    if (text.length > 1 && !text.startsWith('{') && !text.startsWith('http')) {
      findings.push({ type: `attr:${match[1]}`, text, line: getLineNum(content, match.index) });
    }
  }

  // c) alert/setError
  ALERT_RE.lastIndex = 0;
  while ((match = ALERT_RE.exec(content)) !== null) {
    findings.push({ type: 'alert', text: match[2].trim(), line: getLineNum(content, match.index) });
  }

  // d) setXxx strings
  SET_STRING_RE.lastIndex = 0;
  while ((match = SET_STRING_RE.exec(content)) !== null) {
    findings.push({ type: 'set-state', text: match[1].trim(), line: getLineNum(content, match.index) });
  }

  // e) Error literals
  ERROR_LITERAL_RE.lastIndex = 0;
  while ((match = ERROR_LITERAL_RE.exec(content)) !== null) {
    const text = match[1].trim();
    if (text.length > 5) {
      findings.push({ type: 'error-msg', text, line: getLineNum(content, match.index) });
    }
  }

  // f) Template literals
  TEMPLATE_RE.lastIndex = 0;
  while ((match = TEMPLATE_RE.exec(content)) !== null) {
    const text = match[1].trim();
    if (text.length > 3 && /[A-Za-z]{3,}/.test(text)) {
      findings.push({ type: 'template', text, line: getLineNum(content, match.index) });
    }
  }

  if (findings.length > 0) {
    allFindings.push({ file: relPath, findings });
  }

  // Track t() calls
  T_CALL_RE.lastIndex = 0;
  while ((match = T_CALL_RE.exec(content)) !== null) {
    tUsage.push({ file: relPath, key: match[1], line: getLineNum(content, match.index) });
  }

  // Track t() defaultValue
  T_DEFAULT_RE.lastIndex = 0;
  while ((match = T_DEFAULT_RE.exec(content)) !== null) {
    tDefaultValues.push({
      file: relPath,
      key: match[1],
      defaultValue: match[2],
      inEn: enKeySet.has(match[1]),
      line: getLineNum(content, match.index),
    });
  }
}

// ── 6. REPORT ─────────────────────────────────────────────────────────────

console.log('');
console.log('='.repeat(90));
console.log('  i18n STRING EXTRACTION REPORT');
console.log('='.repeat(90));
console.log(`  Files scanned:     ${files.length}`);
console.log(`  en.json keys:      ${enKeySet.size}`);
console.log(`  t() calls:         ${tUsage.length}`);
console.log(`  defaultValue refs: ${tDefaultValues.length}`);
console.log(`  Hardcoded strings: ${allFindings.reduce((s, f) => s + f.findings.length, 0)}`);

// ── 6a. Files missing useTranslation import ─────────────────────────────────

console.log('');
console.log('─'.repeat(90));
console.log('  FILES MISSING useTranslation (with hardcoded strings):');
console.log('─'.repeat(90));

for (const filePath of files) {
  const relPath = relative(ROOT, filePath).replace(/\\/g, '/');
  let content;
  try { content = readFileSync(filePath, 'utf-8'); } catch { continue; }
  const hasT = content.includes('useTranslation') || content.includes("from 'react-i18next'");
  if (!hasT) {
    const fileFindings = allFindings.filter(f => f.file === relPath);
    if (fileFindings.length > 0) {
      const total = fileFindings.reduce((s, f) => s + f.findings.length, 0);
      console.log(`  📄 ${relPath} — ${total} hardcoded strings`);
    }
  }
}

// ── 6b. defaultValue keys missing from en.json ─────────────────────────────

const missingDefaults = tDefaultValues.filter(d => !d.inEn);
if (missingDefaults.length > 0) {
  console.log('');
  console.log('─'.repeat(90));
  console.log(`  defaultValue KEYS NOT IN en.json (${missingDefaults.length}):`);
  console.log('─'.repeat(90));
  for (const d of missingDefaults) {
    console.log(`  ${d.file}:${d.line}`);
    console.log(`    t('${d.key}', { defaultValue: '${d.defaultValue}' })`);
  }
}

// ── 6c. ALL hardcoded strings by file (noise-filtered) ─────────────────────

console.log('');
console.log('='.repeat(90));
console.log('  ALL HARDCODED STRINGS BY FILE');
console.log('='.repeat(90));

for (const { file, findings } of allFindings) {
  const meaningful = findings.filter(f => {
    const t = f.text;
    return t.length > 2
      && !/^\d+$/.test(t)
      && !/^[a-z-]+$/.test(t)
      && !t.startsWith('{{')
      && !t.includes('<')
      && !['true', 'false', 'null', 'undefined'].includes(t.toLowerCase());
  });
  if (meaningful.length === 0) continue;

  console.log(`\n📄 ${file}:`);
  for (const f of meaningful) {
    console.log(`  L${f.line.toString().padStart(4)} [${f.type.padEnd(12)}] "${f.text}"`);
  }
}

// ── 6d. Duplicated keys between chat.* and voiceChat.* ─────────────────────

console.log('');
console.log('─'.repeat(90));
console.log('  DUPLICATE KEYS BETWEEN NAMESPACES:');
console.log('─'.repeat(90));

const chatKeys = new Set(Object.keys(enJson.chat || {}));
const voiceChatKeys = new Set(Object.keys(enJson.voiceChat || {}));
const dupes = [...chatKeys].filter(k => voiceChatKeys.has(k));
if (dupes.length > 0) {
  for (const k of dupes) {
    console.log(`  chat.${k}  AND  voiceChat.${k}  →  "${enJson.chat[k]}"`);
  }
} else {
  console.log('  (none found)');
}

// ── 6e. Badges & level definitions ─────────────────────────────────────────

console.log('');
console.log('─'.repeat(90));
console.log('  GAMIFICATION DATA (badges.ts / levelDefinitions.ts):');
console.log('─'.repeat(90));
console.log('  (these serve as defaultValue fallbacks for t() calls)');
console.log('  badges.ts has titles/descriptions/hints in PORTUGUESE');
console.log('  → Update en.json with proper English keys at gamification.badges.*');
console.log('  → Then update badges.ts to use English fallbacks');

// ── 6f. Summary ────────────────────────────────────────────────────────────

console.log('');
console.log('='.repeat(90));
console.log('  SUMMARY');
console.log('='.repeat(90));
console.log(`  Total files examined:      ${files.length}`);
console.log(`  Files with hardcoded strs: ${allFindings.length}`);
console.log(`  Total hardcoded strings:   ${allFindings.reduce((s, f) => s + f.findings.length, 0)}`);
console.log(`  Files needing useTranslation: ${files.filter(f => {
    try { const c = readFileSync(f, 'utf-8'); return !c.includes('useTranslation'); }
    catch { return false; }
  }).filter(f => {
    const r = relative(ROOT, f).replace(/\\/g, '/');
    return allFindings.some(x => x.file === r);
  }).length}`);
console.log('');
