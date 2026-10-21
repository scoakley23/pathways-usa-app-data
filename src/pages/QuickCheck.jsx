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
import { buildPretestLesson, scorePretest, toSavedLevels } from '@/lib/pretest';

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
export default function QuickCheck() {
  const navigate = useNavigate();
  const { profile, loaded } = useTutorProfile();
  const [language] = useAppLanguage();
  const [sources, setSources] = useState(null);
  const [stage, setStage] = useState('intro'); // intro | lesson | results
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
  }, []);

  const lesson = useMemo(() => (sources ? buildPretestLesson(sources, language) : null), [sources, language]);
  const goHome = () => navigate(createPageUrl('Home'));

  const finish = async ({ states, skipped }) => {
    const result = scorePretest(lesson, states, skipped);
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
      <div className="rounded-3xl bg-pw-blue-soft px-4 pt-4 pb-5">
        <TopicArt name="compass" />
        <Tag tone="teal" className="mt-2">{stage === 'results' ? 'Your results' : 'About 10 minutes'}</Tag>
        <h1 className="text-[28px] leading-tight font-extrabold mt-3">Quick check</h1>
      </div>

      {stage === 'intro' && (
        <>
          <TutorMessage profile={profile} language={language} mine={language === 'es' ? INTRO.es : null} en={INTRO.en} />
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

      {stage === 'results' && levels && (
        <>
          <TutorMessage
            profile={profile}
            language={language}
            mine={language === 'es' ? summary(levels, 'es') : null}
            en={summary(levels, 'en')}
          />
          <SkillLevels levels={levels} language={language} />
          <PrimaryButton large className="w-full" onClick={goHome} disabled={saving}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Done'}
          </PrimaryButton>
          <QuietButton className="w-full" onClick={() => setStage('intro')}>Take it again</QuietButton>
        </>
      )}
    </div>
  );
}
