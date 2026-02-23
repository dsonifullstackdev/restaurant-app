/**
 * Simple i18n: all UI text from translation files. Replace with i18next when added.
 */

import { AppConfig } from '@/config/app.config';

import en from './en.json';
import hi from './hi.json';

const resources: Record<string, Record<string, unknown>> = { en, hi };

let currentLanguage: string = AppConfig.DEFAULT_LANGUAGE;

function interpolate(str: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`{{${k}}}`, 'g'), String(v)),
    str
  );
}

export function setLanguage(lang: string): void {
  if (resources[lang]) currentLanguage = lang;
}

export function getLanguage(): string {
  return currentLanguage;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: unknown = resources[currentLanguage] ?? resources.en;
  for (const k of keys) {
    value = (value as Record<string, unknown>)?.[k];
    if (value === undefined) return key;
  }
  const str = typeof value === 'string' ? value : String(value);
  return vars ? interpolate(str, vars) : str;
}

export type TranslationKeys = keyof typeof en;
