import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Eye, ArrowRight, Globe, Loader2, CheckCircle, AlertCircle, Keyboard, MicOff, ChevronRight, Mic } from 'lucide-react';
import { speakText } from "@/components/utils/textToSpeech";
import AIExplanation from '@/components/ai/AIExplanation';
import { Eyebrow, PillButton, PrimaryButton, QuietButton, RaisedCard, SecondaryButton, Tag } from '@/components/pathways/ui';
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { checkCivicsAnswer } from '@/components/civics/checkCivicsAnswer';

import { getPersonalizedAnswer } from '@/components/civics/RepresentativeFinder';
import { LANGUAGES } from '@/hooks/useLessonTranslation';

export default function CivicsTestCard({ question, onComplete, onNext, representativeData }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [selfCheckMode, setSelfCheckMode] = useState(false);
  const [inputMode, setInputMode] = useState('speak');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  // Refs don't trigger re-renders, so track recognizer readiness in state for the mic button
  const [srReady, setSrReady] = useState(false);

  const SUPPORTED_LANGUAGES = LANGUAGES.filter(l => l.value !== 'en');

  // Reset state when question changes
  useEffect(() => {
    setIsRevealed(false);
    setIsPlaying(false);
    setTranslation('');
    setUserAnswer('');
    setVerifying(false);
    setVerificationResult(null);
    setSelfCheckMode(false);
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    // Keep selected language
  }, [question]);

  // Fetch translation when language is selected or question changes
  useEffect(() => {
    if (selectedLanguage && selectedLanguage !== 'none' && !translation) {
      fetchTranslation();
    }
  }, [selectedLanguage, question]);

  const fetchTranslation = async () => {
    if (!question || !selectedLanguage || selectedLanguage === 'none') return;
    
    setIsTranslating(true);
    try {
      const langName = SUPPORTED_LANGUAGES.find(l => l.value === selectedLanguage)?.label;
      const prompt = `Translate the following Civics Question and Answer into ${langName}.
      
      Question: "${question.question}"
      Answer: "${question.answer}"
      
      Return ONLY the translation in this format:
      Question: [Translated Question]
      Answer: [Translated Answer]`;
      
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

  const isChanging = (question.answer || '').startsWith('Answers change');
  const isLocation = (question.answer || '').startsWith('Answers vary');
  const personalizedAnswer = isLocation ? getPersonalizedAnswer(question.question, representativeData) : null;

  // Speech recognition setup
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setInputMode('type'); return; }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setUserAnswer(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setSrReady(true);
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const checkAnswer = async () => {
    if (!userAnswer.trim()) return;
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setVerifying(true);
    try {
      const result = await checkCivicsAnswer(question, userAnswer, { personalizedAnswer });
      setVerificationResult(result);
    } catch (e) {
      console.error('Failed to verify answer:', e);
      setSelfCheckMode(true);
      setIsRevealed(true);
    } finally {
      setVerifying(false);
    }
  };

  const handleResult = (isCorrect) => {
    onComplete(isCorrect);
    onNext();
  };

  const speak = (text) => {
    speakText(text, 'en', {
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
    });
  };

  const officialLink = <a href="https://www.uscis.gov/citizenship/testupdates" target="_blank" rel="noopener noreferrer" className="font-bold text-pw-navy underline underline-offset-2 hover:text-pw-red-ink">uscis.gov</a>;
  const segBtn = (active) => `min-h-[44px] flex items-center justify-center gap-2 px-4 rounded-full text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red ${active ? 'bg-white text-pw-navy shadow-raised' : 'text-pw-muted hover:text-pw-navy'}`;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 text-pw-navy">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tag tone="blue">{question.version} Civics Test</Tag>
        <div className="flex items-center gap-1 bg-white pl-3 rounded-2xl border border-pw-line ml-auto">
          <Globe className="w-4 h-4 text-pw-muted" aria-hidden="true" />
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger aria-label="Translate to" className="w-[124px] min-h-[44px] text-sm border-0 bg-transparent shadow-none focus:ring-0 px-2">
              <SelectValue placeholder="Translate to..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Translation</SelectItem>
              {SUPPORTED_LANGUAGES.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <RaisedCard>
        <Eyebrow className="mb-2">The officer asks</Eyebrow>
        <h3 className="text-[1.375rem] md:text-3xl font-extrabold leading-snug mb-3">
          {question.question}
        </h3>

        {/* Translation Display for Question */}
        {selectedLanguage && selectedLanguage !== 'none' && (
          <div className="mb-3">
            {isTranslating ? (
              <div className="flex items-center gap-2 text-pw-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Translating...
              </div>
            ) : (
              <p className="text-base font-semibold animate-in fade-in bg-pw-blue-soft text-pw-blue-ink px-4 py-3 rounded-2xl">
                {translation.split('Answer:')[0].replace('Question:', '').trim()}
              </p>
            )}
          </div>
        )}

        <PillButton
          onClick={() => speak(question.question)}
          aria-label="Listen to the question"
          className={isPlaying ? 'ring-2 ring-pw-navy/30' : ''}
        >
          <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> Listen
        </PillButton>

        <AnimatePresence mode="wait">
          {!verificationResult && !isRevealed ? (
            <motion.div
              key="ask"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full space-y-4 mt-6"
            >
              {!selfCheckMode ? (
                <>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-pw-soft rounded-full" role="group" aria-label="Answer by">
                    <button
                      type="button"
                      aria-pressed={inputMode === 'type'}
                      onClick={() => { if (isListening && recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) {} } setInputMode('type'); }}
                      className={segBtn(inputMode === 'type')}
                    >
                      <Keyboard className="w-4 h-4" aria-hidden="true" /> Type
                    </button>
                    <button
                      type="button"
                      aria-pressed={inputMode === 'speak'}
                      onClick={() => {
                        if (!recognitionRef.current) { toast.error('Voice input is not supported in this browser'); return; }
                        setInputMode('speak');
                      }}
                      className={segBtn(inputMode === 'speak')}
                    >
                      <Mic className="w-4 h-4" aria-hidden="true" /> Speak
                    </button>
                  </div>

                  {inputMode === 'speak' ? (
                    <div className="flex flex-col items-center">
                      <div className="relative mt-4">
                        <span className={`absolute inset-0 rounded-full bg-pw-red/20 transition-transform ${isListening ? 'scale-150 animate-pulse' : 'scale-125'}`} aria-hidden="true" />
                        <button
                          type="button"
                          onClick={() => {
                            if (isListening) {
                              recognitionRef.current?.stop();
                            } else {
                              setUserAnswer('');
                              recognitionRef.current?.start();
                            }
                          }}
                          disabled={!srReady}
                          aria-label={isListening ? 'Stop Listening' : 'Start Speaking'}
                          className="relative w-20 h-20 rounded-full bg-pw-red text-white grid place-items-center shadow-lift disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pw-navy/30"
                        >
                          {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                        </button>
                      </div>
                      <p className="mt-4 text-base font-semibold text-center" aria-hidden="true">
                        {isListening ? 'Stop Listening' : 'Start Speaking'}
                      </p>
                      <div className="w-full min-h-[52px] mt-3 px-4 py-3 rounded-2xl bg-pw-soft text-center" aria-live="polite">
                        {userAnswer ? (
                          <p className="italic">“{userAnswer}”</p>
                        ) : (
                          <p className="text-pw-muted">
                            {isListening ? 'Listening...' : 'Tap the microphone and speak your answer'}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Input
                      placeholder="Type your answer here..."
                      aria-label="Your answer"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && userAnswer.trim() && !verifying) {
                          checkAnswer();
                        }
                      }}
                      className="text-base min-h-[48px]"
                    />
                  )}

                  <div className="space-y-1">
                    <PrimaryButton
                      large
                      onClick={checkAnswer}
                      disabled={!userAnswer.trim() || verifying}
                      className="w-full"
                    >
                      {verifying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" aria-hidden="true" />
                          Submit Answer
                        </>
                      )}
                    </PrimaryButton>
                    <QuietButton
                      onClick={() => setSelfCheckMode(true)}
                      className="w-full text-sm text-pw-muted underline underline-offset-2"
                    >
                      Having trouble? Show answer to self-check
                    </QuietButton>
                  </div>
                </>
              ) : (
                <PrimaryButton large onClick={() => setIsRevealed(true)} className="w-full">
                  <Eye className="w-5 h-5" aria-hidden="true" /> Show Answer
                </PrimaryButton>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </RaisedCard>

      {verificationResult ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full space-y-4"
        >
          {verificationResult.is_correct ? (
            <>
              <div className="bg-pw-green-soft rounded-3xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-full bg-white grid place-items-center text-pw-green-ink shrink-0">
                    <CheckCircle className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <h3 className="text-xl font-extrabold text-pw-green-ink">Correct!</h3>
                </div>
                <p className="leading-relaxed">{verificationResult.feedback}</p>
              </div>
              <PrimaryButton large onClick={() => handleResult(true)} className="w-full">
                Next Question
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </PrimaryButton>
            </>
          ) : (
            <>
              <div className="bg-pw-red-soft rounded-3xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-full bg-white grid place-items-center text-pw-red-ink shrink-0">
                    <AlertCircle className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <span className="font-extrabold text-pw-red-ink text-xl">Not quite right</span>
                </div>
                <p className="leading-relaxed mb-4">{verificationResult.feedback}</p>
                <div className="bg-white rounded-2xl p-4">
                  <Eyebrow className="mb-1">Official answer:</Eyebrow>
                  {isChanging ? (
                    <p className="text-lg font-bold">Answers change. Check the current answer on {officialLink}</p>
                  ) : isLocation && !personalizedAnswer ? (
                    <p className="text-lg font-bold">Answers vary by where you live. Use the Representative Finder on your Practice dashboard to get your answer.</p>
                  ) : personalizedAnswer ? (
                    <>
                      <p className="text-lg font-extrabold">{personalizedAnswer}</p>
                      <p className="text-sm text-pw-muted mt-1">Sample: {question.answer}</p>
                    </>
                  ) : (
                    <p className="text-lg font-bold">{question.answer}</p>
                  )}
                </div>
              </div>
              <AIExplanation
                question={question.question}
                answer={personalizedAnswer || question.answer}
              />
              <PrimaryButton large onClick={() => handleResult(false)} className="w-full">
                Continue
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </PrimaryButton>
            </>
          )}
        </motion.div>
      ) : isRevealed ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full space-y-4"
        >
          <RaisedCard>
            {personalizedAnswer ? (
              <>
                <Eyebrow className="mb-2 text-pw-green-ink">Correct Answer for You</Eyebrow>
                <div className="mb-4 bg-pw-green-soft rounded-2xl p-4">
                  <p className="text-xl font-extrabold text-pw-green-ink">{personalizedAnswer}</p>
                </div>
                <Eyebrow className="mb-1">Official Sample Answer</Eyebrow>
                <p className="text-base text-pw-muted">{question.answer}</p>
              </>
            ) : (
              <>
                <Eyebrow className="mb-2">Answer</Eyebrow>
                {isChanging ? (
                  <p className="text-xl font-bold leading-relaxed">
                    Answers change. Check the current answer on {officialLink}
                  </p>
                ) : isLocation && !personalizedAnswer ? (
                  <p className="text-xl font-bold leading-relaxed">
                    Answers vary by where you live. Use the Representative Finder on your Practice dashboard to get your answer.
                  </p>
                ) : (
                  <p className="text-xl font-extrabold leading-relaxed">
                    {question.answer}
                  </p>
                )}
              </>
            )}

            {/* Translation Display for Answer */}
            {selectedLanguage && selectedLanguage !== 'none' && !isTranslating && translation.includes('Answer:') && (
              <p className="text-base font-semibold mt-3 bg-pw-blue-soft text-pw-blue-ink px-4 py-3 rounded-2xl animate-in fade-in">
                {translation.split('Answer:')[1].trim()}
              </p>
            )}

            <PillButton
              onClick={() => speak(personalizedAnswer || question.answer)}
              className="mt-4"
            >
              <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> Listen to answer
            </PillButton>

            <div className="mt-4">
              <AIExplanation
                question={question.question}
                answer={personalizedAnswer || question.answer}
              />
            </div>
          </RaisedCard>

          <RaisedCard>
            <p className="font-bold mb-3">How did you do?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <SecondaryButton onClick={() => handleResult(false)} className="border-pw-line">
                Hard / Missed
              </SecondaryButton>
              <PrimaryButton onClick={() => handleResult(true)}>
                Easy / Got it
              </PrimaryButton>
            </div>
          </RaisedCard>
        </motion.div>
      ) : null}

      {!verificationResult && !isRevealed && (
        <QuietButton onClick={onNext} className="w-full text-pw-muted">
          Skip to next <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </QuietButton>
      )}
    </div>
  );
}
