import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Check, ArrowRight, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/pathways/ui';
import MicButton from '@/components/pathways/MicButton';
import RunScreen, { NavyChip, SaidBox } from '@/components/practice/RunScreen';
import { KeyHints } from '@/components/pathways/Stage';
import useShortcuts from '@/components/pathways/useShortcuts';
import usePracticeText from '@/components/practice/usePracticeText';
import AnswerFeedback from '@/components/practice/AnswerFeedback';
import RunTopBar from '@/components/practice/RunTopBar';
import WordByWord from '@/components/practice/WordByWord';
import { stopReading } from '@/components/persona/useAutoRead';
import { readingTipParts, fillTip, READING_CARD_LINES } from '@/lib/readingTips';
import useReadingTip from '@/components/practice/useReadingTip';
import { speakText } from "@/components/utils/textToSpeech";
import { wordDiff } from "@/components/utils/wordDiff";

// Read it aloud (Amio v2, frame Speak): a navy screen with the sentence
// (English) and Hear it, the gold mic ("Tap to answer", "Type instead"),
// then a bottom panel (AnswerFeedback: Right! / Not quite; the existing 70%
// word score) with the sentence word by word (WordByWord). Scoring is
// unchanged: the browser transcript and word matching (wordDiff), and a tip
// chosen on the device (readingTip(); nothing is sent to an AI). Every try is
// saved as before; "Next sentence" after a miss saves nothing more.
// `onClose` adds the run's top bar.
export default function ReadingPracticeCard({ sentence, onComplete, onNext, index = 0, total = 0, onClose = null }) {
  const { t } = usePracticeText();
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [status, setStatus] = useState('idle'); // idle, listening, processing, success, retry, manual, unsupported
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [wordResults, setWordResults] = useState(null);
  // "Type instead" (Prompt 13): typed words get the same word check. In memory only.
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');

  const recognitionRef = useRef(null);
  const spokenTextRef = useRef('');
  const silenceTimeoutRef = useRef(null);

  useEffect(() => {
    // Reset state on new sentence
    setSpokenText('');
    setStatus('idle');
    setAnalysis(null);
    setIsAnalyzing(false);
    setWordResults(null);
  }, [sentence]);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      const resetSilenceTimer = () => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        // Auto-stop after 10 seconds of silence — generous for beginners pausing between words
        silenceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch {}
          }
        }, 10000);
      };

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setStatus('listening');
        setSpokenText('');
        setAnalysis(null);
        setWordResults(null);
        spokenTextRef.current = '';
        resetSilenceTimer();
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setSpokenText(transcript);
        spokenTextRef.current = transcript;
        resetSilenceTimer();
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        setIsListening(false);
        setStatus('error');
      };

      recognitionRef.current.onend = () => {
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        setIsListening(false);
        analyzeReading();
      };
    } else {
      setStatus('unsupported');
    }

    return () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, [sentence]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      stopReading();
      setSpokenText('');
      setStatus('listening');
      setAnalysis(null);
      setWordResults(null);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleShowAnswer = () => {
    speakText(sentence.text, 'en');
    setStatus('manual');
    setAnalysis(null);
    setWordResults(null);
  };

  // Scores come only from the browser's live transcript and word matching.
  // No audio is recorded or uploaded, and nothing is sent to an AI: the tip
  // is chosen on the device.
  const analyzeReading = async () => {
    // ── 1. Word-level diff using the real-time speech recognition transcript ──
    // This is deterministic and CANNOT be tricked by the LLM — it's ground truth.
    const transcript = spokenTextRef.current;
    const diff = wordDiff(sentence.text, transcript);
    setWordResults(diff.words);

    const wordAccuracy = diff.accuracy;

    // ── 2. No speech detected → automatic fail (score 0) ──
    if (!transcript || transcript.trim().length < 2 || diff.spokenWordCount === 0) {
      setAnalysis({
        transcription: '(no speech detected)',
        overall_score: 0,
        matched_count: 0,
        total_words: diff.totalWords,
        phoneme_feedback: fillTip(READING_CARD_LINES.noSpeech),
        tip_parts: { line: READING_CARD_LINES.noSpeech, values: {} },
        general_feedback: 'No speech detected'
      });
      setStatus('retry');
      onComplete(false, 0);
      return;
    }

    // ── 3. Score = word accuracy ──
    const overall = wordAccuracy;

    // ── 4. A tip chosen on the device (never changes the score) ──
    const tipParts = readingTipParts(diff);

    const result = {
      transcription: transcript,
      overall_score: overall,
      matched_count: diff.matchedCount,
      total_words: diff.totalWords,
      phoneme_feedback: fillTip(tipParts.line, tipParts.values),
      tip_parts: tipParts,
      general_feedback: overall >= 70
        ? 'Great job! Your reading is clear and accurate.'
        : wordAccuracy < 50
          ? 'You missed several words. Focus on reading each word carefully and slowly.'
          : 'Good effort! Keep practicing to improve your accuracy.'
    };

    setAnalysis(result);

    if (overall >= 70) {
      setStatus('success');
      onComplete(true, overall);
    } else {
      setStatus('retry');
      onComplete(false, overall);
    }
  };

  const passed = analysis && analysis.overall_score >= 70;
  const heard = analysis && analysis.transcription !== '(no speech detected)';
  const showResult = analysis && !isListening && !isAnalyzing && status !== 'manual' && status !== 'unsupported';

  const panel = showResult ? (
    <AnswerFeedback
      status={passed ? 'correct' : 'not-correct'}
      sub={passed
        ? t('read_score', { score: analysis.overall_score, n: analysis.matched_count, total: analysis.total_words })
        : heard
          ? t('read_close', { score: analysis.overall_score, n: analysis.matched_count, total: analysis.total_words })
          : t('not_heard')}
      youSaid={heard ? analysis.transcription : ''}
    >
      {wordResults && heard && (
        <div className="rounded-card bg-white border border-line p-4">
          <p className="text-small font-semibold text-muted mb-1">{t('word_by_word')}</p>
          <WordByWord words={wordResults} legend={t('missed_words')} missedLabel={t('missed_sr')} />
        </div>
      )}
      {analysis.tip_parts && <ReadingTip parts={analysis.tip_parts} />}
      {passed ? (
        <Button variant="main" className="w-full" onClick={onNext}>
          {t('next_sentence')} <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
        </Button>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="main" className="px-3" onClick={toggleListening}>
              <RotateCcw className="w-5 h-5" aria-hidden="true" /> {t('try_again')}
            </Button>
            <Button variant="second" onClick={onNext}>{t('next_sentence')}</Button>
          </div>
          <Button variant="link" className="self-start px-0" onClick={handleShowAnswer}>{t('hear_and_check')}</Button>
        </>
      )}
    </AnswerFeedback>
  ) : null;

  // The answer controls; on desktop they stand on the right (vision C).
  const readControls = (status === 'unsupported' ? (
        <div className="flex flex-col gap-3 pt-2">
          <p className="flex items-center gap-2 text-lg font-semibold" dir="auto"><AlertCircle className="w-5 h-5 text-gold" aria-hidden="true" /> {t('cant_listen')}</p>
          <p className="text-base text-on-navy" dir="auto">{t('cant_listen_body')}</p>
          <Button variant="main" onNavy className="w-full" onClick={onNext}>{t('skip')}</Button>
        </div>
      ) : status === 'manual' ? (
        <div className="flex flex-col gap-3 pt-2" aria-live="polite">
          <p className="text-xl font-semibold" dir="auto">{t('listen_then')}</p>
          <div>
            <NavyChip onClick={() => speakText(sentence.text, 'en')}>
              <Volume2 className="w-5 h-5" aria-hidden="true" /> {t('play_again')}
            </NavyChip>
          </div>
          <p className="text-lg font-semibold" dir="auto">{t('read_ok_q')}</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="main" onNavy className="px-3" onClick={() => onComplete(true)}><Check className="w-5 h-5" aria-hidden="true" /> {t('yes_got_it')}</Button>
            <Button variant="second" onNavy onClick={() => setStatus('retry')}>{t('no_try_again')}</Button>
          </div>
        </div>
      ) : !showResult && (
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-base font-semibold text-on-navy lg:text-center" dir="auto">{t('read_aloud')}</p>
          {(isListening || spokenText) && (
            <SaidBox label={isListening ? t('listening') : t('you_said')}>{spokenText ? `“${spokenText}”` : ''}</SaidBox>
          )}
          {isAnalyzing ? (
            <p className="flex items-center gap-2 text-lg font-semibold" aria-live="polite"><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> {t('checking_reading')}</p>
          ) : typing && !isListening ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={(e) => { e.preventDefault(); if (!typed.trim()) return; spokenTextRef.current = typed.trim(); setSpokenText(typed.trim()); setTyping(false); analyzeReading(); }}
            >
              <label htmlFor="reading-typed" className="text-base font-semibold" dir="auto">{t('type_sentence')}</label>
              <input id="reading-typed" lang="en" dir="ltr" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} className="min-h-[3.25rem] rounded-button border border-line bg-white px-4 text-lg text-navy focus:outline-none focus:ring-2 focus:ring-white" />
              <Button variant="main" onNavy type="submit" className="w-full" disabled={!typed.trim()}>{t('check')}</Button>
            </form>
          ) : (
            <MicButton
              tone="gold"
              listening={isListening}
              onStart={toggleListening}
              onStop={toggleListening}
              label={t('tap_answer')}
              listeningLabel={t('tap_stop')}
              onTypeInstead={() => { setTyped(''); setTyping(true); }}
              typeInsteadLabel={t('type_instead')}
            />
          )}
          {!isListening && !isAnalyzing && (
            <Button variant="link" onNavy className="self-start px-0" onClick={handleShowAnswer}>{t('hear_and_check')}</Button>
          )}
        </div>
      ));
  // Desktop keys (vision C): R = hear it again; Space is the mic's, Esc the top bar's close.
  useShortcuts({ r: () => speakText(sentence.text, 'en') }, !showResult);

  return (
    <RunScreen
      topBar={onClose && <RunTopBar onClose={onClose} index={index} total={total} answered={!!analysis && passed} />}
      label={t('reading_label')}
      panel={panel}
      side={readControls || false}
    >
      <h2 className={`font-display leading-[1.1] ${showResult ? 'text-[1.75rem] lg:text-[2.5rem]' : 'text-[2.25rem] lg:text-[3.75rem] lg:leading-[1.05]'}`} lang="en" dir="ltr">{sentence.text}</h2>
      <div>
        <NavyChip onClick={() => speakText(sentence.text, 'en')}>
          <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> {t('hear_it')}
        </NavyChip>
      </div>

      {!showResult && status !== 'unsupported' && status !== 'manual' && <KeyHints keys={['space', 'r', 'escape']} />}
    </RunScreen>
  );
}

// The tip in the learner's language (translation pack only), then in English.
function ReadingTip({ parts }) {
  const tip = useReadingTip(parts);
  const label = useReadingTip({ line: READING_CARD_LINES.tip });
  const said = useReadingTip({ line: READING_CARD_LINES.saidInYourLanguage });
  if (!tip.en) return null;
  return (
    <div className="space-y-1">
      <p className="text-base leading-relaxed text-navy" dir="auto">
        <span className="font-semibold">{label.mine || label.en}</span> {tip.mine || tip.en}
      </p>
      {tip.mine && (
        <>
          <p className="text-small text-navy" dir="auto">{said.mine || said.en}</p>
          <p className="text-small text-navy leading-relaxed" lang="en" dir="ltr">{tip.en}</p>
        </>
      )}
    </div>
  );
}
