import React, { useState, useEffect } from 'react';
import { Volume2, Check, X, ArrowRight, Edit3, Globe, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { speakText } from "@/components/utils/textToSpeech";
import { Poster, RuledPaper, posterBigButton, posterOutline, posterSolid, posterTone, posterTool } from '@/components/pathways/ui';
import { wordScore } from '@/lib/practiceResults';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { checkDictation } from '@/lib/practiceChecks';

// `testMode` (Interview Day): like the real test, the learner types what they
// hear and it is checked once; no translation and no "Reveal Answer".
// Without it nothing changes.
// Shown as a red/blue poster (Phase 5): `index`/`total` give the card's place
// in the run. After checking, the sentence is the poster's answer line and
// the word-by-word check (checkDictation) shows which words were missed.
export default function DictationCard({ sentence, onComplete, onNext, testMode = false, index = 0, total = 0, results = [] }) {
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
    const { isCorrect, words: checked } = checkDictation(sentence.text, userInput);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setStage('result');
    // The word score lets a near miss show as "almost" (yellow star).
    onComplete(isCorrect, isCorrect ? 100 : wordScore(checked));
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
      <Poster
        tone={posterTone(index)}
        className="-mx-4 sm:mx-0 sm:rounded-[14px]"
        label={label}
        progress={total ? { index, total, results } : null}
        question={stage === 'result' ? null : (testMode ? 'Listen, then type what you hear.' : 'Listen, then write what you hear.')}
        answer={stage === 'result' ? `Answer: ${sentence.text}` : null}
      >
        <div className="space-y-4">
          {/* Play the sentence: the one big button before writing; after
              that a small "Play again" next to Translate (practice only). */}
          {stage === 'listen' ? (
            <div className="flex flex-col items-center pt-2 gap-4">
              <div className="relative">
                <span className={`absolute inset-0 rounded-full bg-white/20 transition-transform ${isPlaying ? 'scale-[1.35] animate-pulse' : 'scale-[1.2]'}`} aria-hidden="true" />
                <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={speak} aria-label="Play the sentence" className={posterBigButton}>
                  <Volume2 className="w-10 h-10" aria-hidden="true" />
                </motion.button>
              </div>
              <p className="text-lg font-semibold text-center">{testMode ? 'Tap to listen' : 'Tap to listen. Write it on paper, or type it next.'}</p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={speak} className={`${posterTool} ${isPlaying ? 'bg-white/15' : ''}`}>
                <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> Play again
              </button>
              {!testMode && (
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger aria-label="Translate to" className={`${posterTool} w-auto h-auto bg-transparent shadow-none focus:ring-white focus:ring-offset-0 [&>svg]:text-white [&>svg]:opacity-100 data-[placeholder]:text-white [&>span]:text-white`}>
                    <Globe className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <SelectValue placeholder="Translate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No translation</SelectItem>
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {stage === 'listen' && (
            <button type="button" onClick={() => setStage('check')} className={posterSolid}>
              {testMode ? 'I\'m ready to write' : 'I wrote it down'} <Edit3 className="w-5 h-5" aria-hidden="true" />
            </button>
          )}

          {stage === 'check' && (
            <div className="flex flex-wrap gap-2">
              {userInput.trim() && <button type="button" onClick={checkAnswer} className={posterSolid}><Check className="w-5 h-5" aria-hidden="true" /> Check my sentence</button>}
              {!testMode && (
                <button type="button" onClick={() => { setFeedback('manual'); setStage('result'); }} className={posterOutline}>
                  Show the sentence
                </button>
              )}
            </div>
          )}

          {stage === 'result' && (
            <div className="space-y-3" aria-live="polite">
              {feedback === 'correct' && <p className="text-2xl font-bold flex items-center gap-2"><Check className="w-6 h-6" aria-hidden="true" /> Right. Every word matches.</p>}
              {feedback === 'incorrect' && (
                <>
                  <p className="text-2xl font-bold">Not yet. Check the marked words on your page.</p>
                </>
              )}

              {selectedLanguage && selectedLanguage !== 'none' && (
                isTranslating ? (
                  <p className="flex items-center gap-2 text-base"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Translating…</p>
                ) : (
                  <p className="border-s-2 border-white/70 ps-4 text-base">
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

      {/* The learner's own page: they type on ruled paper; after the check,
          the words they missed are marked here. */}
      {(stage === 'check' || (stage === 'result' && feedback !== 'manual')) && (
        <RuledPaper className="sm:mx-0 -mx-1">
          {stage === 'check' ? (
            <>
              <label htmlFor="dictation-input" className="block text-[13px] font-semibold uppercase tracking-[0.14em] leading-[36px] text-pw-muted">
                {testMode ? 'Type the sentence' : 'Your sentence'}
              </label>
              <textarea
                id="dictation-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type the sentence here…"
                rows={2}
                className="block w-full resize-none bg-transparent text-[22px] leading-[36px] text-pw-navy placeholder:text-pw-muted focus:outline-none"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (userInput.trim()) checkAnswer(); } }}
                autoFocus
              />
            </>
          ) : (
            <>
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] leading-[36px] text-pw-muted">You wrote</p>
              <p className="text-[22px] leading-[36px]">{userInput}</p>
              {words && (
                <>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.14em] leading-[36px] text-pw-muted">The sentence, word by word</p>
                  <p className="text-[22px] leading-[36px]">
                    {words.map((w, i) => (
                      <React.Fragment key={i}>
                        {w.status === 'correct'
                          ? <span>{w.word}</span>
                          : <mark className="rounded bg-pw-highlight px-1 font-semibold text-pw-navy underline decoration-pw-red-ink decoration-2 underline-offset-4">{w.word}<span className="sr-only"> (missed)</span></mark>}
                        {' '}
                      </React.Fragment>
                    ))}
                  </p>
                </>
              )}
            </>
          )}
        </RuledPaper>
      )}
    </div>
  );
}
