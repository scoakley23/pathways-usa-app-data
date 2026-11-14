import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { PillButton, PrimaryButton, RaisedCard } from '@/components/pathways/ui';
import Officer from '@/components/interview/Officer';
import { speakText, stopSpeaking } from '@/components/utils/textToSpeech';
import { heardOathYes } from '@/lib/interviewDay';

const OATH_LINE = 'Good morning. Before we begin, please stand and raise your right hand. Do you promise to tell the truth, the whole truth, and nothing but the truth?';

// Part 1: the promise to tell the truth. Not scored. "I do" is checked on the
// device; what the learner says is not sent anywhere.
export default function OathStep({ onDone }) {
  const [officer, setOfficer] = useState('idle');
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const recognitionRef = useRef(null);
  const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

  const say = () => {
    setOfficer('speaking');
    speakText(OATH_LINE, 'en', { onStart: () => setOfficer('speaking'), onEnd: () => setOfficer('listening') });
  };

  useEffect(() => {
    say();
    return () => {
      stopSpeaking();
      try { recognitionRef.current?.stop(); } catch (e) { /* already stopped */ }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const listen = () => {
    if (listening) { recognitionRef.current?.stop(); return; }
    stopSpeaking();
    const r = new SR();
    r.lang = 'en-US';
    r.interimResults = false;
    r.onstart = () => { setListening(true); setOfficer('listening'); };
    r.onresult = (e) => {
      const text = Array.from(e.results).map((x) => x[0].transcript).join(' ');
      setHeard(text);
      if (heardOathYes(text)) onDone();
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recognitionRef.current = r;
    try { r.start(); } catch (e) { setListening(false); }
  };

  return (
    <div className="space-y-4 text-pw-navy">
      <div className="rounded-card bg-tint px-4 py-5 flex flex-col items-center text-center gap-2">
        <div className={`rounded-full ${officer === 'speaking' ? 'ring-4 ring-denim/40' : ''}`}><Officer size={112} /></div>
        <p className="text-small font-semibold text-muted">AI practice officer · not a real person</p>
      </div>

      <RaisedCard className="space-y-4">
        <p className="text-lg font-bold leading-relaxed">{OATH_LINE}</p>
        <PillButton onClick={say} disabled={officer === 'speaking'}>
          <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> Repeat
        </PillButton>
        <p className="text-base text-pw-muted">Stand up, raise your right hand, and say &ldquo;I do.&rdquo;</p>

        {SR && (
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={listen}
              aria-label={listening ? 'Stop listening' : 'Say "I do"'}
              className="relative w-20 h-20 rounded-full bg-pw-navy text-white grid place-items-center shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pw-navy/30"
            >
              {listening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <p className="text-base font-semibold text-center" aria-live="polite">
              {listening ? 'Listening…' : heard ? `I heard “${heard}”. Try again, or tap “I do”.` : 'Tap the microphone and speak'}
            </p>
          </div>
        )}

        <PrimaryButton large className="w-full" onClick={onDone}>I do</PrimaryButton>
      </RaisedCard>
    </div>
  );
}
