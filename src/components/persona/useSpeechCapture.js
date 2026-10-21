import { useCallback, useEffect, useRef, useState } from 'react';
import { stopReading } from './useAutoRead';

// English speech-to-text for practice steps. The transcript stays in memory
// only; nothing is recorded or saved. `onDone(transcript)` runs when
// listening stops.
export default function useSpeechCapture(onDone) {
  const [supported] = useState(() => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!supported) return undefined;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    r.onstart = () => setListening(true);
    r.onresult = (e) => {
      const t = Array.from(e.results).map((res) => res[0].transcript).join('');
      transcriptRef.current = t;
      setTranscript(t);
    };
    r.onerror = () => setListening(false);
    r.onend = () => {
      setListening(false);
      if (onDoneRef.current) onDoneRef.current(transcriptRef.current);
    };
    recognitionRef.current = r;
    return () => {
      r.onend = null;
      try { r.stop(); } catch (e) { /* not started */ }
    };
  }, [supported]);

  const start = useCallback(() => {
    stopReading(); // the microphone must not hear the tutor
    transcriptRef.current = '';
    setTranscript('');
    try { recognitionRef.current?.start(); } catch (e) { /* already started */ }
  }, []);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch (e) { /* not started */ }
  }, []);

  const reset = useCallback(() => {
    transcriptRef.current = '';
    setTranscript('');
  }, []);

  return { supported, listening, transcript, start, stop, reset };
}
