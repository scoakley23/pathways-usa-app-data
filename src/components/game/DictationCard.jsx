import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Check, X, ArrowRight, Edit3, Globe, Loader2 } from 'lucide-react';
import { speakText } from "@/components/utils/textToSpeech";
import { Eyebrow, PrimaryButton, RaisedCard, SecondaryButton } from '@/components/pathways/ui';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { checkDictation } from '@/lib/practiceChecks';

export default function DictationCard({ sentence, onComplete, onNext }) {
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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 text-pw-navy">
      <div className="flex justify-end">
        <div className="flex items-center gap-1 bg-white pl-3 rounded-2xl border border-pw-line">
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
      </div>

      <RaisedCard>
        {/* Step Indicator */}
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold uppercase tracking-widest text-pw-muted mb-5">
          <li className={stage === 'listen' ? 'text-pw-navy' : ''} aria-current={stage === 'listen' ? 'step' : undefined}>1. Listen</li>
          <li aria-hidden="true" className="text-pw-line">→</li>
          <li className={stage === 'check' ? 'text-pw-navy' : ''} aria-current={stage === 'check' ? 'step' : undefined}>2. Write</li>
          <li aria-hidden="true" className="text-pw-line">→</li>
          <li className={stage === 'result' ? 'text-pw-navy' : ''} aria-current={stage === 'result' ? 'step' : undefined}>3. Check</li>
        </ol>

        {/* Audio Section */}
        <div className="flex items-center gap-4">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={speak}
            aria-label="Play the sentence"
            className={`w-16 h-16 shrink-0 rounded-full grid place-items-center shadow-lift transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pw-red/40
              ${isPlaying ? 'bg-pw-soft text-pw-navy ring-4 ring-pw-navy/20' : 'bg-pw-navy text-white hover:bg-pw-navy-deep'}`}
          >
            <Volume2 className={`w-7 h-7 ${isPlaying ? 'animate-pulse' : ''}`} aria-hidden="true" />
          </motion.button>
          <div className="min-w-0">
            <p className="font-bold">Click to listen</p>
            <p className="text-sm text-pw-muted">Write what you hear on your paper</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {stage === 'listen' && (
            <motion.div
              key="listen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full mt-6"
            >
              <PrimaryButton large onClick={() => setStage('check')} className="w-full">
                I wrote it down <Edit3 className="w-5 h-5" aria-hidden="true" />
              </PrimaryButton>
            </motion.div>
          )}

          {stage === 'check' && (
            <motion.div
              key="check"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-3 mt-6"
            >
              <label htmlFor="dictation-input" className="block text-sm font-semibold text-pw-muted">Optional: Type here to auto-check</label>
              <Input
                id="dictation-input"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type sentence here..."
                className="text-base min-h-[48px]"
                onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                autoFocus
              />
              <PrimaryButton
                large
                onClick={checkAnswer}
                className="w-full"
                disabled={!userInput.trim()}
              >
                Check My Answer
              </PrimaryButton>
              <SecondaryButton
                onClick={() => { setFeedback('manual'); setStage('result'); }}
                className="w-full border-pw-line"
              >
                Just Reveal Answer
              </SecondaryButton>
            </motion.div>
          )}
        </AnimatePresence>
      </RaisedCard>

      {stage === 'result' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full space-y-4"
        >
          <div className={`rounded-3xl p-5 ${feedback === 'correct' ? 'bg-pw-green-soft' : feedback === 'incorrect' ? 'bg-pw-red-soft' : 'bg-white border border-pw-line shadow-raised'}`}>
            {feedback === 'correct' && (
              <div className="flex items-center gap-3 mb-4 text-pw-green-ink animate-in fade-in">
                <span className="w-10 h-10 bg-white rounded-full grid place-items-center shrink-0">
                  <Check className="w-6 h-6" aria-hidden="true" />
                </span>
                <p className="text-xl font-extrabold">Excellent work!</p>
              </div>
            )}

            {feedback === 'incorrect' && (
              <div className="mb-4 animate-in fade-in">
                <div className="flex items-center gap-3 text-pw-red-ink">
                  <span className="w-10 h-10 bg-white rounded-full grid place-items-center shrink-0">
                    <X className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <p className="text-xl font-extrabold">Keep practicing!</p>
                </div>
                <div className="mt-3">
                  <p className="text-sm text-pw-muted">You wrote:</p>
                  <p className="italic line-through text-pw-navy/75">{userInput}</p>
                </div>
              </div>
            )}

            <div className={feedback === 'manual' ? '' : 'bg-white rounded-2xl p-4'}>
              <Eyebrow className="mb-2">Correct Sentence</Eyebrow>
              <h3 className="text-[1.375rem] md:text-3xl font-extrabold leading-snug">
                {sentence.text}
              </h3>

              {selectedLanguage && selectedLanguage !== 'none' && (
                <div className="mt-3">
                  {isTranslating ? (
                    <div className="flex items-center gap-2 text-pw-muted text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Translating...
                    </div>
                  ) : (
                    <div className="text-base font-semibold text-pw-blue-ink bg-pw-blue-soft px-4 py-3 rounded-2xl animate-in fade-in">
                      <span className="mr-2 text-xs font-bold uppercase tracking-widest opacity-80">{SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}:</span>
                      {translation}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {feedback === 'manual' && (
            <RaisedCard className="animate-in fade-in slide-in-from-bottom-4">
              <p className="text-lg font-bold mb-3">Did you write it correctly?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <SecondaryButton onClick={() => onComplete(false)} className="border-pw-line">
                  <X className="w-4 h-4" aria-hidden="true" /> No, I made a mistake
                </SecondaryButton>
                <PrimaryButton onClick={() => {
                  onComplete(true);
                }}>
                  <Check className="w-4 h-4" aria-hidden="true" /> Yes, it matches
                </PrimaryButton>
              </div>
            </RaisedCard>
          )}

          {(feedback === 'correct' || feedback === 'incorrect') && (
            <PrimaryButton large onClick={onNext} className="w-full">
              Next Sentence <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </PrimaryButton>
          )}
        </motion.div>
      )}
    </div>
  );
}
