import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Keyboard, Loader2, Mic, MicOff, RotateCcw } from 'lucide-react';
import { ExplainSimplyButton, Poster, posterTone } from '@/components/pathways/ui';
import { checkCivicsAnswer, isChangingAnswer, isLocationAnswer } from '@/components/civics/checkCivicsAnswer';
import { stopReading } from '@/components/persona/useAutoRead';
import { matchOfficialAnswer, splitOfficialAnswers } from '@/lib/practiceChecks';
import { currentAnswerFor } from '@/lib/currentAnswers';
import { explainText, getExplanation } from '@/lib/explanations';
import { RTL_LANGUAGES } from '@/hooks/useAppLanguage';

// Removes the "(2025 test)"-style note some question texts carry.
export const cleanQuestionText = (text) => (text || '').replace(/\s*\([^)]*(?:2008|2025)[^)]*\)\s*$/i, '').trim();

// The official answer as shown on a card: the accepted answers, or the
// admin-confirmed current name for "Answers change" questions.
export function officialAnswerText(question) {
  const now = currentAnswerFor(question);
  if (now?.kind === 'current') return now.text;
  if (isChangingAnswer(question)) return 'Answers change. Check the current answer on uscis.gov.';
  if (isLocationAnswer(question)) return 'Answers vary by where you live. Use Find My Representative on the Learn page.';
  return splitOfficialAnswers(question.answer).join(' · ') || question.answer;
}

// What a typed answer is checked against on the device (null = can't check
// on the device, so the learner checks themselves).
function typedTarget(question) {
  const now = currentAnswerFor(question);
  if (now?.kind === 'current') return now.text;
  if (isChangingAnswer(question) || isLocationAnswer(question)) return null;
  return question.answer;
}

const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

const onPosterBtn = 'min-h-[48px] rounded-full px-5 inline-flex items-center justify-center gap-2 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-50';
const solidWhite = `${onPosterBtn} bg-white text-pw-navy hover:bg-pw-soft`;
const outlineWhite = `${onPosterBtn} border-2 border-white text-white hover:bg-white/10`;

