import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { content as contentApi } from '@/api/content';
import InterviewPractice from '@/components/practice/InterviewPractice';
import { stopSpeaking } from '@/components/utils/textToSpeech';
import { DAY_PARTS, SENTENCE_TRIES, civicsRules, pickRandom, rehearsalResults, speakingPassed } from '@/lib/interviewDay';
import OathPart from './OathPart';
import ReadPart from './ReadPart';
import WritePart from './WritePart';
import CivicsPart from './CivicsPart';
import FullDayReport from './FullDayReport';

// The whole day as one practice call (Amio v2, amio-v2/interview-day): the
// oath, the N-400 questions (the mock interview in rehearsal mode,
// understanding-only for questions about the learner's history), reading,
// writing and civics, then the report. Everything stays in this component's
// memory: no records, no browser storage. Leaving or refreshing loses it.
// It only reads the sentence and question lists (and, for "your state"
// civics questions, the learner's saved "Who Represents Me?" place).
export default function FullDayCall({ version, t, onStop }) {
  const [part, setPart] = useState(0);
  const [content, setContent] = useState(null);
  const [passed, setPassed] = useState({});
  const [round, setRound] = useState(0);

  useEffect(() => {
    let alive = true;
    const { maxQuestions } = civicsRules(version);
    Promise.all([
      contentApi.readingSentences(),
      contentApi.writingSentences(),
      contentApi.civicsQuestions({ version, limit: 500 }),
    ]).then(([reading, writing, civics]) => {
      if (!alive) return;
      setContent({
        reading: pickRandom(reading, SENTENCE_TRIES),
        writing: pickRandom(writing, SENTENCE_TRIES),
        civics: pickRandom(civics, maxQuestions),
      });
    }).catch(() => {
      if (!alive) return;
      toast.error(t('load_error'));
      onStop();
    });
    return () => { alive = false; stopSpeaking(); };
  }, [version, round]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = (skill, ok) => {
    stopSpeaking();
    if (skill) setPassed((p) => ({ ...p, [skill]: ok }));
    setPart((n) => n + 1);
    window.scrollTo({ top: 0 });
  };
  const stop = () => { stopSpeaking(); onStop(); };
  const again = () => { setPassed({}); setPart(0); setContent(null); setRound((r) => r + 1); window.scrollTo({ top: 0 }); };

  if (!content) {
    return (
      <div className="min-h-screen bg-paper grid place-items-center text-navy">
        <p className="flex items-center gap-3 text-base font-semibold"><Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />{t('loading')}</p>
      </div>
    );
  }

  const id = DAY_PARTS[part];
  if (id === 'oath') return <OathPart key={`oath-${round}`} t={t} onDone={() => finish(null)} onStop={stop} />;
  if (id === 'n400') {
    const n = part + 1;
    return (
      <InterviewPractice
        key={`n400-${round}`}
        rehearsal={{ onFinish: (results, count) => finish('speaking', speakingPassed(results, count)) }}
        onClose={stop}
        day={{
          title: t('call_title', { n, total: DAY_PARTS.length, part: t('part_n400') }),
          current: part,
          total: DAY_PARTS.length,
          dashLabel: t('parts_label', { n, total: DAY_PARTS.length }),
          closeLabel: t('stop'),
          endLabel: t('end_call'),
        }}
      />
    );
  }
  if (id === 'reading') return <ReadPart key={`read-${round}`} t={t} items={content.reading} onDone={(ok) => finish('reading', ok)} onStop={stop} />;
  if (id === 'writing') return <WritePart key={`write-${round}`} t={t} items={content.writing} onDone={(ok) => finish('writing', ok)} onStop={stop} />;
  if (id === 'civics') return <CivicsPart key={`civics-${round}`} t={t} items={content.civics} version={version} onDone={(ok) => finish('civics', ok)} onStop={stop} />;
  return <FullDayReport t={t} rows={rehearsalResults(passed)} onAgain={again} onBack={stop} />;
}
