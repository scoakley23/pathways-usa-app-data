import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { wordDiff } from '@/components/utils/wordDiff';
import { toast } from 'sonner';

// "Say it back" practice: the learner repeats the question or a vocabulary
// word, and the browser's speech recognition scores it. The score is shown
// on screen only — it is never saved anywhere.
export default function SayItBack({ targets }) {
  const [selectedKey, setSelectedKey] = useState(targets[0]?.key);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const t = Array.from(e.results).map((r) => r[0].transcript).join('');
      setTranscript(t);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    if (!isListening && transcript && !result) {
      const target = targets.find((t) => t.key === selectedKey);
      if (target) setResult(wordDiff(target.text, transcript));
    }
  }, [isListening, transcript, result, selectedKey, targets]);

  const toggle = () => {
    if (!recognitionRef.current) {
      toast.error('Voice input is not supported in this browser');
      return;
    }
    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    } else {
      setTranscript('');
      setResult(null);
      try {
        recognitionRef.current.start();
      } catch (e) {
        // ignore restart race
      }
    }
  };

  const selectTarget = (key) => {
    setSelectedKey(key);
    setTranscript('');
    setResult(null);
  };

  // "Type instead" (Prompt 13): the same match score for typed words. Kept
  // in memory only, like the spoken words.
  const checkTyped = (e) => {
    e.preventDefault();
    const target = targets.find((t) => t.key === selectedKey);
    if (!target || !typed.trim()) return;
    setTranscript(typed.trim());
    setResult(wordDiff(target.text, typed.trim()));
  };

  return (
    <div className="rounded-2xl bg-tint p-4 space-y-3">
      <p className="text-base font-extrabold text-navy">Say it back</p>
      <p className="text-sm text-muted">
        Pick what to practice, tap the mic, and repeat it out loud. You get a match score — nothing is saved.
      </p>
      <div className="flex flex-wrap gap-2">
        {targets.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => selectTarget(t.key)}
            aria-pressed={selectedKey === t.key}
            className={`min-h-[44px] px-4 py-2 rounded-button text-base font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 ${
              selectedKey === t.key
                ? 'bg-navy text-white border-navy'
                : 'bg-white text-navy border-line hover:bg-white/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={toggle}
        className={`min-h-[52px] rounded-button bg-denim text-white hover:bg-denim-deep font-bold text-base ps-2 pe-6 inline-flex items-center gap-3 transition-shadow hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 ${
          isListening ? 'ring-8 ring-navy/25' : 'ring-4 ring-navy/15'
        }`}
      >
        <span className="w-10 h-10 rounded-full bg-white/20 grid place-items-center">
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </span>
        {isListening ? 'Stop and check' : 'Say it back'}
      </button>
      {isListening && (
        <p className="text-sm text-muted">Listening… say the words, then tap “Stop and check.”</p>
      )}
      {!isListening && !typing && (
        <button type="button" onClick={() => setTyping(true)} className="block min-h-tap px-1 text-small font-semibold text-denim underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim rounded">
          Type instead
        </button>
      )}
      {typing && !isListening && (
        <form onSubmit={checkTyped} className="flex flex-col gap-2">
          <label htmlFor="say-it-back-typed" className="text-base font-semibold text-navy">Type it in English</label>
          <input id="say-it-back-typed" lang="en" dir="ltr" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} className="min-h-[52px] rounded-2xl border border-line bg-white px-4 text-base text-navy focus:outline-none focus:ring-2 focus:ring-denim" />
          <button type="submit" disabled={!typed.trim()} className="self-start min-h-tap rounded-button bg-denim px-5 text-base font-bold text-white disabled:opacity-40">Check</button>
        </form>
      )}
      {transcript && !isListening && (
        <p className="text-base text-muted">
          You said: <span className="font-semibold text-navy">{transcript}</span>
        </p>
      )}
      {result && (
        <div className="space-y-2 rounded-2xl bg-white border border-line p-4">
          <p
            className={`inline-flex items-center rounded-button px-3 py-1.5 text-lg font-extrabold ${
              result.accuracy >= 80 ? 'bg-correct-bg text-correct' : 'bg-not-yet-bg text-not-yet'
            }`}
          >
            {result.accuracy}% match
          </p>
          <p className="text-base leading-relaxed">
            {result.words.map((w, i) => (
              <span
                key={i}
                className={w.status === 'correct' ? 'text-correct font-semibold' : 'text-not-yet line-through'}
              >
                {w.word}{' '}
              </span>
            ))}
          </p>
          <p className="text-sm text-muted">
            This score is for pronunciation practice only. It is not saved, and it is not part of your answers.
          </p>
        </div>
      )}
    </div>
  );
}