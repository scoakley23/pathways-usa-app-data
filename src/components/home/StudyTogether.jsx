import React from 'react';
import LanguageSelector from '@/components/lessons/LanguageSelector';
import { LANGUAGES } from '@/hooks/useLessonTranslation';

// "How we study together": the three promises on Today, as one numbered
// card. Answers come from the USCIS lists; learn in your language, answer in
// English (with the language menu right there); and what we never keep.
const ROWS = [
  { n: 1, tone: 'bg-pw-red-ink text-white', title: 'study_answers_title', body: 'study_answers_body' },
  { n: 2, tone: 'bg-pw-civics text-white', title: 'study_language_title', body: 'study_language_body', language: true },
  { n: 3, tone: 'bg-pw-sky text-pw-navy', title: 'study_privacy_title', body: 'study_privacy_body' },
];

export default function StudyTogether({ t, tutorName, language, onLanguageChange, translating }) {
  return (
    <section aria-labelledby="study-title" className="space-y-3 text-pw-navy">
      <h2 id="study-title" className="font-display text-[28px] sm:text-[32px] leading-tight">{t('study_title')}</h2>
      <ol className="grid grid-cols-1 lg:grid-cols-3 rounded-[14px] bg-white border border-pw-line overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-pw-line">
        {ROWS.map((row) => (
          <li key={row.n} className="flex lg:flex-col gap-4 lg:gap-2 p-4 sm:p-5">
            <span className={`grid place-items-center w-10 h-10 shrink-0 rounded-[10px] font-display text-[26px] leading-none ${row.tone}`} aria-hidden="true">{row.n}</span>
            <div className="space-y-1.5 min-w-0">
              <h3 className="text-[17px] font-semibold">{t(row.title)}</h3>
              <p className="text-base leading-relaxed text-pw-muted">
                {t(row.body).replace('{name}', tutorName).replace('{n}', LANGUAGES.length)}
              </p>
              {row.language && (
                <LanguageSelector language={language} onLanguageChange={onLanguageChange} translating={translating} className="mt-2 rounded-full" />
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
