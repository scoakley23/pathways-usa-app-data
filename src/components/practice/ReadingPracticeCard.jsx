import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Check, ArrowRight, AlertCircle, Loader2, Activity, RotateCcw } from 'lucide-react';
import { Eyebrow, PillButton, PrimaryButton, QuietButton, RaisedCard, SecondaryButton } from '@/components/pathways/ui';
import { base44 } from '@/api/base44Client';
import { speakText } from "@/components/utils/textToSpeech";
import { wordDiff } from "@/components/utils/wordDiff";

// `testMode` (Interview Day): like the real test, one try per sentence and no
// "Show Answer". A try with no speech heard doesn't count; the learner can
// try again. Without it nothing changes.
export default function ReadingPracticeCard({ sentence, onComplete, onNext, testMode = false }) {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [status, setStatus] = useState('idle'); // idle, listening, processing, success, retry, manual, unsupported
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [wordResults, setWordResults] = useState(null);

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

  const generateFallbackFeedback = (diff) => {
    const missing = diff.words.filter(w => w.status === 'missing').map(w => w.word);
    if (missing.length === 0) {
      return "All words detected! Focus on speaking with natural rhythm and clear pronunciation.";
    }
    if (missing.length === diff.totalWords) {
      return "None of the words matched. Try reading the sentence slowly, one word at a time.";
    }
    return `You missed: "${missing.join('", "')}". Read more slowly and enunciate each word clearly.`;
  };

  // Scores come only from the browser's live transcript and word matching.
  // No audio is recorded or uploaded; only the target sentence and the
  // transcript text go to the AI, for a short tip.
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
        phoneme_feedback: "We couldn't detect any speech. Make sure your microphone is working and speak clearly into it.",
        general_feedback: 'No speech detected'
      });
      setStatus('retry');
      if (!testMode) onComplete(false, 0);
      return;
    }

    // ── 3. Score = word accuracy ──
    const overall = wordAccuracy;

    // ── 4. Optional AI tip from text only (never changes the score) ──
    setIsAnalyzing(true);
    let tip = null;
    if (diff.matchedCount < diff.totalWords) {
      try {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `An English learner preparing for the USCIS reading test read this sentence aloud.

TARGET SENTENCE: "${sentence.text}"
WHAT SPEECH RECOGNITION HEARD: "${transcript}"

In one or two short, encouraging sentences at an A2 English level, give one practical tip for the words they missed or said differently. Do not give a score.`,
          response_json_schema: {
            type: "object",
            properties: { tip: { type: "string" } },
            required: ["tip"]
          }
        });
        tip = res?.tip || null;
      } catch (error) {
        console.error("AI tip failed, using word-match feedback", error);
      }
    }
    setIsAnalyzing(false);

    const result = {
      transcription: transcript,
      overall_score: overall,
      matched_count: diff.matchedCount,
      total_words: diff.totalWords,
      phoneme_feedback: tip || generateFallbackFeedback(diff),
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

  if (status === 'unsupported') {
    return (
      <RaisedCard className="text-center text-pw-navy">
        <AlertCircle className="w-12 h-12 text-pw-red-ink mx-auto mb-4" aria-hidden="true" />
        <h3 className="text-xl font-extrabold">Browser Not Supported</h3>
        <p className="text-pw-muted mt-1">Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.</p>
        <PrimaryButton onClick={() => { if (testMode) onComplete(false, 0); onNext(); }} className="mt-5 w-full">Skip</PrimaryButton>
      </RaisedCard>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 text-pw-navy">
      <RaisedCard>
        <Eyebrow className="mb-2">Reading Practice</Eyebrow>

        {/* Sentence display — with word-by-word highlighting when results available */}
        {wordResults ? (
          <p className="flex flex-wrap gap-1.5 mb-3">
            {wordResults.map((w, i) => (
              <span key={i} className={`rounded-lg px-2 py-0.5 text-[1.375rem] font-extrabold leading-snug transition-colors ${
                w.status === 'correct'
                  ? 'bg-pw-green-soft text-pw-green-ink'
                  : 'bg-pw-red-soft text-pw-red-ink line-through'
              }`}>
                {w.word}
              </span>
            ))}
          </p>
        ) : (
          <h2 className="text-[1.375rem] md:text-3xl font-extrabold leading-snug mb-3">
            {sentence.text}
          </h2>
        )}
        <PillButton onClick={() => speakText(sentence.text, 'en')}>
          <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> Listen
        </PillButton>

        {/* Controls */}
        {(!analysis || (analysis.overall_score < 70 && !tried)) && status !== 'manual' && (
          <div className="flex flex-col items-center mt-6">
            <div className="relative">
              <span className={`absolute inset-0 rounded-full bg-pw-red/20 transition-transform ${isListening ? 'scale-150 animate-pulse' : 'scale-125'}`} aria-hidden="true" />
              <button
                type="button"
                onClick={toggleListening}
                disabled={isAnalyzing}
                aria-label={isListening ? 'Stop' : analysis ? 'Try again' : 'Start reading'}
                className="relative w-20 h-20 rounded-full bg-pw-red text-white grid place-items-center shadow-lift disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pw-navy/30"
              >
                {isListening ? <MicOff className="w-8 h-8" /> : analysis ? <RotateCcw className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>
            </div>
          </div>
        )}

        {/* Status line */}
        <div className="mt-4 flex flex-col items-center text-center" aria-live="polite">
          {isListening ? (
            <p className="inline-flex items-center gap-2 text-base font-semibold text-pw-red-ink">
              <span className="w-2 h-2 bg-pw-red rounded-full animate-pulse" aria-hidden="true" />
              Listening & Recording...
            </p>
          ) : isAnalyzing ? (
            <div className="flex flex-col items-center gap-2 text-pw-muted">
              <Loader2 className="w-6 h-6 animate-spin text-pw-navy" aria-hidden="true" />
              <p className="text-base font-semibold">Checking your reading...</p>
            </div>
          ) : !analysis && status !== 'manual' && spokenText ? (
            <div>
              <p className="text-base italic text-pw-muted">“{spokenText}”</p>
              <p className="text-sm text-pw-muted mt-1">Waiting for analysis...</p>
            </div>
          ) : !analysis && status !== 'manual' ? (
            <p className="text-base font-semibold">Tap microphone to start reading</p>
          ) : null}
          {analysis && analysis.overall_score < 70 && !isListening && !isAnalyzing && !tried && (
            <p className="text-base font-semibold">Tap the retry button to try again</p>
          )}
        </div>
      </RaisedCard>

      {/* Feedback Area */}
      {!isListening && !isAnalyzing && status === 'manual' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="rounded-3xl bg-pw-blue-soft p-5">
            <p className="text-lg font-bold mb-3">Listen to the correct pronunciation</p>
            <PillButton onClick={() => speakText(sentence.text, 'en')} className="bg-white hover:bg-white/80">
              <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> Play Audio
            </PillButton>
          </div>
          <RaisedCard>
            <p className="font-bold mb-4">Were you able to read it correctly?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <SecondaryButton onClick={() => setStatus('retry')} className="border-pw-line">
                No, Try Again
              </SecondaryButton>
              <PrimaryButton onClick={() => onComplete(true)}>
                <Check className="w-5 h-5" aria-hidden="true" /> Yes, I Got It
              </PrimaryButton>
            </div>
          </RaisedCard>
        </div>
      )}

      {!isListening && !isAnalyzing && status !== 'manual' && analysis && (
        <div className={`rounded-3xl p-5 animate-in fade-in slide-in-from-bottom-2 ${analysis.overall_score >= 70 ? 'bg-pw-green-soft' : 'bg-white border border-pw-line shadow-raised'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 shrink-0 rounded-full grid place-items-center ${analysis.overall_score >= 70 ? 'bg-white text-pw-green-ink' : 'bg-pw-red-soft text-pw-red-ink'}`}>
              {analysis.overall_score >= 70 ? <Check className="w-6 h-6" aria-hidden="true" /> : <Activity className="w-6 h-6" aria-hidden="true" />}
            </div>
            <div>
              <p className="text-2xl font-extrabold leading-none">{analysis.overall_score}%</p>
              <p className="text-sm text-pw-muted mt-1">Overall Score</p>
            </div>
          </div>
          <p className="font-bold">{analysis.general_feedback}</p>

          <p className="text-base text-pw-muted mt-2">
            Words read correctly: <span className="font-bold text-pw-navy">{analysis.matched_count} of {analysis.total_words}</span>
          </p>

          {analysis.transcription && analysis.transcription !== '(no speech detected)' && (
            <div className="mt-4">
              <Eyebrow className="mb-1">You said:</Eyebrow>
              <p className="italic text-pw-muted">“{analysis.transcription}”</p>
            </div>
          )}

          {analysis.phoneme_feedback && (
            <div className={`mt-4 rounded-2xl p-4 ${analysis.overall_score >= 70 ? 'bg-white' : 'bg-pw-soft'}`}>
              <Eyebrow className="mb-1">Tip:</Eyebrow>
              <p className="leading-relaxed">{analysis.phoneme_feedback}</p>
            </div>
          )}
        </div>
      )}

      {analysis && (analysis.overall_score >= 70 || tried) && status !== 'manual' && !isListening && !isAnalyzing && (
        <PrimaryButton large onClick={onNext} className="w-full">
          Next Sentence <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </PrimaryButton>
      )}

      {/* Show Answer / Skip Button */}
      {status !== 'success' && status !== 'manual' && !isListening && !isAnalyzing && !testMode && (
        <QuietButton onClick={handleShowAnswer} className="w-full text-pw-muted">
          Can't get it right? Show Answer / Skip
        </QuietButton>
      )}
      {testMode && !tried && !isListening && !isAnalyzing && (
        <QuietButton onClick={() => { onComplete(false, 0); onNext(); }} className="w-full text-pw-muted">
          Skip this sentence
        </QuietButton>
      )}
    </div>
  );
}
