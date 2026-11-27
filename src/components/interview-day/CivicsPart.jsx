import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import useSpeechCapture from '@/components/persona/useSpeechCapture';
import useLearnerLocation from '@/components/civics/useLearnerLocation';
import { speakText, stopSpeaking } from '@/components/utils/textToSpeech';
import { gradeCivics } from '@/components/lesson/lessonParts';
import { isRepeatRequest } from '@/lib/repeatRequest';
import { civicsStatus } from '@/lib/interviewDay';
import { AnswerArea, DayFrame, DayResult } from './dayParts';

// Civics: the officer asks each question out loud (shown too). Graded like
// lessons (gradeCivics(): officeholder questions on the device from the
// official list, then the device match, then, for spoken answers only, the
// AI against the official answers). It stops at the pass mark or once the
// learner can no longer pass (civicsStatus). "Could you repeat that?" is not
// an answer: the question is read again and nothing is graded.
export default function CivicsPart({ t, items, version, onDone, onStop }) {
  const { location } = useLearnerLocation();
  const [i, setI] = useState(0);
  const [outcomes, setOutcomes] = useState([]);
  const [said, setSaid] = useState(null);
  const [checking, setChecking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const question = items[i];

  const ask = () => {
    if (!question) return;
    setSpeaking(true);
    speakText(question.question, 'en', { onEnd: () => setSpeaking(false) });
  };
  useEffect(() => { ask(); return () => stopSpeaking(); }, [i]);

  const grade = async (text, { typed = false } = {}) => {
    const answer = (text || '').trim();
    if (!answer) return;
    if (isRepeatRequest(answer)) { speech.reset(); ask(); return; }
    setSaid(answer);
    setChecking(true);
    try {
      const { correct } = await gradeCivics(question, answer, { location, typed });
      setOutcomes((o) => [...o, correct]);
    } catch {
      setOutcomes((o) => [...o, null]);
    } finally {
      setChecking(false);
    }
  };
  const speech = useSpeechCapture((text) => grade(text));

  const answered = said !== null && !checking && outcomes.length === i + 1;
  const last = outcomes[outcomes.length - 1];
  const status = civicsStatus(outcomes, version, items.length);
  const next = () => {
    if (status.done) { onDone(status.passed); return; }
    speech.reset(); setSaid(null); setI(i + 1);
  };

  return (
    <DayFrame part="civics" t={t} speaking={speaking} small={answered} status={checking ? t('status_checking') : speaking ? t('status_speaking') : t('status_turn')} onStop={onStop}>
      <div className="rounded-card bg-white border border-line p-5 space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-small font-semibold text-muted">{t('question_n', { n: i + 1 })}</p>
          <p className="text-small font-semibold text-muted tabular-nums">{t('civics_count', { right: status.correct, wrong: status.wrong })}</p>
        </div>
        <p className="text-question font-bold leading-snug" lang="en" dir="ltr">{question?.question}</p>
        {speech.listening && <p className="text-base font-semibold text-denim break-words" aria-live="polite" lang="en" dir="ltr">{speech.transcript || '…'}</p>}
      </div>
      {checking && <Loader2 className="w-6 h-6 animate-spin mx-auto text-navy" aria-label={t('status_checking')} />}
      {answered ? (
        <DayResult
          t={t}
          said={said}
          ok={last}
          line={last === null ? t('civics_unchecked') : last ? t('civics_ok') : t('civics_not')}
          onNext={next}
          nextLabel={status.done ? t('continue') : t('next')}
        />
      ) : !checking && (
        <AnswerArea t={t} speech={speech} onRepeat={ask} onTyped={(text) => grade(text, { typed: true })} onStop={onStop} disabled={speaking} />
      )}
    </DayFrame>
  );
}
