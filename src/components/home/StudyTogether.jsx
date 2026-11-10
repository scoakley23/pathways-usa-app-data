import React from 'react';
import LanguageSelector from '@/components/lessons/LanguageSelector';
import useAppLanguage from '@/hooks/useAppLanguage';
import useHomeTranslation from '@/hooks/useHomeTranslation';
import useTutorProfile from '@/components/persona/useTutorProfile';
import { LANGUAGES } from '@/hooks/useLessonTranslation';

// "How we study together": the three promises, as one numbered card. Answers
// come from the USCIS lists; learn in your language, answer in English (with
// the language menu, unless `showLanguage` is off); and what we never keep.
// Shown on the Getting started welcome and on Profile (StudyTogetherCard).
const ROWS = [
  { n: 1, tone: 'bg-navy text-white', title: 'study_answers_title', body: 'study_answers_body' },
  { n: 2, tone: 'bg-navy text-white', title: 'study_language_title', body: 'study_language_body', language: true },
  { n: 3, tone: 'bg-navy text-white', title: 'study_privacy_title', body: 'study_privacy_body' },
];

export default function StudyTogether({ t, tutorName, language, onLanguageChange, translating, showLanguage = true, headingLevel = 2 }) {
  const H = `h${headingLevel}`;
  const Sub = `h${headingLevel + 1}`;
  return (
    <section aria-labelledby="study-title" className="space-y-3 text-pw-navy">
      <H id="study-title" className="font-display text-[22px] leading-tight text-ink">{t('study_title')}</H>
      <ol className="grid grid-cols-1 lg:grid-cols-3 rounded-card bg-white border border-pw-line overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-pw-line">
        {ROWS.map((row) => (
          <li key={row.n} className="flex lg:flex-col gap-4 lg:gap-2 p-4 sm:p-5">
            <span className={`grid place-items-center w-10 h-10 shrink-0 rounded-full font-display text-[20px] leading-none ${row.tone}`} aria-hidden="true">{row.n}</span>
            <div className="space-y-1.5 min-w-0">
              <Sub className="font-sans text-[17px] font-semibold tracking-normal">{t(row.title)}</Sub>
              <p className="text-base leading-relaxed text-pw-muted">
                {t(row.body).replace('{name}', tutorName).replace('{n}', LANGUAGES.length)}
              </p>
              {row.language && showLanguage && (
                <LanguageSelector language={language} onLanguageChange={onLanguageChange} translating={translating} className="mt-2 rounded-full" />
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// The same card, loading its own text (language, tutor name, translation).
export function StudyTogetherCard({ showLanguage = false, headingLevel = 2 }) {
  const [language, setLanguage] = useAppLanguage();
  const { t, translating } = useHomeTranslation(language);
  const { profile } = useTutorProfile();
  return (
    <StudyTogether
      t={t}
      tutorName={profile.name}
      language={language}
      onLanguageChange={setLanguage}
      translating={translating}
      showLanguage={showLanguage}
      headingLevel={headingLevel}
    />
  );
}
