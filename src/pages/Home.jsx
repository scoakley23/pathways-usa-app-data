import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TopicArt from '@/components/art/TopicArt';
import RoadmapHero from '@/components/home/RoadmapHero';
import StartHereCard from '@/components/home/StartHereCard';
import TodayCard from '@/components/persona/TodayCard';
import RoadmapPath from '@/components/home/RoadmapPath';
import HomePromises from '@/components/home/HomePromises';
import StudyTogether from '@/components/home/StudyTogether';
import HelpUsImprove from '@/components/pilot/HelpUsImprove';
import { shouldShowPilotIntro } from '@/lib/pilot';
import { loadPlanSettings } from '@/lib/planSettings';
import useTutorProfile from '@/components/persona/useTutorProfile';
import { useAuth } from '@/lib/AuthContext';
import useRoadmapProgress from '@/components/home/useRoadmapProgress';
import useAppLanguage, { isRTL } from '@/hooks/useAppLanguage';
import useHomeTranslation from '@/hooks/useHomeTranslation';
import { ArrowRight } from 'lucide-react';
import { SKILL_BG, SkillTag } from '@/components/pathways/ui';

// "Practice one skill": each card opens that skill's practice directly.
const SKILL_CARDS = [
  { art: 'book', skill: 'reading', title: 'feat_reading_title', desc: 'feat_reading_desc', to: '/Practice?mode=reading' },
  { art: 'pencil', skill: 'writing', title: 'feat_dictation_title', desc: 'feat_dictation_desc', to: '/Practice?mode=dictation' },
  { art: 'cards', skill: 'writing', title: 'feat_vocab_title', desc: 'feat_vocab_desc', to: '/Practice' },
  { art: 'capitol', skill: 'civics', title: 'feat_civics_title', desc: 'feat_civics_desc', to: '/Practice?mode=civics' },
];

// Set once the learner answers or skips "Help us improve Pathways", so the
// screen doesn't come back before Layout reloads the account.
let pilotAnswered = false;

// Home. Learners see Today and nothing else but "How we study together" (the
// three promises): the rest of the app is one tap away in the tab bar.
// Signed-out visitors see the splash and the overview (road, promises, the
// four skills, the N-400 guide). The language menu is in the header.
export default function Home({ cachedUser }) {
  const roadmap = useRoadmapProgress(cachedUser);
  const [language, setLanguage] = useAppLanguage();
  const { t, translating } = useHomeTranslation(language);
  const { profile } = useTutorProfile();
  const rtl = isRTL(language);
  // (Auth is known before pages render, so signed-in users never see the splash.)
  const { isAuthenticated } = useAuth();
  const learner = isAuthenticated && cachedUser;
  // "Help us improve Pathways" (optional pilot questions): once, after the
  // learner's first day, instead of Today.
  const [pilotDone, setPilotDone] = useState(pilotAnswered);
  const askPilot = learner && !pilotDone && shouldShowPilotIntro({ user: cachedUser, hasPlan: !!loadPlanSettings() });

  // Signed in but the account is still loading: wait rather than flash the overview.
  if (isAuthenticated && !cachedUser) {
    return <div className="min-h-[60vh]" aria-busy="true" />;
  }

  if (askPilot) {
    return (
      <div className="pb-8" dir={rtl ? 'rtl' : 'ltr'}>
        <HelpUsImprove user={cachedUser} language={language} onDone={() => { pilotAnswered = true; setPilotDone(true); }} />
      </div>
    );
  }

  if (learner) {
    return (
      <div className="flex flex-col gap-10 pb-8" dir={rtl ? 'rtl' : 'ltr'}>
        <TodayCard language={language} />
        <StudyTogether t={t} tutorName={profile.name} language={language} onLanguageChange={setLanguage} translating={translating} />
      </div>
    );
  }

  const hero = !isAuthenticated ? <StartHereCard t={t} /> : <RoadmapHero roadmap={roadmap} t={t} />;

  return (
    <div className="flex flex-col gap-6 pb-8" dir={rtl ? 'rtl' : 'ltr'}>
      {hero}
      <RoadmapPath roadmap={roadmap} t={t} language={language} />

      {/* Official USCIS answers; learn in your language, test in English */}
      <HomePromises t={t} />

      {/* Practice one skill */}
      <section aria-labelledby="practice-title" className="space-y-3">
        <div>
          <h2 id="practice-title" className="text-[28px] font-display font-normal text-pw-navy">{t('practice_title')}</h2>
          <p className="text-base text-pw-muted">{t('practice_desc')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SKILL_CARDS.map((f) => (
          <Link
            key={f.title}
            to={f.to}
            className="group flex sm:flex-col items-stretch rounded-[14px] bg-white border border-pw-line shadow-raised overflow-hidden hover:-translate-y-0.5 hover:shadow-lift transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2"
          >
            <div className={`w-24 sm:w-auto shrink-0 ${SKILL_BG[f.skill]} px-2 sm:px-4 pt-3 pb-2 grid place-items-center`}>
              <TopicArt name={f.art} className="w-full h-14 sm:h-16" accent={false} />
            </div>
            <div className="p-4 sm:p-5 space-y-1 sm:space-y-2 min-w-0">
              <SkillTag skill={f.skill} />
              <h3 className="text-xl font-extrabold text-pw-navy flex items-center justify-between gap-2">
                {t(f.title)} <ArrowRight className="w-5 h-5 text-pw-muted group-hover:text-pw-navy shrink-0" aria-hidden="true" />
              </h3>
              <p className="text-base text-pw-muted">{t(f.desc)}</p>
            </div>
          </Link>
        ))}
        </div>
      </section>

      {/* N-400 Question Guide */}
      <section>
        <Link
          to="/n400-guide"
          className="group flex items-stretch rounded-[14px] bg-white border border-pw-line shadow-raised overflow-hidden hover:-translate-y-0.5 hover:shadow-lift transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2"
        >
          <div className={`w-24 sm:w-40 shrink-0 ${SKILL_BG.n400} px-2 grid place-items-center`}>
            <TopicArt name="scroll" className="w-full h-14" accent={false} />
          </div>
          <div className="min-w-0 flex-1 p-4 sm:p-5 space-y-1">
            <SkillTag skill="n400" />
            <h3 className="text-xl font-extrabold text-pw-navy">{t('n400_title')}</h3>
            <p className="text-base text-pw-muted">{t('n400_desc')}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-pw-muted group-hover:text-pw-navy shrink-0 self-center mr-4" aria-hidden="true" />
        </Link>
      </section>

    </div>
  );
}