import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Check, ArrowRight, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { Button, Chip, CreamSheet, NavyTop } from '@/components/pathways/ui';
import AnswerFeedback from '@/components/practice/AnswerFeedback';
import RunTopBar from '@/components/practice/RunTopBar';
import WordByWord from '@/components/practice/WordByWord';
import { stopReading } from '@/components/persona/useAutoRead';
import { readingTipParts, fillTip, READING_CARD_LINES } from '@/lib/readingTips';
import useReadingTip from '@/components/practice/useReadingTip';
import { speakText } from "@/components/utils/textToSpeech";
import { wordDiff } from "@/components/utils/wordDiff";

// `testMode` (Interview Day): like the real test, one try per sentence and no
// "Show Answer". A try with no speech heard doesn't count; the learner can
// try again. Without it nothing changes.
// The Road: the sentence on navy ("Hear it"), "Say it" on the cream sheet,
// then Correct / Not correct (AnswerFeedback; the existing 70% word score)
// with the sentence word by word (WordByWord). Scoring is unchanged: the
// browser transcript and word matching (wordDiff), and a tip chosen on the
// device (readingTip(); nothing is sent to an AI). Every
// try is saved as before; "Next sentence" after a miss saves nothing more.
// `onClose` adds the run's top bar; `embedded` = inside another page's
// padding (Interview Day).
export default function ReadingPracticeCard({ sentence, onComplete, onNext, testMode = false, index = 0, total = 0, onClose = null, embedded = false }) {
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
            try { recognitionRef.current.stop(); } catch (e) {}
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
      if (!testMode) onComplete(false, 0);
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

  // Test mode: a try where speech was heard is final.
  const tried = testMode && !!analysis && analysis.transcription !== '(no speech detected)';

  const passed = analysis && analysis.overall_score >= 70;
  const heard = analysis && analysis.transcription !== '(no speech detected)';
  const label = testMode ? 'Reading test' : 'Reading · Read it aloud';

  return (
    <div className={embedded ? 'w-full max-w-2xl mx-auto' : ''}>
      {/* NAVY TOP: the sentence */}
      <NavyTop className={`pb-12 ${embedded ? 'rounded-card' : ''}`}>
        <div className="mx-auto max-w-2xl space-y-4">
          {onClose && <RunTopBar onClose={onClose} index={index} total={total} answered={!!analysis && (passed || tried)} />}
          <p className="text-label text-on-navy">{label}</p>
          <h2 className="font-display text-[2.375rem] sm:text-[2.5rem] leading-[1.1]">{sentence.text}</h2>
          <Chip onNavy onClick={() => speakText(sentence.text, 'en')}>
            <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> Hear it
          </Chip>
        </div>
      </NavyTop>

      {/* CREAM SHEET: say it, then the result */}
      <CreamSheet className={embedded ? 'rounded-b-card' : 'min-h-[50vh]'}>
        <div className="mx-auto max-w-2xl space-y-5 pb-6">
          {status === 'unsupported' ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-lg font-semibold"><AlertCircle className="w-5 h-5 text-not-yet" aria-hidden="true" /> Your browser can&apos;t listen</p>
              <p className="text-base text-muted">Your browser doesn&apos;t support speech recognition. Please use Chrome, Edge, or Safari.</p>
              <Button variant="next" className="w-full" onClick={() => { if (testMode) onComplete(false, 0); onNext(); }}>Skip</Button>
            </div>
          ) : status === 'manual' ? (
            <div className="space-y-3" aria-live="polite">
              <p className="text-xl font-semibold">Listen, then read it once more.</p>
              <Button variant="second" onClick={() => speakText(sentence.text, 'en')}>
                <Volume2 className="w-5 h-5" aria-hidden="true" /> Play again
              </Button>
              <p className="text-lg font-semibold">Were you able to read it correctly?</p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="next" className="min-h-[52px]" onClick={() => onComplete(true)}><Check className="w-5 h-5" aria-hidden="true" /> Yes, I got it</Button>
                <Button variant="second" className="min-h-[52px]" onClick={() => setStatus('retry')}>No, try again</Button>
              </div>
            </div>
          ) : (!analysis || isListening || isAnalyzing) ? (
            <>
              <p className="text-base font-semibold">Read the sentence out loud, in English</p>
              {(isListening || spokenText) && (
                <div aria-live="polite" className="rounded-card bg-white border border-line p-4">
                  <p className="text-label text-muted">{isListening ? 'Listening… tap Stop when you finish' : 'You said'}</p>
                  <p className="mt-1 text-xl leading-snug min-h-[1.5em]">{spokenText ? `“${spokenText}”` : ''}</p>
                </div>
              )}
              {isAnalyzing ? (
                <p className="flex items-center gap-2 text-lg font-semibold" aria-live="polite"><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Checking your reading…</p>
              ) : typing && !isListening ? (
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(e) => { e.preventDefault(); if (!typed.trim()) return; spokenTextRef.current = typed.trim(); setSpokenText(typed.trim()); setTyping(false); analyzeReading(); }}
                >
                  <label htmlFor="reading-typed" className="text-base font-semibold">Type the sentence in English</label>
                  <input id="reading-typed" lang="en" dir="ltr" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} className="min-h-[52px] rounded-2xl border border-line bg-white px-4 text-lg text-navy focus:outline-none focus:ring-2 focus:ring-denim" />
                  <Button variant="main" type="submit" className="w-full" disabled={!typed.trim()}>Check</Button>
                </form>
              ) : (
                <>
                  <Button variant="main" className="w-full min-h-[60px]" onClick={toggleListening}>
                    {isListening ? <><MicOff className="w-6 h-6" aria-hidden="true" /> Stop</> : <><Mic className="w-6 h-6" aria-hidden="true" /> Say it</>}
                  </Button>
                  {!isListening && (
                    <button type="button" onClick={() => { setTyped(''); setTyping(true); }} className="self-center min-h-tap px-2 text-small font-semibold text-denim underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim rounded">
                      Type instead
                    </button>
                  )}
                </>
              )}
            </>
          ) : (
            <AnswerFeedback
              status={passed ? 'correct' : 'not-correct'}
              sub={passed
                ? `${analysis.overall_score}% · ${analysis.matched_count} of ${analysis.total_words} words read right.`
                : heard
                  ? `Not yet, but you’re close. ${analysis.overall_score}% · ${analysis.matched_count} of ${analysis.total_words} words.`
                  : 'We didn’t hear you. Check your microphone and try again.'}
              youSaid={heard ? analysis.transcription : ''}
            >
              {wordResults && heard && (
                <div className="rounded-card bg-white border border-line p-4">
                  <p className="text-label text-muted mb-1">The sentence, word by word</p>
                  <WordByWord words={wordResults} />
                </div>
              )}
              {analysis.tip_parts && <ReadingTip parts={analysis.tip_parts} />}
              {passed || tried ? (
                <Button variant="next" className="w-full min-h-[52px]" onClick={onNext}>
                  Next sentence <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="next" className="min-h-[52px]" onClick={toggleListening}>
                    <RotateCcw className="w-5 h-5" aria-hidden="true" /> Try again
                  </Button>
                  {testMode ? (
                    <Button variant="second" className="min-h-[52px]" onClick={() => { onComplete(false, 0); onNext(); }}>Skip</Button>
                  ) : (
                    <Button variant="second" className="min-h-[52px]" onClick={onNext}>Next sentence</Button>
                  )}
                </div>
              )}
            </AnswerFeedback>
          )}

          {!testMode && status !== 'success' && status !== 'manual' && status !== 'unsupported' && !isListening && !isAnalyzing && !passed && (
            <Button variant="link" className="px-0" onClick={handleShowAnswer}>
              Can&apos;t get it right? Hear it and check yourself
            </Button>
          )}
          {testMode && !tried && !analysis && !isListening && !isAnalyzing && status !== 'unsupported' && (
            <Button variant="link" className="px-0" onClick={() => { onComplete(false, 0); onNext(); }}>
              Skip this sentence
            </Button>
          )}
        </div>
      </CreamSheet>
    </div>
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
      <p className="text-base leading-relaxed text-muted">
        <span className="font-semibold text-navy">{label.mine || label.en}</span> {tip.mine || tip.en}
      </p>
      {tip.mine && (
        <>
          <p className="text-small text-muted">{said.mine || said.en}</p>
          <p className="text-small text-muted leading-relaxed" lang="en" dir="ltr">{tip.en}</p>
        </>
      )}
    </div>
  );
}
