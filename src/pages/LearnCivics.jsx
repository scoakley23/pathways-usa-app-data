import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { progress as progressApi } from '@/api/progress';
import { review } from '@/api/review';
import { content } from '@/api/content';
import { auth } from '@/api/auth';
import TopicArt, { TOPIC_ART } from '@/components/art/TopicArt';
import RepresentativeFinder from '@/components/civics/RepresentativeFinder';
import useLearnerLocation from '@/components/civics/useLearnerLocation';
import TutorLesson from '@/components/persona/TutorLesson';
import TutorMessage from '@/components/persona/TutorMessage';
import useTutorProfile from '@/components/persona/useTutorProfile';
import { languageNameFor } from '@/components/persona/languageName';
import { Button, Card, MAIN_LINK } from '@/components/pathways/ui';
import useLearnText from '@/components/lessons/useLearnText';
import { buildLearnLesson, pickNextToLearn } from '@/lib/explanations';
import { awardBadges } from '@/lib/awardBadges';

const secondLink = 'min-h-tap w-full inline-flex items-center justify-center rounded-button border-[1.5px] border-line bg-white px-5 text-base font-semibold text-navy hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim';

function SignInMessage() {
  const { t } = useLearnText();
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-3 px-4 text-navy">
      <BookOpen className="w-10 h-10" aria-hidden="true" />
      <h1 className="font-display text-[1.75rem] leading-tight" dir="auto">{t('sign_in_learn')}</h1>
      <p className="text-base text-muted" dir="auto">{t('sign_in_learn_sub')}</p>
    </div>
  );
}

