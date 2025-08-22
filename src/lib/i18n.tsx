import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type MessagesJson = Record<string, { message: string; description?: string }>;
type FlatDict = Record<string, string>;

function normalizeLang(input?: string | null): 'en' | 'zh_CN' {
  if (!input) return 'en';
  const lower = input.replace('_', '-').toLowerCase();
  if (lower.startsWith('zh')) return 'zh_CN';
  return 'en';
}

async function loadLocaleDict(lang: 'en' | 'zh_CN'): Promise<FlatDict> {
  try {
    const url = typeof chrome !== 'undefined' && chrome.runtime?.getURL
      ? chrome.runtime.getURL(`_locales/${lang}/messages.json`)
      : `/_locales/${lang}/messages.json`;
    const res = await fetch(url);
    const json: MessagesJson = await res.json();
    const out: FlatDict = {};
    Object.keys(json).forEach((k) => (out[k] = json[k].message));
    return out;
  } catch {
    return {};
  }
}

function applySubstitutions(msg: string, substitutions?: string | string[]): string {
  if (!substitutions) return msg;
  const arr = Array.isArray(substitutions) ? substitutions : [substitutions];
  let out = msg;
  arr.forEach((val, idx) => {
    const token = new RegExp(`\\$${idx + 1}`, 'g');
    out = out.replace(token, val);
  });
  return out;
}

type I18nContextValue = {
  lang: 'en' | 'zh_CN';
  chromeLang: 'en' | 'zh_CN';
  t: (key: string, substitutions?: string | string[]) => string;
  setLanguage: (lang: 'en' | 'zh_CN') => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<'en' | 'zh_CN'>('en');
  const [chromeLang, setChromeLang] = useState<'en' | 'zh_CN'>('en');
  const [dict, setDict] = useState<FlatDict>({});

  useEffect(() => {
    const init = async () => {
      const chromeUILang = typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getUILanguage
        ? chrome.i18n.getUILanguage()
        : (typeof navigator !== 'undefined' ? navigator.language : 'en');
      const normalizedChromeLang = normalizeLang(chromeUILang);
      setChromeLang(normalizedChromeLang);

      try {
        const stored = await chrome.storage?.local.get('preferredLanguage');
        const preferred = stored?.preferredLanguage as string | undefined;
        const initial = normalizeLang(preferred || chromeUILang);
        setLang(initial);
        const d = await loadLocaleDict(initial);
        setDict(d);
      } catch {
        const initial = normalizedChromeLang;
        setLang(initial);
        const d = await loadLocaleDict(initial);
        setDict(d);
      }
    };
    init();
  }, []);

  const setLanguage = useCallback((l: 'en' | 'zh_CN') => {
    setLang(l);
    void chrome.storage?.local.set({ preferredLanguage: l });
    void loadLocaleDict(l).then(setDict).catch(() => setDict({}));
  }, []);

  const t = useCallback(
    (key: string, substitutions?: string | string[]) => {
      // If user language equals Chrome UI language, prefer chrome.i18n messages.
      try {
        if (typeof chrome !== 'undefined' && chrome.i18n && lang === chromeLang) {
          const msg = chrome.i18n.getMessage(key, substitutions as any);
          if (msg) return msg;
        }
      } catch {
        // ignore
      }
      const raw = dict[key];
      if (raw) return applySubstitutions(raw, substitutions);
      // Fallback: echo key when missing
      return key;
    },
    [dict, lang, chromeLang]
  );

  const value = useMemo<I18nContextValue>(() => ({ lang, chromeLang, t, setLanguage }), [lang, chromeLang, t, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

