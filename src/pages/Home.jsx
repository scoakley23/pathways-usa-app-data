import React from 'react';
import { Link } from 'react-router-dom';
import TopicArt from '@/components/art/TopicArt';
import RoadmapHero from '@/components/home/RoadmapHero';
import StartHereCard from '@/components/home/StartHereCard';
import TodayCard from '@/components/persona/TodayCard';
import RoadmapPath from '@/components/home/RoadmapPath';
import LanguageSelector from '@/components/lessons/LanguageSelector';
import HomePromises from '@/components/home/HomePromises';
import { useAuth } from '@/lib/AuthContext';
import useRoadmapProgress from '@/components/home/useRoadmapProgress';
import useAppLanguage, { isRTL } from '@/hooks/useAppLanguage';
import useHomeTranslation from '@/hooks/useHomeTranslation';
import { ArrowRight, FileText, Search } from 'lucide-react';
import { SKILL_BG, SkillTag } from '@/components/pathways/ui';

// "Practice one skill": each card opens that skill's practice directly.
const SKILL_CARDS = [
  { art: 'book', skill: 'reading', title: 'feat_reading_title', desc: 'feat_reading_desc', to: '/Practice?mode=reading' },
  { art: 'pencil', skill: 'writing', title: 'feat_dictation_title', desc: 'feat_dictation_desc', to: '/Practice?mode=dictation' },
  { art: 'cards', skill: 'writing', title: 'feat_vocab_title', desc: 'feat_vocab_desc', to: '/Practice' },
  { art: 'capitol', skill: 'civics', title: 'feat_civics_title', desc: 'feat_civics_desc', to: '/Practice?mode=civics' },
];


export default function Home({ cachedUser, cachedRole }) {
  const roadmap = useRoadmapProgress(cachedUser);
  const [language, setLanguage] = useAppLanguage();
  const { t, translating } = useHomeTranslation(language);
  // /?ready=1 (end of the N-400 coach) jumps to "Ready to file?".
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get('ready')) {
      setTimeout(() => document.getElementById('ready-to-file')?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  }, []);
  const rtl = isRTL(language);
  // Learners start with their tutor (Today, or the tutor's introduction);
  // signed-out visitors see "Start here"; tutors see the overview hero.
  // (Auth is known before pages render, so signed-in users never see it.)
  const { isAuthenticated } = useAuth();
  const learner = cachedUser && cachedRole !== 'tutor';
  const hero = !isAuthenticated
    ? <StartHereCard t={t} />
    : learner ? <TodayCard language={language} homeT={t} /> : <RoadmapHero roadmap={roadmap} t={t} />;

  return (
    <div className="flex flex-col gap-6 pb-8" dir={rtl ? 'rtl' : 'ltr'}>
      {/* Language first, so even the first card can be read in it */}
      <div className="flex justify-end -mb-2">
        <LanguageSelector language={language} onLanguageChange={setLanguage} translating={translating} />
      </div>
      {/* Today / the tutor's introduction (learners), Start here (signed out) */}
      {hero}
      {/* Roadmap */}
      <RoadmapPath roadmap={roadmap} t={t} language={language} />

      {/* Official USCIS answers; learn in your language, test in English */}
      <HomePromises t={t} />

      {/* Practice one skill */}
      <section aria-labelledby="practice-title" className="space-y-3">
        <div>
          <h2 id="practice-title" className="text-2xl font-extrabold tracking-[-0.5px] text-pw-navy">{t('practice_title')}</h2>
          <p className="text-base text-pw-muted">{t('practice_desc')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SKILL_CARDS.map((f) => (
          <Link
            key={f.title}
            to={f.to}
            className="group flex sm:flex-col items-stretch rounded-3xl bg-white border border-pw-line shadow-raised overflow-hidden hover:-translate-y-0.5 hover:shadow-lift transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
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
          className="group flex items-stretch rounded-3xl bg-white border border-pw-line shadow-raised overflow-hidden hover:-translate-y-0.5 hover:shadow-lift transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
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

      {/* USCIS Resources Section ("Ready to file?") */}
      <section id="ready-to-file" className="scroll-mt-24">
        <div className="rounded-3xl bg-white border border-pw-line shadow-raised overflow-hidden text-pw-navy">
          <div className="bg-pw-blue-soft px-5 pt-4 pb-3">
            <TopicArt name="flag" className="w-full h-20" />
          </div>
          <div className="p-5 sm:p-8 space-y-4">
            <h2 className="text-2xl md:text-3xl font-extrabold">{t('ready_title')}</h2>
            <p className="text-base text-pw-muted max-w-xl">{t('ready_body')}</p>
            <p className="text-base">
              <Link to="/lawyer-first" className="font-bold underline underline-offset-4 decoration-pw-red/60 hover:decoration-pw-red">
                {t('ready_lawyer')}
              </Link>
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://www.uscis.gov/citizenship/apply-for-naturalization"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[52px] rounded-2xl bg-pw-navy text-white font-bold text-base inline-flex items-center justify-center gap-2 px-6 hover:bg-pw-navy-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
              >
                <FileText className="w-5 h-5" /> {t('btn_apply')}
              </a>
              <a
                href="https://egov.uscis.gov/casestatus/landing.do"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[52px] rounded-2xl bg-white border-2 border-pw-navy text-pw-navy font-bold text-base inline-flex items-center justify-center gap-2 px-6 hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
              >
                <Search className="w-5 h-5" /> {t('btn_case')}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}