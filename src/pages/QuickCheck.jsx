import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { content } from '@/api/content';
import { auth } from '@/api/auth';
import { createPageUrl } from '@/utils';
import TutorLesson from '@/components/persona/TutorLesson';
import SkillLevels from '@/components/persona/SkillLevels';
import useTutorProfile from '@/components/persona/useTutorProfile';
import { languageNameFor } from '@/components/persona/languageName';
import { AmioSays } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';
import useAppLanguage from '@/hooks/useAppLanguage';
import { buildPretestLesson, scorePretest, toSavedLevels, mergeLevels, PRETEST_PARTS } from '@/lib/pretest';
import GettingStarted from '@/components/persona/GettingStarted';
import QuickCheckIntro from '@/components/onboarding/QuickCheckIntro';
import useOnboardingText from '@/components/onboarding/useOnboardingText';
import { isOnboarded } from '@/lib/onboarding';
import { UNITS } from '@/lib/course';
import { canSeeDrafts, visibleCourse } from '@/lib/journey';
import { startingPoint } from '@/lib/startingPoint';
import { translateCourse } from '@/lib/courseTitles';
import usePackLookup from '@/components/course/usePackLookup';

// The quick check (Prompt 9, frame R30QuickCheck). Saves only the four skill
// levels. The first time on a device, first open comes first (Your language,
// How Amio works, Your plan, the program question). The results only suggest
// a starting topic (src/lib/startingPoint.js, from the civics level; nothing
// is locked), then "Start learning" goes to Today.
// ?part=<skill> re-checks one skill, keeps the others and goes back home.
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
  const fullCheck = parts.length === PRETEST_PARTS.length;
  const [stage, setStage] = useState(() => (fullCheck && !isOnboarded() ? 'welcome' : 'intro')); // welcome | intro | lesson | results
  const [previous, setPrevious] = useState(null);
  const [user, setUser] = useState(null);
  const { t } = useOnboardingText(language);
  const [levels, setLevels] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      content.civicsQuestions({ version: '2025', limit: 300 }),
      content.readingSentences({ limit: 100 }),
      content.writingSentences({ limit: 100 }),
      content.interviewQuestions({ section: 'small_talk', limit: 50 }),
    ])
      .then(([civics, reading, writing, speaking]) => setSources({ civics, reading, writing, speaking }))
      .catch(() => setSources({ civics: [], reading: [], writing: [], speaking: [] }));
    auth.me().then((u) => { setUser(u || null); setPrevious(u?.skill_levels || null); }).catch(() => {});
  }, []);

  const lesson = useMemo(() => (sources ? buildPretestLesson(sources, language, undefined, parts) : null), [sources, language, parts]);
  const goHome = () => navigate(createPageUrl('Home'));
  // After the check (or skipping it), Today: the plan was made in first open.
  const next = goHome;
  const tx = usePackLookup(language);
  const start = useMemo(() => (levels ? startingPoint(translateCourse(visibleCourse(UNITS, { showDrafts: canSeeDrafts(user) }), tx), levels) : null), [levels, user, tx]);

  const finish = async ({ states, skipped }) => {
    const scored = scorePretest(lesson, states, skipped);
    const result = parts.length < PRETEST_PARTS.length ? mergeLevels(previous, scored, parts) : scored;
    setLevels(result);
    setStage('results');
    window.scrollTo({ top: 0 });
    if (!user) return; // guest: shown, not saved
    setSaving(true);
    try {
      await auth.updateMe({ skill_levels: toSavedLevels(result) });
    } catch (e) {
      toast.error("Couldn't save your results. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  if (stage === 'welcome' && loaded) {
    return (
      <div>
        <GettingStarted language={language} onLanguageChange={setLanguage} onDone={() => { setStage('intro'); window.scrollTo({ top: 0 }); }} />
      </div>
    );
  }

  if (!loaded || !lesson) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-16 text-navy" />;

  if (stage === 'lesson') {
    return (
      <div className="container mx-auto px-4 pt-6 max-w-5xl">
      <TutorLesson
        lesson={lesson}
        profile={profile}
        language={language}
        languageName={languageNameFor(language)}
        onFinish={finish}
        onExit={() => setStage('intro')}
      />
      </div>
    );
  }

  if (stage === 'intro') {
    return (
      <QuickCheckIntro
        t={t}
        parts={parts}
        ready={lesson.steps.length > 0}
        onStart={() => { setStage('lesson'); window.scrollTo({ top: 0 }); }}
        onSkip={next}
      />
    );
  }

  // Results: the four levels and a suggested starting topic.
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="flex-1 max-w-lg w-full mx-auto px-4 pt-8 pb-4 flex flex-col gap-5 text-navy">
        <h1 className="text-[1.625rem] font-bold leading-tight">{t('qc_results')}</h1>
        {levels && <SkillLevels levels={levels} language={language} />}
        {fullCheck && start && (
          <section className="rounded-card bg-white border-2 border-denim p-5 flex items-start gap-4">
            <span className="grid place-items-center w-12 h-12 shrink-0 rounded-full bg-sky text-navy"><MapPin className="w-6 h-6" aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="text-small font-semibold text-muted">{t('qc_start_at')}</p>
              <p className="text-lg font-bold" dir="auto">{t('qc_start_unit', { n: start.unit.number, section: start.section.title })}</p>
              <p className="mt-1 text-base text-muted">{t('qc_go_back')}</p>
            </div>
          </section>
        )}
        <AmioSays mood="proud" size={56}>{t(user ? 'qc_saved' : 'qc_guest')}</AmioSays>
      </div>
      <div className="sticky bottom-0 bg-paper px-4 pt-2 pb-6 max-w-lg w-full mx-auto flex flex-col items-center gap-2">
        <Button variant="main" className="w-full" onClick={next} disabled={saving}>
          {saving ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : t(fullCheck ? 'qc_start_learning' : 'qc_done')}
        </Button>
        <Button variant="link" onClick={() => setStage('intro')}>{t('qc_again')}</Button>
      </div>
    </div>
  );
}
