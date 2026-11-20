import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Amio } from '@/components/pathways/Amio';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { englishName, nativeName, searchLanguages } from '@/components/onboarding/LanguageStep';

// Welcome's language list (a bottom sheet): the same rows as the first-open
// language step. Picking a language saves it on the device, so the language
// step after sign-in starts with it picked.
export default function WelcomeLanguageSheet({ open, onOpenChange, language, onPick, t, rtl }) {
  const [query, setQuery] = useState('');
  const shown = useMemo(() => searchLanguages(query), [query]);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" dir={rtl ? 'rtl' : 'ltr'} className="rounded-t-sheet bg-paper text-navy px-4 pt-6 pb-8 max-h-[85vh] overflow-y-auto">
        <SheetTitle className="pe-10 font-display text-[1.625rem] leading-tight text-navy" dir="auto">{t('language_ask')}</SheetTitle>
        <label className="relative block mt-3">
          <span className="sr-only">{t('language_search', { n: 60 })}</span>
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('language_search', { n: 60 })}
            className="w-full min-h-[3rem] rounded-button border-[1.5px] border-line bg-white ps-12 pe-4 text-base text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-denim"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('language_ask')}>
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
                onClick={() => { onPick(l.value); onOpenChange(false); }}
                className={`min-h-[3.5rem] rounded-button px-2.5 py-2 flex items-center gap-2 text-start text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${on ? 'bg-sky border-[2.5px] border-navy font-extrabold' : 'bg-white border-[1.5px] border-line font-semibold hover:border-navy'}`}
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
      </SheetContent>
    </Sheet>
  );
}
