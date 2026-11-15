import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { AmioSays } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';
import { StepBar } from '@/components/pathways/StepBar';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import ReadItStep from '@/components/lesson/ReadItStep';
import WriteItStep from '@/components/lesson/WriteItStep';
import { LESSON_LINES } from '@/components/lesson/lessonStrings';
import { useJourney } from '@/components/course/courseShared';
import { coursePlay } from '@/api/coursePlay';
import { checkpoints as checkpointsApi } from '@/api/checkpoints';
import { readWriteSentences } from '@/lib/checkpoints';
import { CheckpointHeader, useCheckpointText } from '@/components/checkpoint/checkpointParts';

// A Read and write stop (Prompt 8, /course/readwrite/:stopId; frames
// R30ReadAloud, R30Writing): up to 3 sentences to read out loud, then up to
// 3 to write, from the section's lessons (their Read it and Write it
// sentences), with the lesson player's Read it and Write it screens. Done
// when every sentence is finished, right or skipped. Saves (Supabase only)
// one checkpoint_results row under the stop id: sentences answered right
// of the total, passed. Nothing the learner said or wrote is saved.

export default function ReadWritePage() {
  const { stopId } = useParams();
  const navigate = useNavigate();
  const { t, rtl, language } = useCheckpointText();
  const trLesson = useTranslatedLines(LESSON_LINES, language, { cacheKey: 'lesson_v1' });
  const tl = (key, vars = {}) => {
    let s = (language !== 'en' && trLesson(key)) || LESSON_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  const journey = useJourney();
  const [index, setIndex] = useState(-1); // -1 = start; then items; items.length = done
  const [right, setRight] = useState(0);
  const [writeLevel, setWriteLevel] = useState(1);

  useEffect(() => { coursePlay.writeLevel().then((w) => setWriteLevel(w.write_level)).catch(() => {}); }, []);

  const found = useMemo(() => {
    for (const u of journey.course) for (const s of u.sections) {
      const stop = s.stops.find((st) => st.id === stopId && st.type === 'readwrite');
      if (stop) return { unit: u, section: s, stop };
    }
    return null;
  }, [journey.course, stopId]);
  const items = useMemo(() => {
    if (!found) return [];
    const { read, write } = readWriteSentences(found.stop, found.section);
    return [...read.map((r) => ({ ...r, kind: 'read' })), ...write.map((w) => ({ ...w, kind: 'write' }))];
  }, [found]);
  const back = () => navigate(found ? `/course?unit=${found.unit.id}` : '/course');

  if (journey.loading) return <div className="min-h-screen bg-page" />;
  if (!found || !items.length) {
    return (
      <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-page">
        <CheckpointHeader title={t('rw_title')} onClose={back} closeLabel={t('close')} tone="navy" />
        <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
          <AmioSays mood="kind" size={64}>{t('not_found')}</AmioSays>
          <Link to="/course" className="min-h-main inline-flex items-center justify-center rounded-button bg-denim px-6 text-base font-bold text-white shadow-lip">{t('back_to_road')}</Link>
        </div>
      </div>
    );
  }

  const reads = items.filter((i) => i.kind === 'read').length;
  const writes = items.length - reads;
  const total = items.length;

  if (index < 0 || index >= total) {
    const finished = index >= total;
    return (
      <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-page flex flex-col">
        <CheckpointHeader title={finished ? t('rw_done') : t('rw_title')} subtitle={found.section.title} onClose={back} closeLabel={t('close')} tone="navy" />
        <div className="flex-1 max-w-lg w-full mx-auto px-4 py-6 flex flex-col items-center gap-5 text-center">
          <span className="grid place-items-center w-20 h-20 rounded-full bg-stop-read-write text-white"><Eye className="w-9 h-9" aria-hidden="true" /></span>
          {finished
            ? <AmioSays mood="proud" size={64}>{t('rw_done_sub', { n: total })}</AmioSays>
            : <p className="text-lg font-semibold text-navy">{t('rw_sub', { read: reads, write: writes })}</p>}
          {finished && !checkpointsApi.saves && <p className="text-small text-muted">{t('practice_only')}</p>}
        </div>
        <div className="px-4 pb-6 max-w-lg w-full mx-auto">
          {finished
            ? <Button variant="main" className="w-full" onClick={back}>{t('continue_journey')}</Button>
            : <Button variant="main" className="w-full" onClick={() => { setRight(0); setIndex(0); }}>{t('im_ready')}</Button>}
        </div>
      </div>
    );
  }

  const item = items[index];
  const next = (ok) => {
    const nowRight = right + (ok ? 1 : 0);
    setRight(nowRight);
    if (index + 1 >= total) checkpointsApi.saveResult(found.stop.id, { correct: nowRight, total, passed: true }).catch(() => {});
    setIndex(index + 1);
    window.scrollTo?.(0, 0);
  };
  const readN = item.kind === 'read' ? index + 1 : index - reads + 1;
  const title = item.kind === 'read' ? t('rw_read_of', { n: readN, total: reads }) : t('rw_write_of', { n: readN, total: writes });
  const k = `${item.lesson.id}-${item.kind}-${index}`;

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-page flex flex-col">
      <CheckpointHeader title={title} subtitle={found.section.title} onClose={back} closeLabel={t('close')} tone="navy">
        <StepBar total={total} current={index + 1} label={t('progress_label', { n: index + 1, total })} />
      </CheckpointHeader>
      <div className="flex-1 flex flex-col">
        {item.kind === 'read'
          ? <ReadItStep key={k} lesson={item.lesson} t={tl} onDone={(r) => next(r === 'right')} />
          : <WriteItStep key={k} lesson={item.lesson} level={writeLevel} t={tl} onDone={(r) => next(r === 'right')} />}
      </div>
    </div>
  );
}
