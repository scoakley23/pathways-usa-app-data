import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, RotateCcw, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import { review } from '@/api/review';
import { content } from '@/api/content';
import { auth } from '@/api/auth';
import TopicArt, { TOPIC_ART } from '@/components/art/TopicArt';
import TutorLesson from '@/components/persona/TutorLesson';
import TutorMessage from '@/components/persona/TutorMessage';
import useTutorProfile from '@/components/persona/useTutorProfile';
import OfficeholderNote from '@/components/civics/OfficeholderNote';
import useLearnerLocation from '@/components/civics/useLearnerLocation';
import { languageNameFor } from '@/components/persona/languageName';
import { Button, Card, MAIN_LINK } from '@/components/pathways/ui';
import useLearnText from '@/components/lessons/useLearnText';
import { splitOfficialAnswers } from '@/lib/practiceChecks';
import { officeholderAnswerFor } from '@/lib/officeholderQuestions';
import { awardBadges } from '@/lib/awardBadges';

const secondLink = 'min-h-tap w-full inline-flex items-center justify-center rounded-button border-[1.5px] border-line bg-white px-5 text-base font-semibold text-navy hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim';

function SignInMessage() {
  const { t } = useLearnText();
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-3 px-4 text-navy">
      <CalendarCheck className="w-10 h-10" aria-hidden="true" />
      <h1 className="font-display text-[1.75rem] leading-tight" dir="auto">{t('sign_in_review')}</h1>
      <p className="text-base text-muted" dir="auto">{t('sign_in_review_sub')}</p>
    </div>
  );
}