// "Go over them": one official question per full-bleed poster, alternating
// red and blue. Spoken answers are checked by checkCivicsAnswer() (AI, the
// official answer is never rewritten); typed answers on the device with
// matchOfficialAnswer(). Feedback shows official answers only. "Explain it
// simply" shows the reviewed explanation (content/explanations), nothing
// AI-written. What the learner says or types stays in memory.
// onFinish({ correct, total }) runs after the last card.
export default function PosterRun({ questions, language = 'en', tutorName = 'Vía', label = 'Go over them', onFinish }) {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState('speak');
  const [answer, setAnswer] = useState('');
  const [listening, setListening] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null); // { isCorrect } | { selfCheck: true }
  const [explainOpen, setExplainOpen] = useState(false);
  const [correct, setCorrect] = useState(0);
  const recRef = useRef(null);

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
  const tone = posterTone(index);
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
    if (mode === 'type') {
      const target = typedTarget(q);
      setResult(target ? { isCorrect: matchOfficialAnswer(answer, target).isCorrect } : { selfCheck: true });
      return;
    }
    setChecking(true);
    try {
      const r = await checkCivicsAnswer(q, answer);
      setResult({ isCorrect: !!r?.is_correct });
    } catch (e) {
      setResult({ selfCheck: true });
    } finally {
      setChecking(false);
    }
  };

  const next = (gotIt) => {
    const nextCorrect = correct + (gotIt ? 1 : 0);
    setCorrect(nextCorrect);
    setAnswer('');
    setResult(null);
    setExplainOpen(false);
    if (index + 1 < total) setIndex(index + 1);
    else onFinish?.({ correct: nextCorrect, total });
  };

  const explanation = explainText(getExplanation(q.question, language), language);

  return (
    <div className="space-y-0">
      <Poster
        tone={tone}
        className="-mx-4 sm:mx-0 sm:rounded-[14px] min-h-[420px]"
        label={`${label} · Card ${index + 1} of ${total}`}
        question={cleanQuestionText(q.question)}
        answer={result ? `Answer: ${officialAnswerText(q)}` : null}
      >
        {/* Small squares: one per card, alternating colors, filled when passed */}
        <div className="flex flex-wrap gap-1.5 mb-6" aria-hidden="true">
          {questions.map((_, k) => (
            <span key={k} className={`w-3 h-3 rounded-[3px] border border-white ${k < index ? 'bg-white' : k === index ? 'bg-white/60' : ''}`} />
          ))}
        </div>

        {!result ? (
          <div className="space-y-4">
            <div className="flex gap-2" role="group" aria-label="Answer mode">
              {SR && (
                <button type="button" aria-pressed={mode === 'speak'} onClick={() => setMode('speak')} className={mode === 'speak' ? solidWhite : outlineWhite}>
                  <Mic className="w-5 h-5" aria-hidden="true" /> Speak
                </button>
              )}
              <button type="button" aria-pressed={mode === 'type'} onClick={() => { stopMic(); setMode('type'); }} className={mode === 'type' ? solidWhite : outlineWhite}>
                <Keyboard className="w-5 h-5" aria-hidden="true" /> Type
              </button>
            </div>
            {mode === 'speak' ? (
              <>
                <p className="min-h-[56px] rounded-[10px] bg-white/10 border border-white/60 p-3 text-lg" aria-live="polite">
                  {answer || (listening ? 'Listening…' : 'Tap Start speaking, then say your answer in English.')}
                </p>
                <button type="button" onClick={toggleMic} className={outlineWhite}>
                  {listening ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
                  {listening ? 'Stop' : 'Start speaking'}
                </button>
              </>
            ) : (
              <>
                <label htmlFor={`poster-answer-${index}`} className="sr-only">Your answer</label>
                <input
                  id={`poster-answer-${index}`}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') check(); }}
                  placeholder="Type your answer in English"
                  className="w-full min-h-[52px] rounded-[10px] bg-white px-4 text-lg text-pw-navy placeholder:text-pw-muted focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                />
              </>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={check} disabled={!answer.trim() || checking} className={solidWhite}>
                {checking ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Check className="w-5 h-5" aria-hidden="true" />}
                Check
              </button>
              <button type="button" onClick={() => { stopMic(); setResult({ selfCheck: true }); }} className={outlineWhite}>
                Show the answer
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4" aria-live="polite">
            {result.selfCheck ? (
              <p className="text-lg font-semibold">Did you know it?</p>
            ) : (
              <p className="text-2xl font-bold">{result.isCorrect ? 'Right.' : 'Not yet. Here is the answer.'}</p>
            )}
            {answer && <p className="text-base">You said: “{answer}”</p>}
            <div className="flex flex-wrap gap-2">
              {result.selfCheck ? (
                <>
                  <button type="button" onClick={() => next(true)} className={solidWhite}><Check className="w-5 h-5" aria-hidden="true" /> I knew it</button>
                  <button type="button" onClick={() => next(false)} className={outlineWhite}><RotateCcw className="w-5 h-5" aria-hidden="true" /> Not yet</button>
                </>
              ) : (
                <button type="button" onClick={() => next(result.isCorrect)} className={solidWhite}>
                  {index + 1 < total ? 'Next card' : 'Finish'} <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
              <ExplainSimplyButton onPoster aria-expanded={explainOpen} onClick={() => setExplainOpen((v) => !v)} />
            </div>
          </div>
        )}
      </Poster>

      {/* "Explain it simply": a white sheet under the poster */}
      {result && explainOpen && (
        <div className="-mx-4 sm:mx-0 sm:mt-2 sm:rounded-[14px] bg-white border border-pw-line p-5 text-pw-navy space-y-2">
          {explanation.text.mine && <p dir={dir} className="text-lg leading-relaxed whitespace-pre-line">{explanation.text.mine}</p>}
          {explanation.text.en && <p className={`leading-relaxed whitespace-pre-line ${explanation.text.mine ? 'text-pw-muted' : 'text-lg'}`}>{explanation.text.en}</p>}
          {explanation.note && <p className="text-sm text-pw-muted">{explanation.note.mine || explanation.note.en}</p>}
          <p className="font-display italic text-lg text-pw-muted">— {tutorName}</p>
        </div>
      )}
    </div>
  );
}
