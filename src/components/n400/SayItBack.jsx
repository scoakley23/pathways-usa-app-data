import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { wordDiff } from '@/components/utils/wordDiff';
import { toast } from 'sonner';
import useN400GuideText from './useN400GuideText';

// "Say it back" practice: the learner repeats the question or a vocabulary
// word, and the browser's speech recognition scores it. The score is shown
// on screen only — it is never saved anywhere.
export default function SayItBack({ targets }) {
  const { t: tx } = useN400GuideText();
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
      toast.error(tx('no_voice'));
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
    <div className="rounded-card bg-white border-[1.5px] border-line p-4 space-y-3">
      <h2 className="text-lg font-bold text-navy" dir="auto">{tx('say_title')}</h2>
      <p className="text-base text-muted" dir="auto">{tx('say_body')}</p>
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
                : 'bg-white text-navy border-line hover:border-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={toggle}
        className={`min-h-[52px] rounded-button bg-navy text-white hover:bg-navy-deep font-bold text-base ps-2 pe-6 inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 ${
          isListening ? 'ring-4 ring-gold' : ''
        }`}
      >
        <span className="w-10 h-10 rounded-full bg-gold text-navy grid place-items-center">
          {isListening ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
        </span>
        <span dir="auto">{isListening ? tx('say_stop') : tx('say_start')}</span>
      </button>
      {isListening && (
        <p className="text-base text-muted" dir="auto">{tx('say_listening')}</p>
      )}
      {!isListening && !typing && (
        <button type="button" onClick={() => setTyping(true)} className="block min-h-tap px-1 text-small font-semibold text-denim underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim rounded">
          {tx('type_instead')}
        </button>
      )}
      {typing && !isListening && (
        <form onSubmit={checkTyped} className="flex flex-col gap-2">
          <label htmlFor="say-it-back-typed" className="text-base font-semibold text-navy" dir="auto">{tx('type_it')}</label>
          <input id="say-it-back-typed" lang="en" dir="ltr" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} className="min-h-[52px] rounded-button border border-line bg-white px-4 text-base text-navy focus:outline-none focus:ring-2 focus:ring-denim" />
          <button type="submit" disabled={!typed.trim()} className="self-start min-h-tap rounded-button bg-navy px-5 text-base font-bold text-white disabled:opacity-40">{tx('check')}</button>
        </form>
      )}
      {transcript && !isListening && (
        <p className="text-base text-muted">
          <span dir="auto">{tx('you_said')}</span> <span className="font-semibold text-navy" lang="en" dir="ltr">{transcript}</span>
        </p>
      )}
      {result && (
        <div className="space-y-2 rounded-card bg-paper border border-line p-4">
          <p
            className={`inline-flex items-center rounded-button px-3 py-1.5 text-lg font-extrabold ${
              result.accuracy >= 80 ? 'bg-correct-bg text-correct' : 'bg-not-yet-bg text-not-yet'
            }`}
          >
            {tx('match', { n: result.accuracy })}
          </p>
          <p className="text-base leading-relaxed" lang="en" dir="ltr">
            {result.words.map((w, i) => (
              <span
                key={i}
                className={w.status === 'correct' ? 'text-correct font-semibold' : 'text-not-yet line-through'}
              >
                {w.word}{' '}
              </span>
            ))}
          </p>
          <p className="text-base text-muted" dir="auto">{tx('say_note')}</p>
        </div>
      )}
    </div>
  );
}