// Spaced review (Prompt 7, step 4): due civics questions as quick checks,
// feedback for the whole set at the end, then the same SM-2 schedule as
// Practice. Saves only scores and the schedule; answers stay in memory.
export default function ReviewCivics() {
  const { profile, loaded } = useTutorProfile();
  const { location: learnerLocation } = useLearnerLocation();
  const { t, amio, language, rtl } = useLearnText();
  const whenLabel = (days) => (days <= 0 ? t('again_soon') : days === 1 ? t('next_tomorrow') : t('next_days', { n: days }));
  const [user, setUser] = useState(undefined);
  const [due, setDue] = useState(null); // [{ entry, question }]
  const [nextDate, setNextDate] = useState(null);
  const [stage, setStage] = useState('intro'); // intro | lesson | done
  const [results, setResults] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    setDue(null);
    try {
      // src/api/review.js: Base44's old schedule or Supabase's review_items.
      const questions = await content.civicsQuestions({ limit: 1000 });
      const byId = new Map(questions.filter((q) => q.answer).map((q) => [q.id, q]));
      const knownIds = new Set(byId.keys());
      const [entries, next] = await Promise.all([review.due({ knownIds }), review.nextDue({ knownIds })]);
      setDue(entries.map((entry) => ({ entry, question: byId.get(entry.questionId) })));
      setNextDate(next);
    } catch {
      toast.error(t('load_review_error'));
      setDue([]);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const lesson = useMemo(() => (due ? {
    id: 'review-civics',
    title: 'Review civics',
    posters: true,
    steps: due.map(({ question }) => ({ type: 'practice-speaking', question, mode: 'check', part: 'civics' })),
  } : null), [due]);

  const finish = async ({ states }) => {
    const now = new Date();
    const outcome = due.map(({ entry, question }, i) => {
      const c = states[i]?.outcome?.correct;
      const correct = !!c;
      // null = an officeholder answer that couldn't be graded: schedule unchanged
      return { entry, question, correct, ungraded: c === null, heard: states[i]?.heard || null, next: c === null ? null : review.plan(entry, correct, now) };
    });
    setResults(outcome);
    setStage('done');
    window.scrollTo({ top: 0 });
    setSaving(true);
    try {
      for (const { entry, next, correct } of outcome) if (next) await review.commit(entry, next, correct, now);
      awardBadges();
    } catch {
      toast.error(t('save_error'));
    } finally {
      setSaving(false);
    }
  };

  if (user === undefined || !loaded) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-16 text-navy" />;
  if (!user) return <SignInMessage />;
  if (!lesson) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-16 text-navy" />;

  if (stage === 'lesson') {
    return (
      <TutorLesson
        lesson={lesson}
        profile={profile}
        language={language}
        languageName={languageNameFor(language)}
        onFinish={finish}
        onExit={() => setStage('intro')}
      />
    );
  }

  const art = TOPIC_ART[due[0]?.question.category] || 'compass';
  const right = results.filter((r) => r.correct).length;
  const graded = results.filter((r) => !r.ungraded).length;

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-paper text-navy">
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8 flex flex-col gap-5">
      <div className="flex items-start gap-2">
        <Link to="/" aria-label={t('back')} className="w-11 h-11 shrink-0 -ms-2 grid place-items-center rounded-full text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
          <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
        </Link>
        <div className="min-w-0 pt-1">
          <p className="text-base font-semibold text-muted" dir="auto">{stage === 'done' ? t('your_results') : due.length ? t('to_review', { n: due.length }) : t('caught_up')}</p>
          <h1 className="font-display text-[1.75rem] leading-tight" dir="auto">{t('review_title')}</h1>
        </div>
      </div>
      <div className="rounded-card bg-white border-[1.5px] border-line px-4 pt-4 pb-2">
        <TopicArt name={art} />
      </div>

      {stage === 'intro' && due.length > 0 && (
        <>
          <TutorMessage profile={profile} language={language} {...amio(due.length === 1 ? 'review_intro_one' : 'review_intro_many', { n: due.length })} />
          <Button variant="main" className="w-full" onClick={() => { setStage('lesson'); window.scrollTo({ top: 0 }); }}>
            {t('start')}
          </Button>
          <p className="text-small text-muted" dir="auto">{t('privacy')}</p>
          <Link to="/" className={secondLink}>{t('not_now')}</Link>
        </>
      )}

      {stage === 'intro' && due.length === 0 && (
        <>
          <TutorMessage profile={profile} language={language} {...amio('nothing_due')} />
          {nextDate && (
            <p className="text-base text-muted" dir="auto">
              {t('next_review', { date: nextDate.toLocaleDateString(language === 'en' ? 'en-US' : language, { weekday: 'long', month: 'long', day: 'numeric' }) })}
            </p>
          )}
          <Link to="/learn" className={`${MAIN_LINK} w-full text-lg`}>{t('learn_new')}</Link>
          <Link to="/" className={secondLink}>{t('back_today')}</Link>
        </>
      )}

      {stage === 'done' && (
        <>
          <TutorMessage profile={profile} language={language} {...amio(right === graded ? 'review_all_right' : 'review_some_right', { right, total: graded })} />
          <ul className="flex flex-col gap-2 list-none m-0 p-0">
            {results.map(({ question, correct, ungraded, heard, next }) => {
              const officeholder = officeholderAnswerFor(question, learnerLocation);
              return (
              <li key={question.id}>
                <Card padding="p-4" className={correct && !ungraded ? 'border-[2.5px] border-gold' : ''}>
                  <p className={`inline-flex items-center gap-1.5 rounded-button px-3 py-1 text-small font-semibold ${ungraded ? 'bg-line-soft text-navy' : correct ? 'bg-gold text-navy' : 'border-[1.5px] border-line text-navy'}`} dir="auto">
                    {ungraded ? t('not_counted') : correct
                      ? <><Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" /> {t('correct')}</>
                      : <><RotateCcw className="w-4 h-4" aria-hidden="true" /> {t('practice_again')}</>}
                  </p>
                  <p className="text-lg font-bold leading-snug mt-3" lang="en" dir="ltr">{question.question}</p>
                  {heard && <p className="mt-2 text-muted"><span dir="auto">{t('you_said')}</span> <span className="font-medium" lang="en" dir="ltr">“{heard}”</span></p>}
                  <h2 className="mt-4 mb-2 text-base font-bold" dir="auto">{t('accepted')}</h2>
                  <ul className="space-y-1 list-none m-0 p-0" lang="en" dir="ltr">
                    {(officeholder ? officeholder.accepted : splitOfficialAnswers(question.answer)).map((a) => <li key={a} className="font-semibold">{a}</li>)}
                  </ul>
                  <OfficeholderNote answer={officeholder} graded={false} className="mt-2" />
                  {next && <p className="text-small text-muted mt-3" dir="auto">{whenLabel(next.days)}</p>}
                </Card>
              </li>
              );
            })}
          </ul>
          <Link to="/" aria-disabled={saving} className={`${MAIN_LINK} w-full text-lg ${saving ? 'pointer-events-none opacity-60' : ''}`}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin" aria-label={t('saving')} /> : t('back_today')}
          </Link>
          <Link to="/learn" className={secondLink}>{t('learn_new')}</Link>
        </>
      )}
    </div>
    </div>
  );
}
