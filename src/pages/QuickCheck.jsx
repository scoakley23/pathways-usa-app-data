import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import TopicArt from '@/components/art/TopicArt';
import TutorLesson from '@/components/persona/TutorLesson';
import TutorMessage from '@/components/persona/TutorMessage';
import SkillLevels, { partName } from '@/components/persona/SkillLevels';
import useTutorProfile from '@/components/persona/useTutorProfile';
import { languageNameFor } from '@/components/persona/languageName';
import { PrimaryButton, QuietButton, Tag } from '@/components/pathways/ui';
import useAppLanguage from '@/hooks/useAppLanguage';
import { buildPretestLesson, scorePretest, toSavedLevels, mergeLevels, PRETEST_PARTS } from '@/lib/pretest';
import PlanSetup from '@/components/persona/PlanSetup';
import { loadPlanSettings } from '@/lib/planSettings';
import GettingStarted from '@/components/persona/GettingStarted';
import { isOnboarded } from '@/lib/onboarding';

const INTRO = {
  en: "Let's see where you are today. It takes about 10 minutes: civics, reading, writing, and speaking. You can skip any part. I'll use the results to plan your practice.",
  es: 'Veamos cómo va hoy. Toma unos 10 minutos: educación cívica, lectura, escritura y conversación. Puede saltar cualquier parte. Usaré los resultados para planear su práctica.',
};

function summary(levels, language) {
  const startHere = Object.keys(levels).filter((p) => levels[p] === 'start_here');
  const names = startHere.map((p) => partName(p, language)).join(', ');
  if (language === 'es') {
    return startHere.length ? `¡Gracias! Así va hoy. Vamos a practicar más: ${names}.` : '¡Gracias! Tiene una buena base. Vamos a seguir practicando.';
  }
  return startHere.length ? `Thank you! Here is where you are today. We'll spend more time on: ${names}.` : 'Thank you! You have a good start. Let’s keep practicing.';
}

// "Start with a quick check" (Prompt 4). Saves only the four skill levels.
// The first time on a device, "Getting started" comes first (language,
// tutor picture, where they are in the process, sound and text size).
export default function QuickCheck() {
  const navigate = useNavigate();
  const { profile, loaded } = useTutorProfile();
  const [language, setLanguage] = useAppLanguage();
  const [sources, setSources] = useState(null);
  // ?part=speaking re-checks one skill (the 2-week check-in) and keeps the rest.
  const [parts] = useState(() => {
    const p = new URLSearchParams(window.location.search).get('part');
    return PRETEST_PARTS.includes(p) ? [p] : PRETEST_PARTS;
  });
  const [stage, setStage] = useState(() => (parts.length === PRETEST_PARTS.length && !isOnboarded() ? 'welcome' : 'intro')); // welcome | intro | lesson | results | plan
  const [previous, setPrevious] = useState(null);
  const hasPlan = !!loadPlanSettings();
  const [levels, setLevels] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.CivicsQuestion.filter({ version: '2025' }, null, 300),
      base44.entities.ReadingSentence.list(null, 100),
      base44.entities.Sentence.list(null, 100),
      base44.entities.InterviewQuestion.filter({ section: 'small_talk' }, null, 50),
    ])
      .then(([civics, reading, writing, speaking]) => setSources({ civics, reading, writing, speaking }))
      .catch(() => setSources({ civics: [], reading: [], writing: [], speaking: [] }));
    base44.auth.me().then((u) => setPrevious(u?.skill_levels || null)).catch(() => {});
  }, []);

  const lesson = useMemo(() => (sources ? buildPretestLesson(sources, language, undefined, parts) : null), [sources, language, parts]);
  const goHome = () => navigate(createPageUrl('Home'));

  const finish = async ({ states, skipped }) => {
    const scored = scorePretest(lesson, states, skipped);
    const result = parts.length < PRETEST_PARTS.length ? mergeLevels(previous, scored, parts) : scored;
    setLevels(result);
    setStage('results');
    window.scrollTo({ top: 0 });
    setSaving(true);
    try {
      await base44.auth.updateMe({ skill_levels: toSavedLevels(result) });
    } catch (e) {
      toast.error("Couldn't save your results. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  if (stage === 'welcome' && loaded) {
    return (
      <div className="max-w-xl mx-auto">
        <GettingStarted language={language} onLanguageChange={setLanguage} onDone={() => { setStage('intro'); window.scrollTo({ top: 0 }); }} />
      </div>
    );
  }

  if (!loaded || !lesson) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-16 text-pw-navy" />;

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

  return (
    <div className="max-w-xl mx-auto space-y-5 text-pw-navy">
      <div className="rounded-[14px] bg-pw-blue-soft px-4 pt-4 pb-5">
        <TopicArt name="compass" />
        <Tag tone="teal" className="mt-2">{stage === 'results' ? 'Your results' : 'About 10 minutes'}</Tag>
        <h1 className="font-display text-[36px] leading-tight mt-3">Quick check</h1>
      </div>

      {stage === 'intro' && (
        <>
          <TutorMessage profile={profile} language={language} mine={language === 'es' ? INTRO.es : null} en={INTRO.en} expression="greeting" />
          {lesson.steps.length === 0 ? (
            <p className="text-pw-muted">The quick check isn't ready yet. Please try again later.</p>
          ) : (
            <PrimaryButton large className="w-full" onClick={() => { setStage('lesson'); window.scrollTo({ top: 0 }); }}>
              Start the quick check
            </PrimaryButton>
          )}
          <p className="text-sm text-pw-muted">We save only your four levels. Your answers and your voice are not saved.</p>
          <QuietButton className="w-full" onClick={goHome}>Not now</QuietButton>
        </>
      )}

      {stage === 'plan' && (
        <PlanSetup profile={profile} language={language} onDone={goHome} />
      )}

      {stage === 'results' && levels && (
        <>
          <TutorMessage
            profile={profile}
            language={language}
            mine={language === 'es' ? summary(levels, 'es') : null}
            en={summary(levels, 'en')}
          />
          <SkillLevels levels={levels} language={language} />
          <PrimaryButton large className="w-full" onClick={hasPlan ? goHome : () => { setStage('plan'); window.scrollTo({ top: 0 }); }} disabled={saving}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : hasPlan ? 'Done' : 'Make my plan'}
          </PrimaryButton>
          <QuietButton className="w-full" onClick={() => setStage('intro')}>Take it again</QuietButton>
        </>
      )}
    </div>
  );
}
