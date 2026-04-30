'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { en } from '@/locales/en';
import { ro } from '@/locales/ro';

export type Lang = 'en' | 'ro';
export type Translations = typeof en;

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  t: en,
});

function getSavedLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('lang');
  return saved === 'ro' || saved === 'en' ? saved : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getSavedLang);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem('lang', l);
  }

  const t = (lang === 'ro' ? ro : en) as typeof en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
