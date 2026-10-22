import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Eye, ArrowRight, Globe, Loader2, CheckCircle, Keyboard, MicOff, ChevronRight, Mic } from 'lucide-react';
import { speakText } from "@/components/utils/textToSpeech";
import ExplainSheet from '@/components/practice/ExplainSheet';
import { ExplainSimplyButton, PillButton, Poster, QuietButton, Tag, posterOutline, posterSolid, posterTone } from '@/components/pathways/ui';
import { stopReading } from '@/components/persona/useAutoRead';
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { checkCivicsAnswer } from '@/components/civics/checkCivicsAnswer';
import { matchOfficialAnswer, splitOfficialAnswers } from '@/lib/practiceChecks';

import { getPersonalizedAnswer, currentAnswerFor } from '@/lib/currentAnswers';
import { LANGUAGES } from '@/hooks/useLessonTranslation';

// `testMode` (Interview Day): like the real test, one answer per question, no
// translation, no self-check or reveal, no AI explanation, and "I don't know"
// instead of Skip. Grading is unchanged. Without it nothing changes.
// Shown as a red/blue poster (Phase 5): `index`/`total` give the card's place
// in the run (color, "CARD 2 OF 6", squares). Feedback stays on the poster
// and shows official answers only; "Explain it simply" opens a white sheet.
export default function CivicsTestCard({ question, onComplete, onNext, representativeData, testMode = false, index = 0, total = 0 }) {
  const [explainOpen, setExplainOpen] = useState(false);
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
    setExplainOpen(false);
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
  const current = isChanging ? currentAnswerFor(question) : null;

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
    // Answers that clearly match an accepted answer are checked on the
    // device; only the rest go to the AI (which judges meaning).
    if (!isChanging && (!isLocation || personalizedAnswer) && matchOfficialAnswer(userAnswer, personalizedAnswer || question.answer).isCorrect) {
      setVerificationResult({ is_correct: true, feedback: '' });
      return;
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

  // The official answer line on the poster (never AI-written).
  const answerLine = personalizedAnswer
    ? `${personalizedAnswer} (your answer)`
    : isChanging && current?.kind === 'current'
      ? `${current.text} (checked ${current.checkedOn}, uscis.gov)`
      : isChanging
        ? 'Answers change. Check the current answer on uscis.gov.'
        : isLocation
          ? 'Answers vary by where you live. Use Find My Representative on the Learn page.'
          : splitOfficialAnswers(question.answer).join(' · ') || question.answer;
  const done = !!verificationResult || isRevealed;
  const translatedQuestion = translation ? translation.split('Answer:')[0].replace('Question:', '').trim() : '';
  const translatedAnswer = translation.includes('Answer:') ? translation.split('Answer:')[1].trim() : '';
  const label = `${testMode ? 'Civics test' : 'Practice'} · ${total ? `Card ${index + 1} of ${total}` : `${question.version} civics`}`;
  const segBtn = (active) => (active ? posterSolid : posterOutline);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 text-pw-navy">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tag tone="blue">{question.version} Civics Test</Tag>
        {!testMode && <div className="flex items-center gap-1 bg-white pl-3 rounded-xl border border-pw-line ml-auto">
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
        </div>}
      </div>

      <div>
        <Poster
          tone={posterTone(index)}
          className="-mx-4 sm:mx-0 sm:rounded-[14px]"
          label={label}
          progress={total ? { index, total } : null}
          question={question.question}
          answer={done ? `Answer: ${answerLine}` : null}
        >
          <div className="space-y-4">
            {/* Translation of the question (and, after answering, the answer) */}
            {selectedLanguage && selectedLanguage !== 'none' && (
              isTranslating ? (
                <p className="flex items-center gap-2 text-base"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Translating…</p>
              ) : (
                <div className="rounded-[10px] bg-white/10 border border-white/60 px-4 py-3 space-y-1">
                  <p className="text-base font-semibold">{translatedQuestion}</p>
                  {done && translatedAnswer && <p className="text-base">{translatedAnswer}</p>}
                </div>
              )
            )}

            <PillButton onClick={() => speak(done ? (personalizedAnswer || question.answer) : question.question)} aria-label={done ? 'Listen to the answer' : 'Listen to the question'} className={isPlaying ? 'ring-2 ring-white' : ''}>
              <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> {done ? 'Listen to answer' : 'Listen'}
            </PillButton>

            {!done && (!selfCheckMode ? (
              <>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Answer by">
                  <button
                    type="button"
                    aria-pressed={inputMode === 'speak'}
                    onClick={() => {
                      if (!recognitionRef.current) { toast.error('Voice input is not supported in this browser'); return; }
                      setInputMode('speak');
                    }}
                    className={segBtn(inputMode === 'speak')}
                  >
                    <Mic className="w-5 h-5" aria-hidden="true" /> Speak
                  </button>
                  <button
                    type="button"
                    aria-pressed={inputMode === 'type'}
                    onClick={() => { if (isListening && recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) {} } setInputMode('type'); }}
                    className={segBtn(inputMode === 'type')}
                  >
                    <Keyboard className="w-5 h-5" aria-hidden="true" /> Type
                  </button>
                </div>

                {inputMode === 'speak' ? (
                  <div className="flex flex-col items-center">
                    <div className="relative mt-2">
                      <span className={`absolute inset-0 rounded-full bg-white/25 transition-transform ${isListening ? 'scale-150 animate-pulse' : 'scale-125'}`} aria-hidden="true" />
                      <button
                        type="button"
                        onClick={() => {
                          if (isListening) {
                            recognitionRef.current?.stop();
                          } else {
                            stopReading();
                            setUserAnswer('');
                            recognitionRef.current?.start();
                          }
                        }}
                        disabled={!srReady}
                        aria-label={isListening ? 'Stop Listening' : 'Start Speaking'}
                        className="relative w-20 h-20 rounded-full bg-white text-pw-navy grid place-items-center shadow-lift disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
                      >
                        {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                      </button>
                    </div>
                    <p className="mt-4 text-base font-semibold text-center" aria-hidden="true">
                      {isListening ? 'Stop Listening' : 'Start Speaking'}
                    </p>
                    <div className="w-full min-h-[52px] mt-3 px-4 py-3 rounded-[10px] bg-white/10 border border-white/60 text-center" aria-live="polite">
                      {userAnswer ? <p className="italic">“{userAnswer}”</p> : <p>{isListening ? 'Listening...' : 'Tap the microphone and speak your answer'}</p>}
                    </div>
                  </div>
                ) : (
                  <input
                    placeholder="Type your answer here..."
                    aria-label="Your answer"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && userAnswer.trim() && !verifying) checkAnswer();
                    }}
                    className="w-full min-h-[52px] rounded-[10px] bg-white px-4 text-lg text-pw-navy placeholder:text-pw-muted focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
                  />
                )}
                <p className="text-sm">Answer only the civics question. Don't include personal information.</p>

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={checkAnswer} disabled={!userAnswer.trim() || verifying} className={posterSolid}>
                    {verifying ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <CheckCircle className="w-5 h-5" aria-hidden="true" />}
                    {verifying ? 'Checking…' : 'Check'}
                  </button>
                  {!testMode && (
                    <button type="button" onClick={() => setSelfCheckMode(true)} className={posterOutline}>
                      Show the answer
                    </button>
                  )}
                </div>
              </>
            ) : (
              <button type="button" onClick={() => setIsRevealed(true)} className={posterSolid}>
                <Eye className="w-5 h-5" aria-hidden="true" /> Show Answer
              </button>
            ))}

            {/* Feedback stays on the poster */}
            {verificationResult && (
              <div className="space-y-3" aria-live="polite">
                <p className="text-2xl font-bold">{verificationResult.is_correct ? 'Right.' : 'Not quite.'}</p>
                {verificationResult.feedback && <p className="text-lg leading-relaxed">{verificationResult.feedback}</p>}
                {userAnswer && <p className="text-base">You said: “{userAnswer}”</p>}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleResult(!!verificationResult.is_correct)} className={posterSolid}>
                    {verificationResult.is_correct ? 'Next question' : 'Continue'} <ChevronRight className="w-5 h-5" aria-hidden="true" />
                  </button>
                  {!testMode && <ExplainSimplyButton onPoster aria-expanded={explainOpen} onClick={() => setExplainOpen((v) => !v)} />}
                </div>
              </div>
            )}
            {isRevealed && !verificationResult && (
              <div className="space-y-3">
                <p className="text-lg font-semibold">How did you do?</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleResult(true)} className={posterSolid}>Easy / Got it</button>
                  <button type="button" onClick={() => handleResult(false)} className={posterOutline}>Hard / Missed</button>
                  {!testMode && <ExplainSimplyButton onPoster aria-expanded={explainOpen} onClick={() => setExplainOpen((v) => !v)} />}
                </div>
              </div>
            )}
          </div>
        </Poster>
        {done && explainOpen && !testMode && (
          <ExplainSheet className="-mx-4 sm:mx-0 sm:mt-2 sm:rounded-[14px]" question={question.question} answer={personalizedAnswer || question.answer} aiFallback />
        )}
      </div>

      {!done && (testMode ? (
        <QuietButton onClick={() => handleResult(false)} disabled={verifying} className="w-full text-pw-muted">
          I don&apos;t know
        </QuietButton>
      ) : (
        <QuietButton onClick={onNext} className="w-full text-pw-muted">
          Skip to next <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </QuietButton>
      ))}
    </div>
  );
}
