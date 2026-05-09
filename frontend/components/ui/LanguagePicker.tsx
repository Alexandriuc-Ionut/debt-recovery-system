'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Lang } from '@/contexts/LanguageContext';

const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'ro', label: 'Română', flag: '🇷🇴' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

interface LanguagePickerProps {
  dropUp?: boolean;
  fullWidth?: boolean;
}

export default function LanguagePicker({ dropUp = false, fullWidth = false }: LanguagePickerProps) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const current = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[2];

  return (
    <div ref={ref} className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.10] text-slate-300 hover:text-white transition-all text-sm font-medium ${fullWidth ? 'w-full' : ''}`}
      >
        <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className="flex-1 text-left">{current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute ${dropUp ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 z-50 min-w-[150px] bg-[#131c2e] border border-white/[0.1] rounded-xl shadow-2xl shadow-black/40 overflow-hidden`}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm transition-colors ${
                lang === l.code
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span className="text-base leading-none">{l.flag}</span>
              <span className="font-medium">{l.label}</span>
              {lang === l.code && <Check className="w-3.5 h-3.5 ml-auto text-blue-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
