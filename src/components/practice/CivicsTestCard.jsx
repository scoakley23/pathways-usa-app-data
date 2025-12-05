import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Eye, ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CivicsTestCard({ question, onComplete, onNext }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="bg-white shadow-xl border-0 overflow-hidden rounded-2xl">
        <div className="h-2 bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600" />
        
        <CardContent className="p-8 md:p-12 flex flex-col items-center text-center min-h-[400px] justify-center">
          
          <div className="mb-8">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wide mb-4">
              {question.version} Civics Test
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 leading-relaxed">
              {question.question}
            </h3>
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
                  <p className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-2">Answer</p>
                  <p className="text-xl font-medium text-slate-800 leading-relaxed">
                    {question.answer}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => speak(question.answer)}
                    className="mt-4 text-slate-500 hover:text-indigo-600"
                  >
                    <Volume2 className="w-4 h-4 mr-1" /> Listen to answer
                  </Button>
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