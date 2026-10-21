import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import RoadmapHero from '@/components/home/RoadmapHero';
import QuickCheckCard from '@/components/persona/QuickCheckCard';
import RoadmapPath from '@/components/home/RoadmapPath';
import useRoadmapProgress from '@/components/home/useRoadmapProgress';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import useHomeTranslation from '@/hooks/useHomeTranslation';
import { Mic, BookOpen, GraduationCap, Notebook, FileText, FileQuestion, Search, ExternalLink } from 'lucide-react';


export default function Home({ cachedUser, cachedRole }) {
  const roadmap = useRoadmapProgress(cachedUser);
  const [language, setLanguage] = useAppLanguage();
  const { t, translating } = useHomeTranslation(language);
  const rtl = RTL_LANGUAGES.includes((language || 'en').slice(0, 2).toLowerCase());

  return (
    <div className="flex flex-col gap-8 pb-8" dir={rtl ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <RoadmapHero roadmap={roadmap} t={t} />
      {cachedUser && cachedRole !== 'tutor' && <QuickCheckCard variant="home" t={t} language={language} />}
      {/* Roadmap */}
      <RoadmapPath
        roadmap={roadmap}
        t={t}
        language={language}
        onLanguageChange={setLanguage}
        translating={translating}
      />

      {/* Features Section */}
      <section className="py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Link to={createPageUrl('Practice')} className="block">
            <Card className="h-full hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
            <CardContent className="p-5 md:p-8 space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EDF1F9', color: '#1F3A6B' }}>
                <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{t('feat_reading_title')}</h3>
                <p className="text-slate-600">
                {t('feat_reading_desc')}
                </p>
            </CardContent>
            </Card>
        </Link>

        <Link to={createPageUrl('Practice')} className="block">
            <Card className="h-full hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
            <CardContent className="p-5 md:p-8 space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#DEE7F5', color: '#1F3A6B' }}>
                <Mic className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{t('feat_dictation_title')}</h3>
                <p className="text-slate-600">
                {t('feat_dictation_desc')}
                </p>
            </CardContent>
            </Card>
        </Link>

        <Link to={createPageUrl('Practice')} className="block">
            <Card className="h-full hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
            <CardContent className="p-5 md:p-8 space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#B9C7E2', color: '#1F3A6B' }}>
                <Notebook className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{t('feat_vocab_title')}</h3>
                <p className="text-slate-600">
                {t('feat_vocab_desc')}
                </p>
            </CardContent>
            </Card>
        </Link>

        <Link to={createPageUrl('Practice')} className="block">
            <Card className="h-full hover:-translate-y-1 transition-transform duration-300 cursor-pointer">
            <CardContent className="p-5 md:p-8 space-y-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FBEAE9', color: '#D9483F' }}>
                <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{t('feat_civics_title')}</h3>
                <p className="text-slate-600">
                {t('feat_civics_desc')}
                </p>
            </CardContent>
            </Card>
        </Link>
      </section>

      {/* N-400 Question Guide */}
      <section>
        <Link to="/n400-guide" className="block">
          <Card className="hover:-translate-y-1 transition-transform duration-300 cursor-pointer rounded-2xl">
            <CardContent className="p-5 md:p-6 flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#EDF1F9', color: '#1F3A6B' }}>
                <FileQuestion className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{t('n400_title')}</h3>
                <p className="text-slate-600">{t('n400_desc')}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* USCIS Resources Section */}
      <section className="py-8">
        <Card className="overflow-hidden rounded-2xl">
          <div className="h-2 bg-slate-900" />
          <CardContent className="p-6 md:p-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                <ExternalLink className="w-12 h-12" style={{ color: '#1F3A6B' }} />
              </div>
              <div className="flex-1 space-y-3 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{t('ready_title')}</h2>
                <p className="text-slate-600 max-w-lg">
                  {t('ready_body')}
                </p>
                <p className="text-sm max-w-lg">
                  <Link to="/lawyer-first" className="underline font-semibold" style={{ color: '#1F3A6B' }}>
                    {t('ready_lawyer')}
                  </Link>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <a
                  href="https://www.uscis.gov/citizenship/apply-for-naturalization"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button size="lg" className="h-12 px-6 text-base whitespace-nowrap">
                    <FileText className="mr-2 w-5 h-5" /> {t('btn_apply')}
                  </Button>
                </a>
                <a
                  href="https://egov.uscis.gov/casestatus/landing.do"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button size="lg" variant="outline" className="h-12 px-6 text-base whitespace-nowrap border-slate-300 text-slate-700 hover:bg-slate-50">
                    <Search className="mr-2 w-5 h-5" /> {t('btn_case')}
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}