import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import useTextSize from './useTextSize';
import useTutorLines from './useTutorLines';
import { STEPS } from './lessonSteps';
import { UI_LINES, UI_LINES_ES } from './tutorStepLines';
import useTranslatedLines from './useTranslatedLines';
import { Button, SegmentedProgress } from '@/components/pathways/ui';
import { canContinue, nextPartIndex } from '@/lib/tutorLesson';
import { TUTOR_STEP_LINES } from '@/components/lessons/learnStrings';
import { RTL_LANGUAGES } from '@/hooks/useAppLanguage';

// The small label above each step, by step type (`t` = TUTOR_STEP_LINES).
function stepTag(step, lesson, t) {
  if (step.type === 'part-intro') {
    const parts = lesson.steps.filter((s) => s.type === 'part-intro');
    return t('part_of', { n: parts.indexOf(step) + 1, total: parts.length });
  }
  if (step.mode === 'check') return t('quick_check_part', { part: t(`part_${['civics', 'reading', 'writing', 'speaking'].includes(step.part) ? step.part : 'practice'}`) });
  const key = {
    explain: 'tag_learn',
    'show-english': 'tag_learn_english',
    'practice-speaking': 'tag_speak',
    'practice-writing': 'tag_write',
    'practice-reading': 'tag_read',
    'practice-interview': 'tag_interview',
    'check-understanding': 'quick_check',
  }[step.type];
  return key ? t(key) : null;
}

// One step at a time: progress at the top, one big Continue button at the
// bottom that unlocks when the step is done. Lessons with `skippableParts`
// show "Skip this part" on each part intro.
// onFinish({ states, skipped }) — states[i].outcome holds each answer's result.
// lesson.posters: civics questions show as red/blue posters (see SpeakingStep).
// extraSteps: more step types for one kind of lesson ({ type: Component });
// a component with `needsAnswer = true` waits for an answer like practice steps.
export default function TutorLesson({ lesson, profile, language = 'en', languageName = 'English', onFinish, onExit, extraSteps }) {
  const [index, setIndex] = useState(0);
  const [states, setStates] = useState({});
  const [skipped, setSkipped] = useState(() => new Set());
  const { className: sizeClass } = useTextSize();
  const line = useTutorLines(profile, language);
  const reduceMotion = useReducedMotion();

  const steps = lesson.steps;
  const step = steps[index];
  const state = states[index] || {};
  const setState = (s) => setStates((prev) => ({ ...prev, [index]: s }));
  // Screen words and Amio's fixed lines (pack; Amio's Spanish by hand).
  const words = useTranslatedLines(TUTOR_STEP_LINES, language, { cacheKey: 'tutor_steps_v1' });
  const amioLines = useTranslatedLines(UI_LINES, language, { cacheKey: 'tutor_steps_amio_v1', handWritten: { es: UI_LINES_ES } });
  const t = (key, vars = {}) => Object.entries(vars).reduce((out, [k, v]) => out.split(`{${k}}`).join(String(v)), (language !== 'en' && words(key)) || TUTOR_STEP_LINES[key] || key);
  const ui = (key) => ({ en: UI_LINES[key], mine: language !== 'en' ? amioLines(key) || null : null });
  // Lessons with `posters` (/learn, /review) show each civics question on a
  // full-bleed poster; posterIndex/posterTotal count those cards.
  const speakingSteps = lesson.posters ? steps.filter((s) => s.type === 'practice-speaking') : [];
  const ctx = { profile, language, languageName, line, ui, t, sizeClass, posters: !!lesson.posters, posterIndex: speakingSteps.indexOf(step), posterTotal: speakingSteps.length };
  const Extra = extraSteps?.[step.type];
  const Step = Extra || STEPS[step.type];
  const ready = Extra ? (!Extra.needsAnswer || !!(state.answered || state.shown)) : canContinue(step, state);
  const isLast = index === steps.length - 1;
  const tag = Extra?.tag?.label || stepTag(step, lesson, t);
  const stepOf = t('step_of', { n: index + 1, total: steps.length });

  const goTo = (i, nextSkipped = skipped) => {
    if (i >= steps.length) {
      if (onFinish) onFinish({ states, skipped: nextSkipped });
      return;
    }
    setIndex(i);
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };
  const skipPart = () => {
    const next = new Set(skipped).add(step.part);
    setSkipped(next);
    goTo(nextPartIndex(steps, index), next);
  };

  return (
    <div dir={RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr'} className="max-w-lg mx-auto text-navy">
      <div className="flex items-center gap-3 mb-3">
        {onExit ? (
          <button
            type="button"
            onClick={onExit}
            aria-label={t('leave')}
            className="w-11 h-11 shrink-0 rounded-full grid place-items-center text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        ) : <span className="w-11 shrink-0" />}
        <div className="flex-1 min-w-0"><SegmentedProgress current={index} total={steps.length} label={stepOf} /></div>
        <span className="shrink-0 text-small font-semibold text-muted tabular-nums" dir="auto">{index + 1}/{steps.length}</span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={reduceMotion ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="pt-3 pb-4"
        >
          {tag && <p className="text-base font-semibold text-muted" dir="auto">{tag}</p>}
          <h1 className="font-display text-[1.75rem] leading-tight mt-1 mb-4" dir="auto">{lesson.title}</h1>
          <Step step={step} ctx={ctx} state={state} setState={setState} />
        </motion.div>
      </AnimatePresence>

      <div className="sticky bottom-0 -mx-4 px-4 pt-6 pb-4 bg-paper">
        <Button variant="main" className="w-full" onClick={() => goTo(index + 1)} disabled={!ready}>
          {step.type === 'part-intro' ? t('start') : isLast ? t('finish') : t('continue')}
        </Button>
        {step.type === 'part-intro' && lesson.skippableParts && (
          <Button variant="second" className="w-full mt-2" onClick={skipPart}>{t('skip_part')}</Button>
        )}
      </div>
    </div>
  );
}
