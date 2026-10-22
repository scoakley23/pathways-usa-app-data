import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ListenButton } from './TutorMessage';
import useTutorProfile from './useTutorProfile';
import useTextSize from './useTextSize';
import { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { HOME_STRINGS } from '@/components/home/homeStrings';
import { Tag } from '@/components/pathways/ui';

// The first thing a new learner sees: their tutor introduces themself and
// offers one next step, the quick check. `t` translates the home strings.
export default function TutorIntro({ t, language = 'en' }) {
  const { profile } = useTutorProfile();
  const { className: sizeClass } = useTextSize();
  const fill = (s) => s.split('{name}').join(profile.name);
  const hello = fill(t('intro_hello'));
  const body = t('intro_body');
  const helloEn = fill(HOME_STRINGS.intro_hello);
  const showEnglish = language !== 'en' && hello !== helloEn;
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';

  return (
    <section aria-labelledby="tutor-intro-title" className={`rounded-[14px] bg-white border border-pw-line shadow-raised overflow-hidden text-pw-navy ${sizeClass}`}>
      <div className="p-5 sm:p-6 space-y-4">
        <Tag tone="navy">{t('intro_tag')}</Tag>
        <div dir={dir}>
          <h1 id="tutor-intro-title" className="text-[30px] sm:text-[36px] leading-tight font-extrabold tracking-[-0.5px]">{hello}</h1>
          <p className="mt-2 text-pw-muted leading-relaxed">{body}</p>
        </div>
        <p className="font-display italic text-lg text-pw-muted">— {profile.name}</p>
        {showEnglish && (
          <p className="text-pw-muted leading-relaxed border-l-4 border-pw-line pl-3">
            {helloEn} {HOME_STRINGS.intro_body}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <ListenButton text={`${hello} ${body}`} language={language} tutorName={profile.name} />
          {showEnglish && (
            <ListenButton text={`${helloEn} ${HOME_STRINGS.intro_body}`} language="en" label="English" tutorName={profile.name} />
          )}
        </div>
        {/* The one next step: tap here, not scroll. */}
        <div className="rounded-2xl bg-pw-soft p-3 sm:p-4 space-y-2">
          <p id="tutor-intro-first-step" className="text-base font-extrabold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pw-navy shrink-0" aria-hidden="true" /> {t('intro_first_step')}
          </p>
          <Link
            to="/quick-check"
            aria-describedby="tutor-intro-first-step"
            className="w-full min-h-[64px] rounded-2xl bg-pw-navy text-white font-extrabold text-xl flex items-center justify-center gap-2 px-4 text-center shadow-lift hover:bg-pw-navy-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
          >
            {t('qc_start')} <ArrowRight className="w-6 h-6 shrink-0" aria-hidden="true" />
          </Link>
          <p className="text-base text-pw-muted">{t('intro_time')}</p>
        </div>
        <p className="text-base font-bold">{t('hero_promise')}</p>
        <p className="text-base text-pw-muted">{t('intro_after')}</p>
      </div>
    </section>
  );
}
