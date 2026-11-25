import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { auth } from '@/api/auth';
import { Button } from '@/components/pathways/ui';
import InterviewDayGuide from '@/components/interview-day/InterviewDayGuide';
import FullDayCall from '@/components/interview-day/FullDayCall';
import useDayText from '@/components/interview-day/useDayText';
import { CIVICS_TEST_RULES } from '@/lib/interviewDay';

// Default civics version: the learner's current Practice choice (read only;
// this page never writes browser storage), else 2025.
function defaultVersion() {
  try {
    const v = localStorage.getItem('civicsVersion');
    return CIVICS_TEST_RULES[v] ? v : '2025';
  } catch {
    return '2025';
  }
}

// Interview Day (/interview-day, Amio v2): "What happens on the day" and
// "Practice the whole day", which opens the whole-day call full screen
// (/interview-day?call=1; Layout hides the header, tabs and footer). The call
// saves nothing: no records and no browser storage. Its answers and results
// live only in page memory.
export default function InterviewDay() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { t, rtl } = useDayText();
  const [user, setUser] = useState(undefined);
  const [version, setVersion] = useState(defaultVersion);
  const calling = params.get('call') === '1';

  useEffect(() => { auth.me().then(setUser).catch(() => setUser(null)); }, []);

  const start = () => { navigate('/interview-day?call=1'); window.scrollTo({ top: 0 }); };
  const stop = () => { navigate('/interview-day', { replace: true }); window.scrollTo({ top: 0 }); };
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/interview'));

  if (calling && user) {
    return <div dir={rtl ? 'rtl' : 'ltr'}><FullDayCall version={version} t={t} onStop={stop} /></div>;
  }

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-paper text-navy">
      <div className="max-w-lg mx-auto px-4 pt-3 pb-6 flex flex-col gap-5">
        <button type="button" onClick={back} aria-label={t('back')} className="w-11 h-11 -ms-2 grid place-items-center rounded-button text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
          <ChevronLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
        </button>
        <div>
          <h1 className="font-display text-[2rem] leading-tight tracking-tight" dir="auto">{t('title')}</h1>
          <p className="mt-1 text-base text-muted" dir="auto">{t('subtitle')}</p>
        </div>

        <InterviewDayGuide t={t} version={version} />

        <section aria-labelledby="day-practice" className="rounded-card bg-navy text-white p-5 flex flex-col gap-4">
          <h2 id="day-practice" className="font-display text-[1.625rem] leading-tight" dir="auto">{t('practice_title')}</h2>
          <p className="text-base text-on-navy" dir="auto">{t('practice_body')}</p>
          {user === undefined ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto" aria-hidden="true" />
          ) : user ? (
            <>
              <fieldset>
                <legend className="text-base font-semibold" dir="auto">{t('test_version')}</legend>
                <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup">
                  {['2025', '2008'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={version === v}
                      onClick={() => setVersion(v)}
                      className={`min-h-[3rem] rounded-button px-3 text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${version === v ? 'bg-sky text-navy border-[2.5px] border-white' : 'bg-navy-2 text-white border-[1.5px] border-navy-line'}`}
                    >
                      {t(`v${v}`)}
                    </button>
                  ))}
                </div>
              </fieldset>
              <Button variant="main" onNavy className="w-full" onClick={start}>{t('start')}</Button>
            </>
          ) : (
            <>
              <p className="text-base" dir="auto">{t('sign_in_body')}</p>
              <Button variant="main" onNavy className="w-full" onClick={() => auth.goToSignIn('/interview-day')}>{t('sign_in')}</Button>
            </>
          )}
          <p className="text-small text-on-navy" dir="auto">{t('nothing_saved')}</p>
        </section>
      </div>
    </div>
  );
}
