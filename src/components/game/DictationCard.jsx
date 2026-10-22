import React, { useState, useEffect } from 'react';
import { Volume2, Check, X, ArrowRight, Edit3, Globe, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { speakText } from "@/components/utils/textToSpeech";
import { Poster, posterOutline, posterSolid, posterTone } from '@/components/pathways/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { checkDictation } from '@/lib/practiceChecks';

// `testMode` (Interview Day): like the real test, the learner types what they
// hear and it is checked once; no translation and no "Reveal Answer".
// Without it nothing changes.
// Shown as a red/blue poster (Phase 5): `index`/`total` give the card's place
// in the run. After checking, the sentence is the poster's answer line and
// the word-by-word check (checkDictation) shows which words were missed.
export default function DictationCard({ sentence, onComplete, onNext, testMode = false, index = 0, total = 0 }) {
  const [stage, setStage] = useState('listen'); // listen, check, result
  const [userInput, setUserInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedback, setFeedback] = useState(null); // correct, incorrect
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const SUPPORTED_LANGUAGES = [
    { code: 'es', name: 'Spanish' },
    { code: 'ar', name: 'Arabic' },
    { code: 'am', name: 'Amharic' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'fr', name: 'French' }
  ];

  // Reset state when sentence changes
  useEffect(() => {
    setStage('listen');
    setUserInput('');
    setFeedback(null);
    setIsPlaying(false);
    setTranslation('');
    // Keep selected language
  }, [sentence]);

  // Fetch translation when entering result stage if language is selected
  useEffect(() => {
    if (stage === 'result' && selectedLanguage && !translation) {
      fetchTranslation();
    }
  }, [stage, selectedLanguage]);

  const fetchTranslation = async () => {
    if (!sentence || !selectedLanguage) return;
    
    setIsTranslating(true);
    try {
      const langName = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name;
      const prompt = `Translate the following text (which could be a word or a sentence) into ${langName}: "${sentence.text}". Return ONLY the translated text, nothing else.`;
      
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: prompt
      });
      
      setTranslation(res);
    } catch (error) {
      console.error("Translation error", error);
      setTranslation("Translation unavailable");
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
    const { isCorrect } = checkDictation(sentence.text, userInput);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setStage('result');
    
    if (isCorrect) {
      // Success animation handled by UI
      onComplete(true);
    } else {
      onComplete(false);
    }
  };

  const handleStageTransition = () => {
    if (stage === 'listen') {
      setStage('check');
    }
  };

  const words = stage === 'result' && feedback === 'incorrect' ? checkDictation(sentence.text, userInput).words : null;
  const label = `${testMode ? 'Writing test' : 'Listen and write'} · ${total ? `Card ${index + 1} of ${total}` : 'Write what you hear'}`;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 text-pw-navy">
      {!testMode && <div className="flex justify-end">
        <div className="flex items-center gap-1 bg-white pl-3 rounded-xl border border-pw-line">
          <Globe className="w-4 h-4 text-pw-muted" aria-hidden="true" />
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger aria-label="Translate to" className="w-[150px] min-h-[44px] text-sm border-0 bg-transparent shadow-none focus:ring-0">
              <SelectValue placeholder="Translate to..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Translation</SelectItem>
              {SUPPORTED_LANGUAGES.map(lang => (
                <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>}

      <Poster
        tone={posterTone(index)}
        className="-mx-4 sm:mx-0 sm:rounded-[14px]"
        label={label}
        progress={total ? { index, total } : null}
        question={stage === 'result' ? null : (testMode ? 'Listen, then type what you hear.' : 'Listen, then write what you hear.')}
        answer={stage === 'result' ? `Answer: ${sentence.text}` : null}
      >
        <div className="space-y-4">
          {/* Play the sentence */}
          <div className="flex items-center gap-4">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={speak}
              aria-label="Play the sentence"
              className={`w-16 h-16 shrink-0 rounded-full grid place-items-center shadow-lift transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 bg-white text-pw-navy ${isPlaying ? 'ring-4 ring-white/40' : 'hover:bg-pw-soft'}`}
            >
              <Volume2 className={`w-7 h-7 ${isPlaying ? 'animate-pulse' : ''}`} aria-hidden="true" />
            </motion.button>
            <p className="text-base">{stage === 'result' ? 'Play it again' : testMode ? 'Tap to listen' : 'Tap to listen. Write it on paper, or type it below.'}</p>
          </div>

          {stage === 'listen' && (
            <button type="button" onClick={() => setStage('check')} className={posterSolid}>
              {testMode ? 'I\'m ready to write' : 'I wrote it down'} <Edit3 className="w-5 h-5" aria-hidden="true" />
            </button>
          )}

          {stage === 'check' && (
            <div className="space-y-3">
              <label htmlFor="dictation-input" className="block text-base font-semibold">{testMode ? 'Type the sentence' : 'Type it here to check it'}</label>
              <input
                id="dictation-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the sentence here..."
                className="w-full min-h-[52px] rounded-[10px] bg-white px-4 text-lg text-pw-navy placeholder:text-pw-muted focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                onKeyDown={(e) => e.key === 'Enter' && (!testMode || userInput.trim()) && checkAnswer()}
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={checkAnswer} disabled={!userInput.trim()} className={posterSolid}>Check</button>
                {!testMode && (
                  <button type="button" onClick={() => { setFeedback('manual'); setStage('result'); }} className={posterOutline}>
                    Show the sentence
                  </button>
                )}
              </div>
            </div>
          )}

          {stage === 'result' && (
            <div className="space-y-3" aria-live="polite">
              {feedback === 'correct' && <p className="text-2xl font-bold flex items-center gap-2"><Check className="w-6 h-6" aria-hidden="true" /> Right. Every word matches.</p>}
              {feedback === 'incorrect' && (
                <>
                  <p className="text-2xl font-bold">Not yet. Check these words:</p>
                  <p className="flex flex-wrap gap-1.5">
                    {words.map((w, i) => (
                      <span key={i} className={`rounded-lg px-2 py-0.5 text-xl font-bold ${w.status === 'correct' ? 'bg-white text-pw-navy' : 'border-2 border-white line-through'}`}>
                        {w.word}
                        {w.status !== 'correct' && <span className="sr-only"> (missed)</span>}
                      </span>
                    ))}
                  </p>
                  <p className="text-base">You wrote: <span className="italic">“{userInput}”</span></p>
                </>
              )}

              {selectedLanguage && selectedLanguage !== 'none' && (
                isTranslating ? (
                  <p className="flex items-center gap-2 text-base"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Translating…</p>
                ) : (
                  <p className="rounded-[10px] bg-white/10 border border-white/60 px-4 py-3 text-base">
                    <span className="mr-2 text-sm font-semibold uppercase tracking-[0.14em]">{SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}:</span>
                    {translation}
                  </p>
                )
              )}

              {feedback === 'manual' ? (
                <>
                  <p className="text-lg font-semibold">Did you write it correctly?</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => onComplete(true)} className={posterSolid}><Check className="w-5 h-5" aria-hidden="true" /> Yes, it matches</button>
                    <button type="button" onClick={() => onComplete(false)} className={posterOutline}><X className="w-5 h-5" aria-hidden="true" /> No, I made a mistake</button>
                  </div>
                </>
              ) : (
                <button type="button" onClick={onNext} className={posterSolid}>
                  Next sentence <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      </Poster>
    </div>
  );
}
