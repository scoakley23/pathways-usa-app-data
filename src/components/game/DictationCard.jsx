import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Globe, Loader2, Volume2, X } from 'lucide-react';
import { speakText } from "@/components/utils/textToSpeech";
import { Button } from '@/components/pathways/ui';
import RunScreen, { NavyChip } from '@/components/practice/RunScreen';
import usePracticeText from '@/components/practice/usePracticeText';
import AnswerFeedback from '@/components/practice/AnswerFeedback';
import RunTopBar from '@/components/practice/RunTopBar';
import WordByWord from '@/components/practice/WordByWord';
import { wordScore } from '@/lib/practiceResults';
import { ai } from '@/api/ai';
import { checkDictation } from '@/lib/practiceChecks';
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import useAppLanguage from '@/hooks/useAppLanguage';
import { PACK_ONLY, packText } from '@/lib/translationPack';

// Listen and write (Amio v2; also the vocabulary Word dictation). A navy
// screen with what to do and Hear it, and the learner's sentence in a white
// box with Check; then a bottom panel (AnswerFeedback: Right! / Not quite)
// with what they wrote, the sentence word by word with missed words marked
// (WordByWord) and, after the check, In my language. The check
// (checkDictation, on the device) and what is saved are unchanged. "Show the
// sentence" is for learners who wrote on paper: they check themselves.
// `onClose` adds the run's top bar.
export default function DictationCard({ sentence, onComplete, onNext, index = 0, total = 0, onClose = null }) {
  const [appLanguage] = useAppLanguage();
  const { t } = usePracticeText();
  const [userInput, setUserInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState(null); // null, correct, incorrect, manual, manual-done
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const myLanguage = appLanguage && appLanguage !== 'en'
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
  }, [feedback, showTranslation]);

  const fetchTranslation = async () => {
    if (!sentence || !myLanguage) return;
    setIsTranslating(true);
    try {
      // The translation pack first; live AI only when it doesn't have this
      // text, and never when PACK_ONLY (the switch on).
      const packed = await packText(myLanguage.value, sentence.text);
      if (packed || PACK_ONLY) {
        setTranslation(packed || t('translation_unavailable'));
        return;
      }
      const prompt = `Translate the following text (which could be a word or a sentence) into ${myLanguage.label}: "${sentence.text}". Return ONLY the translated text, nothing else.`;
      const res = await ai.translate({ prompt });
      setTranslation(res);
    } catch (error) {
      console.error("Translation error", error);
      setTranslation(t('translation_unavailable'));
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
  const nextButton = (
    <Button variant="main" className="w-full" onClick={onNext}>
      {t('next_sentence')} <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
    </Button>
  );
  const translationLine = showTranslation && myLanguage && (
    isTranslating
      ? <p className="flex items-center gap-2 text-base text-muted"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {t('translating')}</p>
      : translation && <p lang={myLanguage.value} dir="auto" className="text-base text-muted">{translation}</p>
  );

  const panel = (feedback === 'correct' || feedback === 'incorrect') ? (
    <AnswerFeedback
      status={feedback === 'correct' ? 'correct' : 'not-correct'}
      sub={feedback === 'correct' ? t('every_word') : t('check_marked')}
      youSaid={userInput}
      youSaidLabel={t('you_wrote')}
      accepted={[sentence.text]}
      acceptedLabel={t('the_sentence')}
      onHearAnswer={speak}
    >
      {words && (
        <div className="rounded-card bg-white border border-line p-4">
          <p className="text-small font-semibold text-muted mb-1">{t('word_by_word')}</p>
          <WordByWord words={words} legend={t('words_to_check')} missedLabel={t('missed_sr')} />
        </div>
      )}
      {myLanguage && (
        <Button variant="link" className="self-start px-0" aria-pressed={showTranslation} onClick={() => setShowTranslation((v) => !v)}>
          <Globe className="w-5 h-5" aria-hidden="true" /> {t('in_my_language')}
        </Button>
      )}
      {translationLine}
      {nextButton}
    </AnswerFeedback>
  ) : (feedback === 'manual' || feedback === 'manual-done') ? (
    <AnswerFeedback
      status="neutral"
      title={t('check_page')}
      sub={feedback === 'manual' ? t('wrote_right_q') : null}
      accepted={[sentence.text]}
      acceptedLabel={t('the_sentence')}
      onHearAnswer={speak}
    >
      {translationLine}
      {feedback === 'manual' ? (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="main" className="px-3" onClick={() => selfCheck(true)}><Check className="w-5 h-5" aria-hidden="true" /> {t('yes_matches')}</Button>
          <Button variant="second" onClick={() => selfCheck(false)}><X className="w-5 h-5" aria-hidden="true" /> {t('no_mistake')}</Button>
        </div>
      ) : nextButton}
    </AnswerFeedback>
  ) : null;

  return (
    <RunScreen
      topBar={onClose && <RunTopBar onClose={onClose} index={index} total={total} answered={done} />}
      label={t('writing_label')}
      panel={panel}
    >
      <h2 className="font-display text-[2.25rem] leading-[1.1]" dir="auto">{t('listen_write')}</h2>
      <div>
        <NavyChip onClick={speak} pressed={isPlaying}>
          <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> {t('hear_it')}
        </NavyChip>
      </div>
      {!done && (
        <form className="flex flex-col gap-3 pt-2" onSubmit={(e) => { e.preventDefault(); if (userInput.trim()) checkAnswer(); }}>
          <label htmlFor="dictation-input" className="text-base font-semibold" dir="auto">{t('your_sentence')}</label>
          <textarea
            id="dictation-input"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={t('type_here')}
            rows={2}
            lang="en"
            dir="ltr"
            className="block w-full resize-none rounded-button border border-line bg-white px-4 py-3 text-[1.375rem] leading-snug text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (userInput.trim()) checkAnswer(); } }}
          />
          <Button variant="main" onNavy type="submit" className="w-full" disabled={!userInput.trim()}>
            <Check className="w-6 h-6" aria-hidden="true" /> {t('check')}
          </Button>
          <Button variant="link" onNavy className="self-start px-0" onClick={() => setFeedback('manual')}>{t('on_paper')}</Button>
        </form>
      )}
    </RunScreen>
  );
}
