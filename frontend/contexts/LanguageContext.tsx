'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start with 'en' — matches server render, preventing hydration mismatch
  const [lang, setLangState] = useState<Lang>('en');

  // After hydration, sync to localStorage without causing a hydration error
  useEffect(() => {
    const saved = localStorage.getItem('lang');
    if (saved === 'ro') setLangState('ro');
  }, []);

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
