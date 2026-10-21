import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import TutorAvatar from './TutorAvatar';
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
    <section aria-labelledby="tutor-intro-title" className={`rounded-3xl bg-white border border-pw-line shadow-raised overflow-hidden text-pw-navy ${sizeClass}`}>
      {/* The tutor stands at the start of the path. */}
      <div className="relative bg-pw-blue-soft px-5 pt-6 pb-5 flex items-end gap-4">
        <svg viewBox="0 0 200 60" className="absolute inset-x-0 bottom-0 w-full h-16" preserveAspectRatio="none" aria-hidden="true">
          <path d="M10 50c40 0 50-24 90-24s60-14 90-16" fill="none" stroke="#9AA8C2" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.5 9" />
          <circle cx="190" cy="10" r="5" fill="#D9483F" />
        </svg>
        <span className="relative rounded-full bg-white p-1.5 shadow-lift">
          <TutorAvatar avatar={profile.avatar} size={104} decorative expression="greeting" />
        </span>
        <div className="relative pb-2">
          <Tag tone="navy">{t('intro_tag')}</Tag>
        </div>
      </div>
      <div className="p-5 sm:p-6 space-y-4">
        <div dir={dir}>
          <h1 id="tutor-intro-title" className="text-[30px] sm:text-[36px] leading-tight font-extrabold tracking-[-0.5px]">{hello}</h1>
          <p className="mt-2 text-pw-muted leading-relaxed">{body}</p>
        </div>
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
        <Link
          to="/quick-check"
          className="w-full min-h-[56px] rounded-2xl bg-pw-navy text-white font-bold text-lg flex items-center justify-center gap-2 px-4 text-center shadow-lift hover:bg-pw-navy-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
        >
          {t('qc_start')} <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
        </Link>
        <p className="text-base text-pw-muted">{t('intro_time')}</p>
        <p className="text-base font-bold">{t('hero_promise')}</p>
      </div>
    </section>
  );
}
