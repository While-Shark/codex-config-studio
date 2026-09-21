import { en } from './en';
import { ja } from './ja';
import { ko } from './ko';
import { zhCN, type TranslationKey, type Dictionary } from './zh-CN';
import { zhTW } from './zh-TW';

export type Locale = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko';

export const localeOptions: Array<{ value: Locale; label: string }> = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
];

const dictionaries: Record<Locale, Dictionary> = { 'zh-CN': zhCN, 'zh-TW': zhTW, en, ja, ko };
const storageKey = 'codex-config-studio.locale';
let currentLocale: Locale = detectInitialLocale();

function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.startsWith('zh-tw') || lower.startsWith('zh-hk') || lower.startsWith('zh-mo') || lower.includes('hant')) return 'zh-TW';
  if (lower.startsWith('zh')) return 'zh-CN';
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('ko')) return 'ko';
  if (lower.startsWith('en')) return 'en';
  return null;
}

function detectInitialLocale(): Locale {
  try {
    const saved = normalizeLocale(localStorage.getItem(storageKey));
    if (saved) return saved;
  } catch {
    // Ignore storage failures and fall back to browser locale.
  }
  for (const candidate of navigator.languages ?? [navigator.language]) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }
  return 'en';
}

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  try {
    localStorage.setItem(storageKey, locale);
  } catch {
    // Locale still changes for the current session.
  }
}

export function t(key: TranslationKey, vars: Record<string, string | number> = {}): string {
  let value = dictionaries[currentLocale][key] ?? dictionaries.en[key] ?? key;
  for (const [name, replacement] of Object.entries(vars)) {
    value = value.replaceAll(`{${name}}`, String(replacement));
  }
  return value;
}
