import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Amio } from '@/components/pathways/Amio';
import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { LANGUAGES } from '@/lib/languages';

// Your language (Amio v2, frame OnboardLanguage): Amio's line in the picked
// language, "Which language do you speak best?", a search box that matches
// the native or the English name, the languages two to a row (each with a
// small Amio wearing that language's mark), and Continue.

export const nativeName = (label) => label.split(' (')[0];
export const englishName = (label) => (label.match(/\(([^)]+)\)/) || [])[1] || label;
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Languages whose native or English name contains the search words. */
export function searchLanguages(query, list = LANGUAGES) {
  const q = fold(query.trim());
  if (!q) return list;
  return list.filter((l) => fold(nativeName(l.label)).includes(q) || fold(englishName(l.label)).includes(q) || l.value === q);
}

export default function LanguageStep({ language, t, rtl, onPick, onContinue, note }) {
  const [query, setQuery] = useState('');
  const shown = useMemo(() => searchLanguages(query), [query]);
  const current = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0];
  const floor = Math.floor(LANGUAGES.length / 10) * 10;

  return (
    <OnboardingShell
      step="language"
      t={t}
      rtl={rtl}
      amio={t('language_hello', { language: nativeName(current.label) })}
      button={t('continue')}
      onButton={onContinue}
    >
      <h1 id="language-title" className="font-display text-[2rem] leading-[1.05] tracking-tight">{t('language_ask')}</h1>
      <label className="relative block">
        <span className="sr-only">{t('language_search', { n: floor })}</span>
        <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('language_search', { n: floor })}
          className="w-full min-h-[3rem] rounded-button border-[1.5px] border-line bg-white ps-12 pe-4 text-base text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-denim"
        />
      </label>
      {note}
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="language-title">
        {shown.map((l) => {
          const on = l.value === language;
          const native = nativeName(l.label);
          const english = englishName(l.label);
          return (
            <button
              key={l.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onPick(l.value, l.label)}
              className={`min-h-[4rem] rounded-button px-2.5 py-2 flex items-center gap-2 text-start text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 ${on ? 'bg-sky border-[2.5px] border-navy font-extrabold' : 'bg-white border-[1.5px] border-line font-semibold hover:border-navy'}`}
            >
              <Amio size={32} lang={l.value} />
              <span className="min-w-0 text-base leading-tight">
                <span lang={l.value} dir="auto">{native}</span>
                {native !== english && <span className="sr-only"> ({english})</span>}
              </span>
            </button>
          );
        })}
      </div>
      {!shown.length && <p className="text-base text-muted text-center py-6">{t('language_none')}</p>}
    </OnboardingShell>
  );
}