// "Teach first, then practice" (Prompt 7): explain → English question and
// answers with key words → answer out loud. Saves only scores and the review
// schedule (UserProgress); what the learner says stays in memory.
export default function LearnCivics() {
  const location = useLocation();
  const navigate = useNavigate();
  const count = Math.min(5, Math.max(1, parseInt(new URLSearchParams(location.search).get('n'), 10) || 2));
  const { profile, loaded } = useTutorProfile();
  const { t, amio, language, rtl } = useLearnText();
  const [user, setUser] = useState(undefined);
  const [picked, setPicked] = useState(null);
  const { location: learnerLocation } = useLearnerLocation();
  const [stage, setStage] = useState('intro'); // intro | lesson | done
  const [results, setResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    setPicked(null);
    try {
      const [questions, progress] = await Promise.all([
        content.civicsQuestions({ version: '2025', limit: 500 }),
        progressApi.list({ contentType: 'civics_question', limit: 1000 }),
      ]);
      setPicked(pickNextToLearn(questions, progress, count));
    } catch (e) {
      toast.error(t('load_error'));
      setPicked([]);
    }
  }, [user, count]);

  useEffect(() => { load(); }, [load]);

  // "Find my representatives" in a lesson links to /learn#find-representative:
  // leave the lesson, scroll to the finder, then drop the hash.
  const findRep = location.hash === '#find-representative';
  useEffect(() => {
    if (findRep) setStage((s) => (s === 'lesson' ? 'intro' : s));
  }, [findRep]);
  useEffect(() => {
    if (!findRep || stage === 'lesson' || !picked) return;
    const el = document.getElementById('find-representative');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    navigate({ search: location.search }, { replace: true });
  }, [findRep, stage, picked, navigate, location.search]);

  const lesson = useMemo(() => (picked ? buildLearnLesson(picked, language, undefined, { location: learnerLocation }) : null), [picked, language, learnerLocation]);

  const finish = async ({ states }) => {
    // Each question's practice step: correct only if answered correctly.
    const outcome = picked.map((q) => {
      const i = lesson.steps.findIndex((s) => s.type === 'practice-speaking' && s.questionId === q.id);
      const c = states[i]?.outcome?.correct;
      // null = an officeholder answer that couldn't be graded: no progress change
      return { question: q, correct: !!c, ungraded: c === null };
    });
    setResults(outcome);
    setStage('done');
    window.scrollTo({ top: 0 });
    setSaving(true);
    try {
      for (const { question, correct, ungraded } of outcome) {
        if (ungraded) continue;
        // src/api/review.js: progress plus the first review date (Base44's
        // old schedule, or a review_items box on Supabase).
        await review.afterLearn(question.id, correct, { email: user.email });
      }
      awardBadges();
    } catch (e) {
      toast.error(t('save_error'));
    } finally {
      setSaving(false);
    }
  };

  const learnMore = () => { setStage('intro'); setResults([]); setRunId(runId + 1); load(); window.scrollTo({ top: 0 }); };

  if (user === undefined || !loaded) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-16 text-navy" />;
  if (!user) return <SignInMessage />;
  if (!lesson) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-16 text-navy" />;

  if (stage === 'lesson') {
    return (
      <TutorLesson
        key={runId}
        lesson={lesson}
        profile={profile}
        language={language}
        languageName={languageNameFor(language)}
        onFinish={finish}
        onExit={() => setStage('intro')}
      />
    );
  }

  const art = TOPIC_ART[picked[0]?.category] || 'capitol';
  const n = stage === 'done' ? results.length : picked.length;

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-paper text-navy">
    <div className="max-w-lg mx-auto px-4 pt-4 pb-8 flex flex-col gap-5">
      <div className="flex items-start gap-2">
        <Link to="/" aria-label={t('back')} className="w-11 h-11 shrink-0 -ms-2 grid place-items-center rounded-full text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
          <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
        </Link>
        <div className="min-w-0 pt-1">
          <p className="text-base font-semibold text-muted" dir="auto">{stage === 'done' ? t('lesson_done') : picked.length ? (n === 1 ? t('new_one') : t('new_many', { n })) : t('all_started_tag')}</p>
          <h1 className="font-display text-[1.75rem] leading-tight" dir="auto">{t('learn_title')}</h1>
        </div>
      </div>
      <div className="rounded-card bg-white border-[1.5px] border-line px-4 pt-4 pb-2">
        <TopicArt name={art} />
      </div>

      {stage === 'intro' && picked.length > 0 && (
        <>
          <TutorMessage profile={profile} language={language} {...amio(n === 1 ? 'intro_one' : 'intro_many', { n })} />
          <Card padding="p-4">
            <h2 className="mb-3 text-lg font-bold" dir="auto">{t('todays_questions')}</h2>
            <ol className="space-y-3 list-none m-0 p-0">
              {picked.map((q, i) => (
                <li key={q.id} className="flex gap-3 text-base font-semibold leading-snug">
                  <span className="w-7 h-7 shrink-0 rounded-full bg-line-soft grid place-items-center text-small font-bold" aria-hidden="true">{i + 1}</span>
                  <span lang="en" dir="ltr">{q.question}</span>
                </li>
              ))}
            </ol>
          </Card>
          <Button variant="main" className="w-full" onClick={() => { setStage('lesson'); window.scrollTo({ top: 0 }); }}>
            {t('start')}
          </Button>
          <p className="text-small text-muted" dir="auto">{t('privacy')}</p>
          <Link to="/" className={secondLink}>{t('not_now')}</Link>
        </>
      )}

      {stage === 'intro' && picked.length === 0 && (
        <>
          <TutorMessage profile={profile} language={language} {...amio('all_started')} />
          <Link to="/review" className={`${MAIN_LINK} w-full text-lg`}>{t('review_civics')}</Link>
          <Link to="/" className={secondLink}>{t('back_today')}</Link>
        </>
      )}

      {stage === 'done' && (
        <>
          <TutorMessage profile={profile} language={language} {...amio(n === 1 ? 'done_one' : 'done_many', { n })} />
          <Card padding="p-4">
            <h2 className="mb-3 text-lg font-bold" dir="auto">{t('you_learned')}</h2>
            <ul className="space-y-3 list-none m-0 p-0">
              {results.map(({ question }) => (
                <li key={question.id} className="text-base font-semibold leading-snug" lang="en" dir="ltr">{question.question}</li>
              ))}
            </ul>
            <p className="text-base text-muted mt-4" dir="auto">{t('quick_check')}</p>
          </Card>
          <Link to="/" aria-disabled={saving} className={`${MAIN_LINK} w-full text-lg ${saving ? 'pointer-events-none opacity-60' : ''}`}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin" aria-label={t('saving')} /> : t('back_today')}
          </Link>
          <Button variant="second" className="w-full" onClick={learnMore} disabled={saving}>{t('learn_more')}</Button>
        </>
      )}

      {/* Some answers depend on where the learner lives; lessons use this result. */}
      <div id="find-representative" className="scroll-mt-6">
        <RepresentativeFinder />
      </div>
    </div>
    </div>
  );
}
