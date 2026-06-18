import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Eye, ArrowRight, Globe, Loader2 } from 'lucide-react';
import { speakText } from "@/components/utils/textToSpeech";
import AIExplanation from '@/components/ai/AIExplanation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';

import { getPersonalizedAnswer } from '@/components/civics/RepresentativeFinder';

export default function CivicsTestCard({ question, onComplete, onNext, representativeData }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
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

  // Reset state when question changes
  useEffect(() => {
    setIsRevealed(false);
    setIsPlaying(false);
    setTranslation('');
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
      const langName = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name;
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

  const personalizedAnswer = getPersonalizedAnswer(question.question, representativeData);

  const speak = (text) => {
    speakText(text, 'en', {
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
       <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm p-1 rounded-lg border border-slate-200">
          <Globe className="w-4 h-4 text-slate-500 ml-2" />
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-[140px] h-8 text-xs border-0 bg-transparent focus:ring-0">
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

      <Card className="bg-white shadow-xl border-0 overflow-hidden rounded-2xl">
        <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600" />
        
        <CardContent className="p-8 md:p-12 flex flex-col items-center text-center min-h-[400px] justify-center">
          
          <div className="mb-8 w-full">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wide mb-4">
              {question.version} Civics Test
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 leading-relaxed mb-4">
              {question.question}
            </h3>

             {/* Translation Display for Question */}
             {selectedLanguage && selectedLanguage !== 'none' && (
                <div className="mb-4">
                    {isTranslating ? (
                         <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                            <Loader2 className="w-3 h-3 animate-spin" /> Translating...
                        </div>
                    ) : (
                        <p className="text-lg text-indigo-700 font-medium animate-in fade-in bg-indigo-50 p-3 rounded-lg inline-block">
                            {translation.split('Answer:')[0].replace('Question:', '').trim()}
                        </p>
                    )}
                </div>
            )}
          </div>

          <div className="mb-8">
             <Button
              variant="outline"
              size="icon"
              onClick={() => speak(question.question)}
              className={`rounded-full w-12 h-12 ${isPlaying ? 'text-indigo-600 border-indigo-200 bg-indigo-50' : ''}`}
            >
              <Volume2 className="w-5 h-5" />
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {!isRevealed ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Button 
                  onClick={() => setIsRevealed(true)} 
                  className="h-12 px-8 text-lg rounded-xl bg-indigo-600 hover:bg-indigo-700"
                >
                  <Eye className="mr-2 w-5 h-5" /> Show Answer
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full space-y-8"
              >
                <div className="bg-slate-50 rounded-xl p-8 border border-slate-200 w-full">
                  {personalizedAnswer ? (
                    <>
                      <p className="text-sm text-green-600 uppercase tracking-wider font-bold mb-2">Correct Answer for You</p>
                      <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-xl font-bold text-green-800">{personalizedAnswer}</p>
                      </div>
                      <div className="border-t border-slate-200 pt-3 mt-3">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Official Sample Answer</p>
                        <p className="text-base text-slate-500">{question.answer}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-2">Answer</p>
                      <p className="text-xl font-medium text-slate-800 leading-relaxed">
                        {question.answer}
                      </p>
                    </>
                  )}

                   {/* Translation Display for Answer */}
                    {selectedLanguage && selectedLanguage !== 'none' && !isTranslating && translation.includes('Answer:') && (
                       <p className="text-lg text-indigo-700 font-medium mt-2 animate-in fade-in">
                           {translation.split('Answer:')[1].trim()}
                       </p>
                    )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => speak(personalizedAnswer || question.answer)}
                    className="mt-4 text-slate-500 hover:text-indigo-600"
                  >
                    <Volume2 className="w-4 h-4 mr-1" /> Listen to answer
                    </Button>

                    <AIExplanation 
                    question={question.question} 
                    answer={personalizedAnswer || question.answer} 
                    />
                    </div>

                <div className="flex flex-col items-center space-y-4">
                  <p className="text-slate-600 font-medium">How did you do?</p>
                  <div className="flex gap-4">
                     <Button 
                        variant="outline" 
                        className="border-orange-200 hover:bg-orange-50 text-orange-700 min-w-[120px]"
                        onClick={() => onComplete(false)}
                     >
                        Hard / Missed
                     </Button>
                     <Button 
                        className="bg-green-600 hover:bg-green-700 min-w-[120px]"
                        onClick={() => onComplete(true)}
                     >
                        Easy / Got it
                     </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </CardContent>
      </Card>
       {isRevealed && (
         <div className="mt-6 flex justify-center">
            <Button variant="ghost" onClick={onNext} className="text-slate-500 hover:text-slate-800">
                Skip to next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
         </div>
       )}
    </div>
  );
}