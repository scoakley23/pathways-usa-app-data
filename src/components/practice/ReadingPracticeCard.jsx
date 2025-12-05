import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Check, X, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function ReadingPracticeCard({ sentence, onComplete, onNext }) {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [status, setStatus] = useState('idle'); // idle, listening, processing, success, error
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setStatus('listening');
        setSpokenText('');
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setSpokenText(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setStatus('error');
        toast.error("Microphone error. Please try again.");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // If we were listening and it ended, validate the result
        // We add a small timeout to allow state to settle if needed
        setTimeout(() => {
            if (status !== 'success') { // Don't overwrite if already success
                validateSpeech();
            }
        }, 500);
      };
    } else {
      setStatus('unsupported');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [sentence]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setSpokenText('');
      setStatus('listening');
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Handle case where it might be already started
        console.error(e);
      }
    }
  };

  const cleanText = (text) => {
    return text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
  };

  const validateSpeech = () => {
    // We need to access the latest spokenText. 
    // Since this is called from onEnd (closure), we might need a ref or just rely on the component update cycle.
    // However, for simplicity in this effect-based flow, we'll check the state in a separate effect or just rely on the user stopping manually or silence detection.
    
    // Actually, let's perform validation logic here based on current state text
    // But setSpokenText is async. 
    // Let's rely on the user clicking stop or the silence timeout.
  };

  // Effect to check match whenever spoken text changes significantly or listening stops
  useEffect(() => {
    if (!spokenText || isListening) return;
    
    const target = cleanText(sentence.text);
    const spoken = cleanText(spokenText);
    
    if (!spoken) return;

    // Simple fuzzy match or direct inclusion
    // The USCIS test is lenient, but we want good practice.
    // Check if spoken text contains the core of the sentence
    if (target === spoken || spoken.includes(target) || target.includes(spoken)) {
       setStatus('success');
       setConfidence(100);
       onComplete(true);
    } else {
       setStatus('retry');
    }
  }, [isListening, spokenText, sentence]);


  const speak = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sentence.text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (status === 'unsupported') {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold">Browser Not Supported</h3>
        <p className="text-slate-600">Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.</p>
        <Button onClick={onNext} className="mt-4">Skip</Button>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="bg-white shadow-xl border-0 overflow-hidden rounded-2xl">
        <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
        
        <CardContent className="p-8 md:p-12 flex flex-col items-center text-center min-h-[400px] justify-between">
          
          <div className="space-y-6 w-full">
            <div className="flex justify-between items-start">
               <span className="text-xs font-bold tracking-wider text-purple-500 uppercase">Reading Practice</span>
               <Button variant="ghost" size="sm" onClick={speak} className="text-slate-400 hover:text-purple-600">
                 <Volume2 className="w-4 h-4 mr-1" /> Listen
               </Button>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 leading-tight py-4">
              {sentence.text}
            </h2>
          </div>

          <div className="w-full space-y-8">
             {/* Feedback Area */}
             <div className="min-h-[80px] flex items-center justify-center">
                {isListening && (
                    <div className="flex items-center gap-2 text-purple-600 animate-pulse">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-75" />
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-150" />
                        <span className="font-medium">Listening...</span>
                    </div>
                )}
                
                {!isListening && spokenText && status !== 'success' && (
                    <div className="text-slate-500">
                        <p className="text-xs uppercase font-bold mb-1">You said:</p>
                        <p className="text-lg">"{spokenText}"</p>
                        {status === 'retry' && <p className="text-red-500 text-sm mt-2 font-medium">Try again, clear and loud.</p>}
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center text-green-600 animate-in zoom-in">
                        <Check className="w-12 h-12 mb-2" />
                        <p className="text-xl font-bold">Great Reading!</p>
                    </div>
                )}
             </div>

             {/* Controls */}
             <div className="flex justify-center gap-4">
                {status !== 'success' ? (
                    <Button
                        size="lg"
                        onClick={toggleListening}
                        className={`h-16 w-16 rounded-full shadow-lg transition-all duration-300 ${
                            isListening 
                            ? 'bg-red-100 text-red-600 hover:bg-red-200 ring-4 ring-red-50' 
                            : 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105'
                        }`}
                    >
                        {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </Button>
                ) : (
                    <Button onClick={onNext} className="h-12 px-8 text-lg rounded-xl bg-purple-600 hover:bg-purple-700">
                        Next Sentence <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                )}
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}