import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import TopicArt, { TOPIC_ART } from '@/components/art/TopicArt';
import RepresentativeFinder from '@/components/civics/RepresentativeFinder';
import TutorLesson from '@/components/persona/TutorLesson';
import TutorMessage from '@/components/persona/TutorMessage';
import useTutorProfile from '@/components/persona/useTutorProfile';
import { languageNameFor } from '@/components/persona/languageName';
import { Eyebrow, PrimaryButton, QuietButton, RaisedCard, Tag } from '@/components/pathways/ui';
import useAppLanguage from '@/hooks/useAppLanguage';
import { buildLearnLesson, pickNextToLearn } from '@/lib/explanations';
import { learnedProgress } from '@/lib/spacedReview';

const linkClass = 'min-h-[52px] w-full rounded-2xl font-bold text-lg inline-flex items-center justify-center px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2';

const say = (t, language) => ({ en: t.en, mine: language === 'es' ? t.es : null });

const LINES = {
  intro: (n) => ({
    en: `Today we'll learn ${n === 1 ? '1 new civics question' : `${n} new civics questions`}. First I'll explain each one. Then you'll see the question in English and answer it out loud.`,
    es: `Hoy vamos a aprender ${n === 1 ? '1 pregunta nueva' : `${n} preguntas nuevas`} de educación cívica. Primero le explico cada una. Luego verá la pregunta en inglés y la contestará en voz alta.`,
  }),
  done: (n) => ({
    en: `Good work. You learned ${n === 1 ? '1 new question' : `${n} new questions`}. I'll ask you again in a few days, so ${n === 1 ? 'it stays' : 'they stay'} in your memory.`,
    es: `Buen trabajo. Aprendió ${n === 1 ? '1 pregunta nueva' : `${n} preguntas nuevas`}. ${n === 1 ? 'Se la volveré a preguntar en unos días para que no la olvide.' : 'Se las volveré a preguntar en unos días para que no las olvide.'}`,
  }),
  allStarted: {
    en: "You have started every civics question. Now the best practice is review: I'll bring each question back when it's time.",
    es: 'Ya empezó todas las preguntas de educación cívica. Ahora lo mejor es repasar: le traeré cada pregunta cuando sea el momento.',
  },
};

