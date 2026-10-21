import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import useTextSize from './useTextSize';
import useTutorLines from './useTutorLines';
import { STEPS, UI } from './lessonSteps';
import { PrimaryButton, QuietButton, SegmentedProgress, Tag } from '@/components/pathways/ui';
import { canContinue, nextPartIndex, progressLabel } from '@/lib/tutorLesson';

// Colored tag shown above each step, by step type.
function stepTag(step, lesson) {
  if (step.type === 'part-intro') {
    const parts = lesson.steps.filter((s) => s.type === 'part-intro');
    return { tone: 'navy', label: `Part ${parts.indexOf(step) + 1} of ${parts.length}` };
  }
  if (step.mode === 'check') return { tone: 'teal', label: `Quick check · ${{ civics: 'Civics', reading: 'Reading', writing: 'Writing', speaking: 'Speaking' }[step.part] || 'Practice'}` };
  return {
    explain: { tone: 'blue', label: 'Learn' },
    'show-english': { tone: 'blue', label: 'Learn · English' },
    'practice-speaking': { tone: 'red', label: 'Practice · Speak' },
    'practice-writing': { tone: 'red', label: 'Practice · Write' },
    'practice-reading': { tone: 'red', label: 'Practice · Read' },
    'practice-interview': { tone: 'red', label: 'Practice · Interview' },
    'check-understanding': { tone: 'teal', label: 'Quick check' },
  }[step.type];
}

// One step at a time: progress at the top, one big Continue button at the
// bottom that unlocks when the step is done. Lessons with `skippableParts`
// show "Skip this part" on each part intro.
// onFinish({ states, skipped }) — states[i].outcome holds each answer's result.
export default function TutorLesson({ lesson, profile, language = 'en', languageName = 'English', onFinish, onExit }) {
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
  const ui = (key) => ({ en: UI[key].en, mine: language === 'es' ? UI[key].es : null });
  const ctx = { profile, language, languageName, line, ui, sizeClass };
  const Step = STEPS[step.type];
  const isLast = index === steps.length - 1;
  const tag = stepTag(step, lesson);

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
    <div className="max-w-xl mx-auto text-pw-navy">
      <div className="flex items-center justify-between mb-3">
        {onExit ? (
          <button
            type="button"
            onClick={onExit}
            aria-label="Leave lesson"
            className="w-11 h-11 rounded-xl bg-white border border-pw-line grid place-items-center hover:bg-pw-soft"
          >
            <X className="w-5 h-5" />
          </button>
        ) : <span className="w-11" />}
        <span className="text-sm font-bold uppercase tracking-wide text-pw-muted">{progressLabel(index, steps.length)}</span>
        <span className="w-11" />
      </div>
      <SegmentedProgress current={index} total={steps.length} label={progressLabel(index, steps.length)} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={reduceMotion ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="pt-5 pb-4"
        >
          {tag && <Tag tone={tag.tone}>{tag.label}</Tag>}
          <h1 className="text-[28px] leading-tight font-extrabold mt-3 mb-4">{lesson.title}</h1>
          <Step step={step} ctx={ctx} state={state} setState={setState} />
        </motion.div>
      </AnimatePresence>

      <div className="sticky bottom-0 -mx-4 px-4 pt-6 pb-4 bg-gradient-to-t from-pw-page via-pw-page to-transparent">
        <PrimaryButton large className="w-full" onClick={() => goTo(index + 1)} disabled={!canContinue(step, state)}>
          {step.type === 'part-intro' ? 'Start' : isLast ? 'Finish' : 'Continue'}
        </PrimaryButton>
        {step.type === 'part-intro' && lesson.skippableParts && (
          <QuietButton className="w-full mt-2" onClick={skipPart}>Skip this part</QuietButton>
        )}
      </div>
    </div>
  );
}
