import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const translationsDir = join(__dirname, '..', 'translations');

function readJson(path) {
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw.replace(/^\uFEFF/, ''));
}

const en = readJson(join(translationsDir, 'en.json'));

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      if (!(key in result)) {
        result[key] = source[key];
      }
    }
  }
  return result;
}

const languages = ['de.json', 'fr.json', 'es.json', 'it.json', 'ja.json', 'zh.json', 'pt.json'];

for (const file of languages) {
  const filePath = join(translationsDir, file);
  let existing = {};
  try {
    existing = readJson(filePath);
  } catch {
    existing = {};
  }
  const merged = deepMerge(existing, en);
  writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
  console.log(`Updated ${file}: ${Object.keys(merged).length} root keys`);
}
