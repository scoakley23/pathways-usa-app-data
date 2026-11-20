import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { AmioSays } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';
import { StepBar } from '@/components/pathways/StepBar';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import QuestionStep from '@/components/lesson/QuestionStep';
import { LESSON_LINES } from '@/components/lesson/lessonStrings';
import { checkpoints as checkpointsApi } from '@/api/checkpoints';
import { UNITS, questionRecord } from '@/lib/course';
import { CHEST_SIZE, chestKind } from '@/lib/checkpoints';
import { CheckpointHeader, useCheckpointText } from '@/components/checkpoint/checkpointParts';

// The review chest (Prompt 8, /review-chest): up to 6 questions that are due,
// asked with the lesson's Teach it back and Officer screens (the first half
// Teach it back, the rest the officer). The first answer to each one moves
// it between boxes through the one review schedule (right → up a box, wrong
// → box 1). A retry after a miss is practice only.

const LESSONS = UNITS.flatMap((u) => u.sections.flatMap((s) => s.lessons || []));
const COURSE_IDS = new Set(LESSONS.flatMap((l) => l.questionIds));
const hintFor = (questionId) => LESSONS.find((l) => l.questionIds.includes(questionId))?.steps.listen.facts[0] || '';

export default function ReviewChestPage() {
  const navigate = useNavigate();
  const { t, rtl, language } = useCheckpointText();
  const trLesson = useTranslatedLines(LESSON_LINES, language, { cacheKey: 'lesson_v2' });
  const tl = (key, vars = {}) => {
    let s = (language !== 'en' && trLesson(key)) || LESSON_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  const [entries, setEntries] = useState(null);
  const [index, setIndex] = useState(0);
  const [right, setRight] = useState(0);
  const [missedNow, setMissedNow] = useState(false);

  useEffect(() => {
    let active = true;
    checkpointsApi.due({ limit: CHEST_SIZE, knownIds: COURSE_IDS })
      .then((list) => { if (active) setEntries(list.filter((e) => questionRecord(e.questionId)).slice(0, CHEST_SIZE)); });
    return () => { active = false; };
  }, []);

  const questions = useMemo(() => (entries || []).map((e) => questionRecord(e.questionId)), [entries]);
  const home = () => navigate('/');

  if (entries === null) return <div className="min-h-screen bg-paper" />;

  const total = entries.length;
  const done = index >= total;

  if (!total || done) {
    return (
      <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-paper flex flex-col">
        <CheckpointHeader title={t('chest_title')} onClose={home} closeLabel={t('close')} tone="navy" />
        <div className="flex-1 max-w-lg w-full mx-auto px-4 py-8 flex flex-col items-center gap-5 text-center">
          <span className="grid place-items-center w-20 h-20 rounded-2xl bg-stop-chest border-2 border-stop-chest-border text-navy">
            <Package className="w-9 h-9" aria-hidden="true" />
          </span>
          {total ? (
            <>
              <h2 className="text-celebrate font-extrabold text-navy">{t('chest_done')}</h2>
              <p className="text-base text-muted">{t('chest_done_sub', { right, total })}</p>
            </>
          ) : (
            <AmioSays mood="happy" size={64}>{t('chest_empty')}</AmioSays>
          )}
        </div>
        <div className="px-4 pb-6 max-w-lg w-full mx-auto">
          <Button variant="main" className="w-full" onClick={home}>{t('back_home')}</Button>
        </div>
      </div>
    );
  }

  const entry = entries[index];
  const question = questions[index];
  const kind = chestKind(index, total);

  const finish = (result) => {
    const correct = result === 'right' && !missedNow;
    if (result !== 'unchecked') checkpointsApi.chestAnswer(entry, correct).catch(() => {});
    if (correct) setRight((n) => n + 1);
    setMissedNow(false);
    setIndex((i) => i + 1);
    window.scrollTo?.(0, 0);
  };

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-paper flex flex-col">
      <CheckpointHeader title={t('chest_of', { n: index + 1, total })} subtitle={total === 1 ? t('chest_sub_1') : t('chest_sub_n', { n: total })} onClose={home} closeLabel={t('close')} tone="navy">
        <StepBar total={total} current={index + 1} label={t('progress_label', { n: index + 1, total })} />
      </CheckpointHeader>
      <div className="flex-1 flex flex-col">
        <QuestionStep
          key={`${entry.questionId}-${index}`}
          kind={kind}
          question={question}
          hint={kind === 'teach' ? hintFor(entry.questionId) : undefined}
          language={language}
          t={tl}
          savesReview
          showStar={false}
          onMiss={() => setMissedNow(true)}
          onDone={finish}
        />
      </div>
    </div>
  );
}
