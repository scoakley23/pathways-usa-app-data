import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TopicArt from '@/components/art/TopicArt';
import RoadmapHero from '@/components/home/RoadmapHero';
import TodayCard from '@/components/persona/TodayCard';
import RoadmapPath from '@/components/home/RoadmapPath';
import useRoadmapProgress from '@/components/home/useRoadmapProgress';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import useHomeTranslation from '@/hooks/useHomeTranslation';
import { ArrowRight, FileText, Search } from 'lucide-react';


export default function Home({ cachedUser, cachedRole }) {
  const roadmap = useRoadmapProgress(cachedUser);
  const [language, setLanguage] = useAppLanguage();
  const { t, translating } = useHomeTranslation(language);
  const rtl = RTL_LANGUAGES.includes((language || 'en').slice(0, 2).toLowerCase());

  return (
    <div className="flex flex-col gap-6 pb-8" dir={rtl ? 'rtl' : 'ltr'}>
      {/* Today (learners with a plan) or "Start with a quick check" */}
      {cachedUser && cachedRole !== 'tutor' && <TodayCard language={language} homeT={t} />}
      {/* Hero Section */}
      <RoadmapHero roadmap={roadmap} t={t} />
      {/* Roadmap */}
      <RoadmapPath
        roadmap={roadmap}
        t={t}
        language={language}
        onLanguageChange={setLanguage}
        translating={translating}
      />

      {/* Features Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { art: 'book', title: 'feat_reading_title', desc: 'feat_reading_desc' },
          { art: 'pencil', title: 'feat_dictation_title', desc: 'feat_dictation_desc' },
          { art: 'scroll', title: 'feat_vocab_title', desc: 'feat_vocab_desc' },
          { art: 'capitol', title: 'feat_civics_title', desc: 'feat_civics_desc' },
        ].map((f) => (
          <Link
            key={f.title}
            to={createPageUrl('Practice')}
            className="group flex sm:flex-col items-stretch rounded-3xl bg-white border border-pw-line shadow-raised overflow-hidden hover:-translate-y-0.5 hover:shadow-lift transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
          >
            <div className="w-24 sm:w-auto shrink-0 bg-pw-blue-soft px-2 sm:px-4 pt-3 pb-2 grid place-items-center">
              <TopicArt name={f.art} className="w-full h-14 sm:h-16" accent={false} />
            </div>
            <div className="p-4 sm:p-5 space-y-1 sm:space-y-2 min-w-0">
              <h3 className="text-xl font-extrabold text-pw-navy flex items-center justify-between gap-2">
                {t(f.title)} <ArrowRight className="w-5 h-5 text-pw-muted group-hover:text-pw-navy shrink-0" aria-hidden="true" />
              </h3>
              <p className="text-base text-pw-muted">{t(f.desc)}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* N-400 Question Guide */}
      <section>
        <Link
          to="/n400-guide"
          className="group flex items-stretch rounded-3xl bg-white border border-pw-line shadow-raised overflow-hidden hover:-translate-y-0.5 hover:shadow-lift transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
        >
          <div className="w-24 sm:w-40 shrink-0 bg-pw-blue-soft px-2 grid place-items-center">
            <TopicArt name="scroll" className="w-full h-14" accent={false} />
          </div>
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <h3 className="text-xl font-extrabold text-pw-navy">{t('n400_title')}</h3>
            <p className="text-base text-pw-muted">{t('n400_desc')}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-pw-muted group-hover:text-pw-navy shrink-0 self-center mr-4" aria-hidden="true" />
        </Link>
      </section>

      {/* USCIS Resources Section */}
      <section>
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
                className="min-h-[52px] rounded-2xl bg-pw-navy text-white font-bold text-base inline-flex items-center justify-center gap-2 px-6 hover:bg-[#0F1B36] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
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