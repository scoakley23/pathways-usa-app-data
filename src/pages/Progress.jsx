import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Award, Target } from 'lucide-react';
import { progress as progressApi } from '@/api/progress';
import { content } from '@/api/content';
import { auth } from '@/api/auth';
import { createPageUrl } from '@/utils';
import PracticeCalendar from '@/components/progress/PracticeCalendar';
import ProgressChart from '@/components/progress/ProgressChart';
import InterviewHistory from '@/components/practice/InterviewHistory';
import TestDateTracker from '@/components/progress/TestDateTracker';
import ThisWeekCard from '@/components/progress/ThisWeekCard';
import QuickCheckCard from '@/components/persona/QuickCheckCard';
import { AmioSays } from '@/components/pathways/Amio';
import { Card } from '@/components/pathways/ui';
import useProgressText from '@/components/progress/useProgressText';

// Progress (/Progress, Amio v2, amio-v2/one-tap-me): a paper page with Back
// and the title, Amio's line, this week (civics ready, days practiced, the
// week row), the device-only test date, the quick check results, the totals
// and test preparedness, the practice calendar, past practice interviews
// (scores only), the score chart and recent activity. "Your road" is gone
// (the Interview tab shows the five parts). Badges stay hidden. Wording in
// src/components/progress/progressStrings.js. Reads only; saves nothing new.

export default function Progress() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, mastered: 0 });
  const [userData, setUserData] = useState(null);
  const { t, language, date, time, rtl } = useProgressText();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const user = await auth.me().catch(() => null);
      if (!user) {
        setIsLoading(false);
        return;
      }
      setUserData(user);

      // Fetch Progress
      // The learner's own rows only (src/api/progress.js).
      const userProgress = await progressApi.list();
      
      // Fetch Content for mapping names
      const [sentences, vocab, questions] = await Promise.all([
        content.writingSentences(),
        content.vocabularyWords(),
        content.civicsQuestions()
      ]);

      const contentMap = {
        sentence: sentences.reduce((acc, s) => ({...acc, [s.id]: s}), {}),
        vocabulary: vocab.reduce((acc, s) => ({...acc, [s.id]: s}), {}),
        civics_question: questions.reduce((acc, s) => ({...acc, [s.id]: s}), {})
      };

      const enrichedHistory = userProgress.map(p => ({
        ...p,
        content: contentMap[p.content_type || 'sentence']?.[p.content_id] || {}
      })).sort((a, b) => new Date(b.last_practiced) - new Date(a.last_practiced));

      setHistory(enrichedHistory);
      setStats({
        total: enrichedHistory.length,
        mastered: enrichedHistory.filter(p => p.status === 'mastered').length
      });
      
    } catch (error) {
      console.error("Error fetching progress", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-base text-muted" dir="auto">{t('loading')}</div>;

  // Preparedness: mastered items out of 100, capped at 100.
  const preparedness = Math.min(Math.round((stats.mastered / 100) * 100), 100);
  const tileLink = 'block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2';
  const big = 'font-display text-[2.5rem] leading-none tabular-nums';

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-paper text-navy">
      <div className="mx-auto max-w-lg px-4 pt-4 pb-8 flex flex-col gap-5">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/me'))}
            aria-label={t('back')}
            className="w-11 h-11 shrink-0 -ms-2 grid place-items-center rounded-full text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
          >
            <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
          </button>
          <div className="min-w-0 pt-1">
            <h1 className="font-display text-[1.75rem] leading-tight" dir="auto">{t('title')}</h1>
            <p className="text-base text-muted" dir="auto">{t('subtitle')}</p>
          </div>
        </div>
        <AmioSays mood="proud" size={56}>{t('amio')}</AmioSays>

        <ThisWeekCard language={language} />
        <TestDateTracker />
        <QuickCheckCard variant="progress" language={language} />

        {/* Totals and test preparedness */}
        <div className="grid grid-cols-2 gap-2">
          <Link to={createPageUrl('StudyHistory')} className={tileLink}>
            <Card padding="p-4" className="h-full hover:border-navy">
              <div className="flex items-start justify-between">
                <Clock className="w-6 h-6" aria-hidden="true" />
                <ArrowRight className="w-5 h-5 text-muted rtl:rotate-180" aria-hidden="true" />
              </div>
              <p className={`mt-3 ${big}`}>{stats.total}</p>
              <p className="mt-1 text-base font-semibold" dir="auto">{t('total_practiced')}</p>
              <p className="text-small text-muted" dir="auto">{t('total_sub')}</p>
            </Card>
          </Link>
          <Link to={createPageUrl('Dashboard')} className={tileLink}>
            <Card padding="p-4" className="h-full hover:border-navy">
              <div className="flex items-start justify-between">
                <Award className="w-6 h-6" aria-hidden="true" />
                <ArrowRight className="w-5 h-5 text-muted rtl:rotate-180" aria-hidden="true" />
              </div>
              <p className={`mt-3 ${big}`}>{stats.mastered}</p>
              <p className="mt-1 text-base font-semibold" dir="auto">{t('mastered')}</p>
              <p className="text-small text-muted" dir="auto">{t('mastered_sub')}</p>
            </Card>
          </Link>
          <Card padding="p-4" className="col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Target className="w-6 h-6 shrink-0" aria-hidden="true" />
                <h2 className="text-lg font-bold" dir="auto">{t('preparedness')}</h2>
              </div>
              <span className={big}>{preparedness}%</span>
            </div>
            <div className="mt-3 h-3 rounded-[6px] bg-line-soft overflow-hidden" role="progressbar" aria-valuenow={preparedness} aria-valuemin={0} aria-valuemax={100} aria-label={t('preparedness')}>
              <div className="h-full bg-gold" style={{ width: `${preparedness}%` }} />
            </div>
            <p className="mt-2 text-small text-muted" dir="auto">{t('preparedness_note')}</p>
          </Card>
        </div>

        <PracticeCalendar history={history} />
        {/* Past practice interview scores: scores only, never what was said. */}
        <InterviewHistory />
        <ProgressChart userEmail={userData?.email} />
        {/* Badges (BadgesDisplay) are hidden from learners (Amio v2); the data stays. */}

        {/* Recent activity */}
        <section aria-labelledby="recent" className="flex flex-col gap-2">
          <h2 id="recent" className="text-lg font-bold" dir="auto">{t('recent')}</h2>
          {history.length > 0 ? (
            <ul tabIndex={0} aria-labelledby="recent" className="flex flex-col gap-2 max-h-[600px] overflow-y-auto list-none m-0 p-0 rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
              {history.map((item) => (
                <li key={item.id} className="rounded-card border-[1.5px] border-line bg-white p-4">
                  <p className="text-small text-muted" dir="auto">
                    {item.last_practiced ? `${date(item.last_practiced, { month: 'short', day: 'numeric' })} · ${time(item.last_practiced)}` : ''}
                  </p>
                  <p className="mt-1 font-semibold text-base line-clamp-2" lang="en" dir="ltr">
                    {item.content?.text || item.content?.word || item.content?.question || ''}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="rounded-button bg-line-soft px-3 py-1 text-small font-semibold" dir="auto">
                      {t(`type_${item.content_type || 'sentence'}`)}
                    </span>
                    {item.status === 'mastered' ? (
                      <CheckCircle className="w-5 h-5 text-correct" aria-label={t('status_mastered')} />
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-line" aria-hidden="true" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-card bg-white border-[1.5px] border-line p-4 text-base text-muted" dir="auto">{t('no_history')}</p>
          )}
        </section>
      </div>
    </div>
  );
}
