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

  return (
    <div className="rounded-2xl bg-pw-soft p-4 space-y-3">
      <p className="text-base font-extrabold text-pw-navy">Say it back</p>
      <p className="text-sm text-pw-muted">
        Pick what to practice, tap the mic, and repeat it out loud. You get a match score — nothing is saved.
      </p>
      <div className="flex flex-wrap gap-2">
        {targets.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => selectTarget(t.key)}
            aria-pressed={selectedKey === t.key}
            className={`min-h-[44px] px-4 py-2 rounded-full text-base font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2 ${
              selectedKey === t.key
                ? 'bg-pw-navy text-white border-pw-navy'
                : 'bg-white text-pw-navy border-pw-line hover:bg-white/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={toggle}
        className={`min-h-[52px] rounded-full bg-pw-red text-white font-bold text-base pl-2 pr-6 inline-flex items-center gap-3 transition-shadow hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2 ${
          isListening ? 'ring-8 ring-pw-red/25' : 'ring-4 ring-pw-red/15'
        }`}
      >
        <span className="w-10 h-10 rounded-full bg-white/20 grid place-items-center">
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </span>
        {isListening ? 'Stop and check' : 'Say it back'}
      </button>
      {isListening && (
        <p className="text-sm text-pw-muted">Listening… say the words, then tap “Stop and check.”</p>
      )}
      {transcript && !isListening && (
        <p className="text-base text-pw-muted">
          You said: <span className="font-semibold text-pw-navy">{transcript}</span>
        </p>
      )}
      {result && (
        <div className="space-y-2 rounded-2xl bg-white border border-pw-line p-4">
          <p
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-lg font-extrabold ${
              result.accuracy >= 80 ? 'bg-pw-green-soft text-pw-green-ink' : 'bg-pw-red-soft text-pw-red-ink'
            }`}
          >
            {result.accuracy}% match
          </p>
          <p className="text-base leading-relaxed">
            {result.words.map((w, i) => (
              <span
                key={i}
                className={w.status === 'correct' ? 'text-pw-green-ink font-semibold' : 'text-pw-red-ink line-through'}
              >
                {w.word}{' '}
              </span>
            ))}
          </p>
          <p className="text-sm text-pw-muted">
            This score is for pronunciation practice only. It is not saved, and it is not part of your answers.
          </p>
        </div>
      )}
    </div>
  );
}