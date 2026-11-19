import React, { useMemo, useState } from 'react';
import { CheckCircle2, Search } from 'lucide-react';
import NavyBanner from '@/components/pathways/NavyBanner';
import { Button } from '@/components/pathways/ui';
import { LANGUAGES } from '@/lib/languages';

// Choose your language (Prompt 9, frame R30Language): a search box that
// matches the native or the English name, one row per language (native name
// over the English name), and "Continue in {language}".

export const nativeName = (label) => label.split(' (')[0];
export const englishName = (label) => (label.match(/\(([^)]+)\)/) || [])[1] || label;
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Languages whose native or English name contains the search words. */
export function searchLanguages(query, list = LANGUAGES) {
  const q = fold(query.trim());
  if (!q) return list;
  return list.filter((l) => fold(nativeName(l.label)).includes(q) || fold(englishName(l.label)).includes(q) || l.value === q);
}

export default function LanguageStep({ language, t, onPick, onContinue, note }) {
  const [query, setQuery] = useState('');
  const shown = useMemo(() => searchLanguages(query), [query]);
  const current = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0];
  const floor = Math.floor(LANGUAGES.length / 10) * 10;

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <NavyBanner
        title={t('language_title')}
        subtitle={t('language_sub')}
      />
      <div className="flex-1 max-w-lg w-full mx-auto px-4 py-4 flex flex-col gap-3">
        <label className="relative block">
          <span className="sr-only">{t('language_search', { n: floor })}</span>
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('language_search', { n: floor })}
            className="w-full min-h-[52px] rounded-2xl border border-line bg-white ps-12 pe-4 text-base text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-denim"
          />
        </label>
        {note}
        <div className="flex flex-col gap-2" role="radiogroup" aria-label={t('language_title')}>
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
                  className={`w-full min-h-[64px] rounded-card border-2 px-4 py-3 flex items-center gap-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${on ? 'border-denim bg-tint' : 'border-line bg-white hover:border-denim'}`}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-lg font-bold text-navy" lang={l.value} dir="auto">{native}</span>
                    {native !== english && <span className="block text-base text-muted">{english}</span>}
                  </span>
                  {on && <CheckCircle2 className="w-7 h-7 shrink-0 text-denim" aria-hidden="true" />}
                </button>
            );
          })}
        </div>
        {!shown.length && <p className="text-base text-muted text-center py-6">{t('language_none')}</p>}
      </div>
      <div className="sticky bottom-0 bg-paper px-4 pt-2 pb-6 max-w-lg w-full mx-auto">
        <Button variant="main" className="w-full" onClick={onContinue}>{t('continue_in', { language: nativeName(current.label) })}</Button>
      </div>
    </div>
  );
}
