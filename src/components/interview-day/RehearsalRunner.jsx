import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Eyebrow, PrimaryButton, QuietButton, RaisedCard, SegmentedProgress, SkillTag } from '@/components/pathways/ui';
import InterviewPractice from '@/components/practice/InterviewPractice';
import ReadingPracticeCard from '@/components/practice/ReadingPracticeCard';
import DictationCard from '@/components/game/DictationCard';
import CivicsTestCard from '@/components/practice/CivicsTestCard';
import { stopSpeaking } from '@/components/utils/textToSpeech';
import {
  REHEARSAL_PARTS, SENTENCE_TRIES, civicsRules, civicsStatus, sentenceStatus, speakingPassed, pickRandom, rehearsalResults,
} from '@/lib/interviewDay';
import OathStep from './OathStep';
import RehearsalResults from './RehearsalResults';

// Runs the six parts in order. Everything lives in this component's memory:
// no Base44 writes and no browser storage. Leaving or refreshing loses it.
// Only reads: the question and sentence lists, and the learner's saved
// Find My Representative names (for "Answers vary" civics questions).
export default function RehearsalRunner({ version, userEmail, onStop }) {
  const [part, setPart] = useState(0);
  const [content, setContent] = useState(null);
  const [passed, setPassed] = useState({});

  useEffect(() => {
    let alive = true;
    const { maxQuestions } = civicsRules(version);
    Promise.all([
      base44.entities.ReadingSentence.list(),
      base44.entities.Sentence.list(),
      base44.entities.CivicsQuestion.filter({ version }, null, 500),
      base44.entities.PublicProfile.filter({ user_email: userEmail }, '-created_date', 1).catch(() => []),
    ]).then(([reading, writing, civics, profiles]) => {
      if (!alive) return;
      setContent({
        reading: pickRandom(reading, SENTENCE_TRIES),
        writing: pickRandom(writing, SENTENCE_TRIES),
        civics: pickRandom(civics, maxQuestions),
        representativeData: profiles[0]?.representative_data || null,
      });
    }).catch(() => {
      if (!alive) return;
      toast.error("Couldn't load the rehearsal. Please check your connection.");
      onStop();
    });
    return () => { alive = false; stopSpeaking(); };
  }, [version, userEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  const finishPart = (skill, ok) => {
    stopSpeaking();
    if (skill) setPassed((p) => ({ ...p, [skill]: ok }));
    setPart((n) => n + 1);
    window.scrollTo({ top: 0 });
  };

  const stop = () => { stopSpeaking(); onStop(); };
  const current = REHEARSAL_PARTS[part];

  return (
    <div className="space-y-4 text-pw-navy">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-bold">Part {part + 1} of {REHEARSAL_PARTS.length}: {current.label}</p>
          {current.id !== 'results' && (
            <QuietButton onClick={stop} className="shrink-0 px-3 text-pw-muted">Stop</QuietButton>
          )}
        </div>
        <SegmentedProgress current={part} total={REHEARSAL_PARTS.length} label={`Part ${part + 1} of ${REHEARSAL_PARTS.length}`} />
      </div>

      {!content ? (
        <Loader2 className="w-8 h-8 animate-spin mx-auto mt-10 text-pw-navy" aria-label="Loading" />
      ) : current.id === 'oath' ? (
        <OathStep onDone={() => finishPart(null)} />
      ) : current.id === 'interview' ? (
        <InterviewPractice
          rehearsal={{ onFinish: (results, count) => finishPart('speaking', speakingPassed(results, count)) }}
        />
      ) : current.id === 'reading' ? (
        <QuestionPart
          key="reading"
          skill="reading"
          intro="The officer asks you to read one sentence out loud. You can try up to 3 sentences."
          items={content.reading}
          statusOf={(outcomes) => sentenceStatus(outcomes, content.reading.length)}
          counter={(i) => `Sentence ${i + 1} of up to ${SENTENCE_TRIES}`}
          onDone={(ok) => finishPart('reading', ok)}
          render={(item, record, next, i) => <ReadingPracticeCard testMode index={i} sentence={item} onComplete={record} onNext={next} />}
        />
      ) : current.id === 'writing' ? (
        <QuestionPart
          key="writing"
          skill="writing"
          intro="The officer reads one sentence. You write it. You can try up to 3 sentences."
          items={content.writing}
          statusOf={(outcomes) => sentenceStatus(outcomes, content.writing.length)}
          counter={(i) => `Sentence ${i + 1} of up to ${SENTENCE_TRIES}`}
          onDone={(ok) => finishPart('writing', ok)}
          render={(item, record, next, i) => <DictationCard testMode index={i} sentence={item} onComplete={record} onNext={next} />}
        />
      ) : current.id === 'civics' ? (
        <QuestionPart
          key="civics"
          skill="civics"
          intro={civicsIntro(version)}
          items={content.civics}
          statusOf={(outcomes) => civicsStatus(outcomes, version, content.civics.length)}
          counter={(i, outcomes) => {
            const s = civicsStatus(outcomes, version);
            return `Question ${i + 1} · ${s.correct} right, ${s.wrong} wrong`;
          }}
          onDone={(ok) => finishPart('civics', ok)}
          render={(item, record, next, i) => (
            <CivicsTestCard testMode index={i} question={item} representativeData={content.representativeData} onComplete={record} onNext={next} />
          )}
        />
      ) : (
        <RehearsalResults rows={rehearsalResults(passed)} onAgain={stop} />
      )}
    </div>
  );
}

function civicsIntro(version) {
  const { maxQuestions, passAt } = civicsRules(version);
  return `The officer asks up to ${maxQuestions} civics questions. You pass with ${passAt} right answers, and the officer stops when you pass.`;
}

// One reading, writing, or civics part: shows one card at a time, keeps one
// result per item, and ends when `statusOf` says the part is done.
function QuestionPart({ skill, intro, items, statusOf, counter, onDone, render }) {
  const [index, setIndex] = useState(0);
  const [outcomes, setOutcomes] = useState([]);
  // Cards may call onComplete and onNext in the same tick, so keep a ref.
  const outcomesRef = useRef([]);

  const record = (ok) => {
    if (outcomesRef.current.length > index) return; // one result per item
    outcomesRef.current = [...outcomesRef.current, !!ok];
    setOutcomes(outcomesRef.current);
  };

  const next = () => {
    if (outcomesRef.current.length <= index) record(false);
    const s = statusOf(outcomesRef.current);
    if (s.done) onDone(s.passed);
    else { setIndex(index + 1); window.scrollTo({ top: 0 }); }
  };

  return (
    <div className="space-y-4">
      <RaisedCard className="space-y-2">
        <SkillTag skill={skill} />
        <p className="text-base leading-relaxed">{intro}</p>
        {items.length > 0 && <Eyebrow>{counter(index, outcomes)}</Eyebrow>}
      </RaisedCard>
      {items.length === 0 ? (
        <RaisedCard className="space-y-3">
          <p className="text-base">This part isn&apos;t available right now.</p>
          <PrimaryButton className="w-full" onClick={() => onDone(false)}>Continue</PrimaryButton>
        </RaisedCard>
      ) : (
        <React.Fragment key={items[index].id || index}>
          {render(items[index], record, next, index)}
        </React.Fragment>
      )}
    </div>
  );
}
