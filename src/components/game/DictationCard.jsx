import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Globe, Loader2, Volume2, X } from 'lucide-react';
import { speakText } from "@/components/utils/textToSpeech";
import { Button, Chip, CreamSheet, NavyTop, RuledPaper } from '@/components/pathways/ui';
import AnswerFeedback from '@/components/practice/AnswerFeedback';
import RunTopBar from '@/components/practice/RunTopBar';
import WordByWord from '@/components/practice/WordByWord';
import { wordScore } from '@/lib/practiceResults';
import { base44 } from '@/api/base44Client';
import { checkDictation } from '@/lib/practiceChecks';
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import useAppLanguage from '@/hooks/useAppLanguage';

// Listen and write (The Road; also the vocabulary Word dictation). On navy:
// what to do and "Hear it" (and, after the check, "In my language" in the
// app language). On the cream sheet: the learner types on ruled paper and
// checks; then Correct / Not correct (AnswerFeedback), what they wrote and
// the sentence word by word with missed words marked (WordByWord). The check
// (checkDictation, on the device) and what is saved are unchanged. "Show the
// sentence" is for learners who wrote on paper: they check themselves.
// `testMode` (Interview Day): checked once, no translation, no "Show the
// sentence". `onClose` adds the run's top bar; `embedded` = inside another
// page's padding.
export default function DictationCard({ sentence, onComplete, onNext, testMode = false, index = 0, total = 0, onClose = null, embedded = false }) {
  const [appLanguage] = useAppLanguage();
  const [userInput, setUserInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState(null); // null, correct, incorrect, manual, manual-done
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const myLanguage = !testMode && appLanguage && appLanguage !== 'en'
    ? LANGUAGES.find((l) => l.value === appLanguage)
    : null;

  // Reset when the sentence changes
  useEffect(() => {
    setUserInput('');
    setFeedback(null);
    setIsPlaying(false);
    setTranslation('');
  }, [sentence]);

  // The translation shows only after the check (it would give the answer away).
  useEffect(() => {
    if (feedback && showTranslation && myLanguage && !translation) fetchTranslation();
  }, [feedback, showTranslation]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTranslation = async () => {
    if (!sentence || !myLanguage) return;
    setIsTranslating(true);
    try {
      const prompt = `Translate the following text (which could be a word or a sentence) into ${myLanguage.label}: "${sentence.text}". Return ONLY the translated text, nothing else.`;
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setTranslation(res);
    } catch (error) {
      console.error("Translation error", error);
      setTranslation("Translation unavailable");
    } finally {
      setIsTranslating(false);
    }
  };

  const speak = () => {
    if (!sentence) return;
    speakText(sentence.text, 'en', {
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false)
    });
  };

  const checkAnswer = () => {
    const { isCorrect, words: checked } = checkDictation(sentence.text, userInput);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    // The word score lets a near miss count as "almost".
    onComplete(isCorrect, isCorrect ? 100 : wordScore(checked));
  };

  const selfCheck = (isCorrect) => {
    onComplete(isCorrect);
    setFeedback('manual-done');
  };

  const done = !!feedback;
  const words = feedback === 'incorrect' ? checkDictation(sentence.text, userInput).words : null;
  const label = testMode ? 'Writing test' : 'Writing · Listen and write';
  const nextButton = (
    <Button variant="next" className="w-full min-h-[52px]" onClick={onNext}>
      Next sentence <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
    </Button>
  );
  const translationLine = showTranslation && myLanguage && (
    isTranslating
      ? <p className="flex items-center gap-2 text-base text-ink-2"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Translating…</p>
      : translation && <p lang={myLanguage.value} dir="auto" className="text-base text-ink-2">{translation}</p>
  );

  return (
    <div className={embedded ? 'w-full max-w-2xl mx-auto' : ''}>
      {/* NAVY TOP: what to do, and the sentence to hear */}
      <NavyTop className={`pb-12 ${embedded ? 'rounded-card' : ''}`}>
        <div className="mx-auto max-w-2xl space-y-4">
          {onClose && <RunTopBar onClose={onClose} index={index} total={total} answered={done} />}
          <p className="text-label uppercase text-on-navy">{label}</p>
          <h2 className="font-display text-[38px] sm:text-[40px] leading-[1.1]">
            {testMode ? 'Listen, then type what you hear.' : 'Listen, then write what you hear.'}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Chip onNavy onClick={speak} className={isPlaying ? 'bg-navy-line' : ''}>
              <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> Hear it
            </Chip>
            {done && myLanguage && (
              <Chip onNavy onClick={() => setShowTranslation((v) => !v)} aria-pressed={showTranslation}>
                <Globe className="w-5 h-5 shrink-0" aria-hidden="true" /> In my language
              </Chip>
            )}
          </div>
        </div>
      </NavyTop>

      {/* CREAM SHEET: the learner's page, then the result */}
      <CreamSheet className={embedded ? 'rounded-b-card' : 'min-h-[50vh]'}>
        <div className="mx-auto max-w-2xl space-y-5 pb-6">
          {!done && (
            <>
              <RuledPaper>
                <label htmlFor="dictation-input" className="block text-[13px] font-semibold uppercase tracking-[0.14em] leading-[36px] text-ink-label">
                  {testMode ? 'Type the sentence' : 'Your sentence'}
                </label>
                <textarea
                  id="dictation-input"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Type the sentence here…"
                  rows={2}
                  className="block w-full resize-none bg-transparent text-[22px] leading-[36px] text-ink placeholder:text-ink-2 focus:outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (userInput.trim()) checkAnswer(); } }}
                />
              </RuledPaper>
              <Button variant="main" className="w-full min-h-[60px]" onClick={checkAnswer} disabled={!userInput.trim()}>
                <Check className="w-6 h-6" aria-hidden="true" /> Check
              </Button>
              {!testMode && (
                <Button variant="link" className="px-0" onClick={() => setFeedback('manual')}>
                  Wrote it on paper? Show the sentence
                </Button>
              )}
            </>
          )}

          {(feedback === 'correct' || feedback === 'incorrect') && (
            <AnswerFeedback
              status={feedback === 'correct' ? 'correct' : 'not-correct'}
              sub={feedback === 'correct' ? 'Every word matches.' : 'Not yet, but you’re close. Check the marked words.'}
              youSaid={userInput}
              youSaidLabel="You wrote"
              accepted={[sentence.text]}
              acceptedLabel="The sentence"
              onHearAnswer={speak}
            >
              {words && (
                <RuledPaper>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.14em] leading-[36px] text-ink-label">The sentence, word by word</p>
                  <WordByWord words={words} legend="Words to check" />
                </RuledPaper>
              )}
              {translationLine}
              {nextButton}
            </AnswerFeedback>
          )}

          {(feedback === 'manual' || feedback === 'manual-done') && (
            <AnswerFeedback
              status="neutral"
              title="Check your page"
              sub={feedback === 'manual' ? 'Did you write it correctly?' : null}
              accepted={[sentence.text]}
              acceptedLabel="The sentence"
              onHearAnswer={speak}
            >
              {translationLine}
              {feedback === 'manual' ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="next" className="min-h-[52px]" onClick={() => selfCheck(true)}><Check className="w-5 h-5" aria-hidden="true" /> Yes, it matches</Button>
                  <Button variant="second" className="min-h-[52px]" onClick={() => selfCheck(false)}><X className="w-5 h-5" aria-hidden="true" /> No, I made a mistake</Button>
                </div>
              ) : nextButton}
            </AnswerFeedback>
          )}
        </div>
      </CreamSheet>
    </div>
  );
}
