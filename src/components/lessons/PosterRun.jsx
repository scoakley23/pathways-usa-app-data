import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Keyboard, Loader2, Mic, MicOff, RotateCcw } from 'lucide-react';
import { ExplainSimplyButton, Poster, posterOutline as outlineWhite, posterSolid as solidWhite } from '@/components/pathways/ui';
import useDeckText from './useDeckText';
import { checkCivicsAnswer, officeholderCheck } from '@/components/civics/checkCivicsAnswer';
import OfficeholderNote from '@/components/civics/OfficeholderNote';
import useLearnerLocation from '@/components/civics/useLearnerLocation';
import { stopReading } from '@/components/persona/useAutoRead';
import { speakText } from '@/components/utils/textToSpeech';
import { isRepeatRequest } from '@/lib/repeatRequest';
import { splitOfficialAnswers } from '@/lib/practiceChecks';
import { matchCivicsAnswer } from '@/lib/answerVariants';
import { officeholderAnswerFor, officeholderAnswerLine } from '@/lib/officeholderQuestions';
import { explainText, getExplanation } from '@/lib/explanations';
import { RTL_LANGUAGES } from '@/hooks/useAppLanguage';

// Removes the "(2025 test)"-style note some question texts carry.
export const cleanQuestionText = (text) => (text || '').replace(/\s*\([^)]*(?:2008|2025)[^)]*\)\s*$/i, '').trim();

// The official answer as shown on a card: the accepted answers, or, for
// current officeholder and capital questions, the names from the officeholders
// table (with the learner's saved "Who Represents Me?" place).
export function officialAnswerText(question, location = null) {
  const officeholder = officeholderAnswerFor(question, location);
  if (officeholder) return officeholderAnswerLine(officeholder);
  return splitOfficialAnswers(question.answer).join(' · ') || question.answer;
}

const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

