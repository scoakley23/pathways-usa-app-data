import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <p className="text-sm font-bold text-slate-700">Say it back</p>
      <p className="text-xs" style={{ color: '#4A5A78' }}>
        Pick what to practice, tap the mic, and repeat it out loud. You get a match score — nothing is saved.
      </p>
      <div className="flex flex-wrap gap-2">
        {targets.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => selectTarget(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              selectedKey === t.key
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Button
        onClick={toggle}
        className={isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-900 hover:bg-slate-800'}
      >
        {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
        {isListening ? 'Stop and check' : 'Say it back'}
      </Button>
      {isListening && (
        <p className="text-sm text-slate-500">Listening… say the words, then tap “Stop and check.”</p>
      )}
      {transcript && !isListening && (
        <p className="text-sm text-slate-600">
          You said: <span className="font-medium">{transcript}</span>
        </p>
      )}
      {result && (
        <div className="space-y-2">
          <p className="text-lg font-extrabold" style={{ color: result.accuracy >= 80 ? '#2E7D32' : '#B45309' }}>
            {result.accuracy}% match
          </p>
          <p className="leading-relaxed">
            {result.words.map((w, i) => (
              <span
                key={i}
                className={w.status === 'correct' ? 'text-green-700 font-semibold' : 'text-red-500 line-through'}
              >
                {w.word}{' '}
              </span>
            ))}
          </p>
          <p className="text-xs" style={{ color: '#4A5A78' }}>
            This score is for pronunciation practice only. It is not saved, and it is not part of your answers.
          </p>
        </div>
      )}
    </div>
  );
}