function SignInMessage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 px-4">
      <div className="w-20 h-20 rounded-3xl bg-pw-blue-soft flex items-center justify-center" aria-hidden="true">
        <BookOpen className="w-10 h-10 text-pw-blue-ink" />
      </div>
      <h2 className="text-2xl font-extrabold text-pw-navy">Sign in to learn civics</h2>
      <p className="text-base text-pw-muted">Your tutor teaches each question first, then you practice it.</p>
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
  const [language] = useAppLanguage();
  const [user, setUser] = useState(undefined);
  const [picked, setPicked] = useState(null);
  const [representativeData, setRepresentativeData] = useState(null);
  const [stage, setStage] = useState('intro'); // intro | lesson | done
  const [results, setResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    setPicked(null);
    try {
      const [questions, progress, profiles] = await Promise.all([
        base44.entities.CivicsQuestion.filter({ version: '2025' }, null, 500),
        base44.entities.UserProgress.filter({ user_email: user.email, content_type: 'civics_question' }, null, 1000),
        // The learner's own officials ("your state's ..." questions), if they used Find My Representative.
        base44.entities.PublicProfile.filter({ user_email: user.email.toLowerCase().trim() }, '-created_date', 1).catch(() => []),
      ]);
      setRepresentativeData(profiles[0]?.representative_data || null);
      setPicked(pickNextToLearn(questions, progress, count));
    } catch (e) {
      toast.error("Couldn't load your lesson. Please check your connection.");
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

  const lesson = useMemo(() => (picked ? buildLearnLesson(picked, language, undefined, { representativeData }) : null), [picked, language, representativeData]);

  const finish = async ({ states }) => {
    // Each question's practice step: correct only if answered correctly.
    const outcome = picked.map((q) => {
      const i = lesson.steps.findIndex((s) => s.type === 'practice-speaking' && s.questionId === q.id);
      return { question: q, correct: !!states[i]?.outcome?.correct };
    });
    setResults(outcome);
    setStage('done');
    window.scrollTo({ top: 0 });
    setSaving(true);
    try {
      for (const { question, correct } of outcome) {
        const existing = await base44.entities.UserProgress.filter({ user_email: user.email, content_id: question.id }, null, 1);
        const data = { user_email: user.email, content_id: question.id, content_type: 'civics_question', ...learnedProgress(existing[0], correct) };
        if (existing.length > 0) await base44.entities.UserProgress.update(existing[0].id, data);
        else await base44.entities.UserProgress.create(data);
      }
    } catch (e) {
      toast.error("Couldn't save your progress. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  const learnMore = () => { setStage('intro'); setResults([]); setRunId(runId + 1); load(); window.scrollTo({ top: 0 }); };

  if (user === undefined || !loaded) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-16 text-pw-navy" />;
  if (!user) return <SignInMessage />;
  if (!lesson) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-16 text-pw-navy" />;

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
    <div className="max-w-xl mx-auto space-y-5 text-pw-navy">
      <div className="rounded-3xl bg-pw-blue-soft px-4 pt-4 pb-5">
        <TopicArt name={art} />
        <Tag tone="blue" className="mt-2">
          {stage === 'done' ? 'Lesson done' : picked.length ? `${n} new ${n === 1 ? 'question' : 'questions'}` : 'All started'}
        </Tag>
        <h1 className="text-[28px] leading-tight font-extrabold mt-3">Learn civics</h1>
      </div>

      {stage === 'intro' && picked.length > 0 && (
        <>
          <TutorMessage profile={profile} language={language} {...say(LINES.intro(n), language)} />
          <RaisedCard>
            <Eyebrow className="mb-3">Today&apos;s questions</Eyebrow>
            <ol className="space-y-3">
              {picked.map((q, i) => (
                <li key={q.id} className="flex gap-3 text-base font-bold leading-snug">
                  <span className="w-7 h-7 shrink-0 rounded-full bg-pw-soft grid place-items-center text-sm" aria-hidden="true">{i + 1}</span>
                  <span>{q.question}</span>
                </li>
              ))}
            </ol>
          </RaisedCard>
          <PrimaryButton large className="w-full" onClick={() => { setStage('lesson'); window.scrollTo({ top: 0 }); }}>
            Start
          </PrimaryButton>
          <p className="text-sm text-pw-muted">We save only your scores and when to review. Your voice and your answers are not saved.</p>
          <Link to="/" className={`${linkClass} text-base min-h-[44px] hover:bg-pw-soft`}>Not now</Link>
        </>
      )}

      {stage === 'intro' && picked.length === 0 && (
        <>
          <TutorMessage profile={profile} language={language} {...say(LINES.allStarted, language)} />
          <Link to="/review" className={`${linkClass} bg-pw-navy text-white hover:bg-pw-navy-deep`}>Review civics</Link>
          <Link to="/" className={`${linkClass} text-base min-h-[44px] hover:bg-pw-soft`}>Back to Today</Link>
        </>
      )}

      {stage === 'done' && (
        <>
          <TutorMessage profile={profile} language={language} {...say(LINES.done(n), language)} expression="proud" />
          <RaisedCard>
            <Eyebrow className="mb-3">You learned</Eyebrow>
            <ul className="space-y-3">
              {results.map(({ question }) => (
                <li key={question.id} className="text-base font-bold leading-snug">{question.question}</li>
              ))}
            </ul>
            <p className="text-base text-pw-muted mt-4">Quick check: in 3 days.</p>
          </RaisedCard>
          <Link to="/" aria-disabled={saving} className={`${linkClass} bg-pw-navy text-white hover:bg-pw-navy-deep ${saving ? 'pointer-events-none opacity-60' : ''}`}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin" aria-label="Saving" /> : 'Back to Today'}
          </Link>
          <QuietButton className="w-full" onClick={learnMore} disabled={saving}>Learn more questions</QuietButton>
        </>
      )}

      {/* Some answers depend on where the learner lives; lessons use this result. */}
      <div id="find-representative" className="scroll-mt-6">
        <RepresentativeFinder userEmail={user.email} onDataLoaded={setRepresentativeData} />
      </div>
    </div>
  );
}