// "Go over them": one official question per navy card (Amio v2: 12px
// corners, gold main buttons, wording in DECK_LINES). Answers are checked on the device first (matchCivicsAnswer());
// a spoken answer that doesn't match goes to checkCivicsAnswer() (AI, the
// official answer is never rewritten); typed answers never leave the device. Officeholder and capital questions are graded from
// the officeholders table only (never the AI); one that can't be graded is
// left out of the score (onFinish's total counts graded cards only). Feedback shows official answers only. "Explain it
// simply" shows the reviewed explanation (content/explanations), nothing
// AI-written. What the learner says or types stays in memory.
// onFinish({ correct, total }) runs after the last card.
export default function PosterRun({ questions, language = 'en', label, onFinish }) {
  const { t } = useDeckText();
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState('speak');
  const [answer, setAnswer] = useState('');
  const [listening, setListening] = useState(false);
  const [checking, setChecking] = useState(false);
  const [askedAgain, setAskedAgain] = useState(false); // "Could you repeat that?" (not an answer)
  const [result, setResult] = useState(null); // { isCorrect } | { selfCheck: true }
  const [explainOpen, setExplainOpen] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [outcomes, setOutcomes] = useState([]); // 'right' | 'missed'
  const [ungraded, setUngraded] = useState(0);
  const recRef = useRef(null);
  const { location } = useLearnerLocation();

  useEffect(() => {
    if (!SR) { setMode('type'); return undefined; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => setAnswer(Array.from(e.results).map((r) => r[0].transcript).join(''));
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    return () => { try { rec.stop(); } catch (e) { /* not started */ } };
  }, []);

  const q = questions[index];
  const total = questions.length;
  if (!q) return null;
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';

  const stopMic = () => { if (listening) { try { recRef.current?.stop(); } catch (e) { /* ignore */ } } };
  const toggleMic = () => {
    if (listening) { stopMic(); return; }
    stopReading();
    setAnswer('');
    try { recRef.current?.start(); } catch (e) { /* already listening */ }
  };

  const check = async () => {
    if (!answer.trim()) return;
    stopMic();
    // Asking to hear the question again is not an answer: read it again,
    // grade nothing.
    if (isRepeatRequest(answer)) {
      setAnswer('');
      setAskedAgain(true);
      speakText(cleanQuestionText(q.question), 'en');
      return;
    }
    setAskedAgain(false);
    const local = officeholderCheck(q, answer, location);
    if (local) {
      setResult({ isCorrect: local.is_correct, officeholder: local.officeholder });
      return;
    }
    // Checked on the device first (typed and spoken); only a spoken answer
    // that doesn't match goes to the AI, which judges the meaning.
    const onDevice = matchCivicsAnswer(answer, q);
    if (mode === 'type' || onDevice.sure) {
      setResult({ isCorrect: onDevice.isCorrect });
      return;
    }
    setChecking(true);
    try {
      const r = await checkCivicsAnswer(q, answer, { location });
      setResult({ isCorrect: !!r?.is_correct });
    } catch (e) {
      setResult({ selfCheck: true });
    } finally {
      setChecking(false);
    }
  };

  // gotIt === null: can't be graded, so neither right nor wrong .
  const next = (gotIt) => {
    const nextCorrect = correct + (gotIt ? 1 : 0);
    const nextUngraded = ungraded + (gotIt === null ? 1 : 0);
    setCorrect(nextCorrect);
    setUngraded(nextUngraded);
    if (gotIt !== null) setOutcomes((prev) => { const n = [...prev]; n[index] = gotIt ? 'right' : 'missed'; return n; });
    setAnswer('');
    setResult(null);
    setAskedAgain(false);
    setExplainOpen(false);
    if (index + 1 < total) setIndex(index + 1);
    else onFinish?.({ correct: nextCorrect, total: total - nextUngraded });
  };
  const officeholder = officeholderAnswerFor(q, location);

  const explanation = explainText(getExplanation(q.question, language), language);

  return (
    <div className="space-y-0">
      <Poster
        className="min-h-[420px]"
        label={t('run_label', { label: label || t('step_review'), n: index + 1, total })}
        question={cleanQuestionText(q.question)}
        answer={result ? t('answer', { answer: officialAnswerText(q, location) }) : null}
        progress={{ index, total, results: outcomes }}
      >
        {!result ? (
          <div className="space-y-4">
            {askedAgain && !answer && <p role="status" className="text-lg" dir="auto">{t('asked_again')}</p>}
            <div className="flex gap-2" role="group" aria-label={t('answer_mode')}>
              {SR && (
                <button type="button" aria-pressed={mode === 'speak'} onClick={() => setMode('speak')} className={mode === 'speak' ? solidWhite : outlineWhite}>
                  <Mic className="w-5 h-5" aria-hidden="true" /> {t('speak')}
                </button>
              )}
              <button type="button" aria-pressed={mode === 'type'} onClick={() => { stopMic(); setMode('type'); }} className={mode === 'type' ? solidWhite : outlineWhite}>
                <Keyboard className="w-5 h-5" aria-hidden="true" /> {t('type')}
              </button>
            </div>
            {mode === 'speak' ? (
              <>
                <p className="min-h-[56px] rounded-card bg-navy-2 p-3 text-lg" aria-live="polite" dir="auto">
                  {answer || (listening ? t('listening') : t('tap_start'))}
                </p>
                <button type="button" onClick={toggleMic} className={outlineWhite}>
                  {listening ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
                  {listening ? t('stop') : t('start_speaking')}
                </button>
              </>
            ) : (
              <>
                <label htmlFor={`poster-answer-${index}`} className="sr-only">{t('your_answer')}</label>
                <input
                  id={`poster-answer-${index}`}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') check(); }}
                  placeholder={t('type_answer')}
                  lang="en"
                  dir="ltr"
                  className="w-full min-h-[52px] rounded-button bg-white px-4 text-lg text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                />
              </>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={check} disabled={!answer.trim() || checking} className={solidWhite}>
                {checking ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Check className="w-5 h-5" aria-hidden="true" />}
                {t('check')}
              </button>
              <button type="button" onClick={() => { stopMic(); setResult({ selfCheck: true }); }} className={outlineWhite}>
                {t('show_answer')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4" aria-live="polite">
            {result.selfCheck ? (
              <p className="text-lg font-semibold" dir="auto">{t('did_you_know')}</p>
            ) : (
              <p className={`inline-flex items-center gap-2 rounded-card px-4 py-2 text-xl font-bold ${result.isCorrect ? 'bg-gold text-navy' : 'bg-navy-2 text-white'}`} dir="auto">
                {result.isCorrect && <Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" />}
                {result.isCorrect === null ? t('cant_check') : result.isCorrect ? t('right') : t('not_yet')}
              </p>
            )}
            {answer && <p className="text-base" dir="auto">{t('you_said', { answer })}</p>}
            {result.officeholder
              ? <OfficeholderNote answer={result.officeholder} onPoster />
              : officeholder && <OfficeholderNote answer={officeholder} graded={false} onPoster />}
            <div className="flex flex-wrap gap-2">
              {result.selfCheck ? (
                <>
                  <button type="button" onClick={() => next(true)} className={solidWhite}><Check className="w-5 h-5" aria-hidden="true" /> {t('knew_it')}</button>
                  <button type="button" onClick={() => next(false)} className={outlineWhite}><RotateCcw className="w-5 h-5" aria-hidden="true" /> {t('not_yet_short')}</button>
                </>
              ) : (
                <button type="button" onClick={() => next(result.isCorrect)} className={solidWhite}>
                  {index + 1 < total ? t('next_card') : t('finish')} <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
                </button>
              )}
              <ExplainSimplyButton onPoster aria-expanded={explainOpen} onClick={() => setExplainOpen((v) => !v)}>{t('explain_simply')}</ExplainSimplyButton>
            </div>
          </div>
        )}
      </Poster>

      {/* "Explain it simply": a white sheet under the poster */}
      {result && explainOpen && (
        <div className="mt-2 rounded-card bg-white border-[1.5px] border-line p-4 text-navy space-y-2">
          {explanation.text.mine && <p dir={dir} className="text-lg leading-relaxed whitespace-pre-line">{explanation.text.mine}</p>}
          {explanation.text.en && <p lang="en" dir="ltr" className={`leading-relaxed whitespace-pre-line ${explanation.text.mine ? 'text-muted' : 'text-lg'}`}>{explanation.text.en}</p>}
          {explanation.note && <p className="text-sm text-muted">{explanation.note.mine || explanation.note.en}</p>}
        </div>
      )}
    </div>
  );
}
