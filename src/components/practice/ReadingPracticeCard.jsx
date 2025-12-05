import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Check, X, ArrowRight, AlertCircle, Loader2, Activity, BarChart2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { base44 } from '@/api/base44Client';

export default function ReadingPracticeCard({ sentence, onComplete, onNext }) {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [status, setStatus] = useState('idle'); // idle, listening, processing, success, error
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const spokenTextRef = useRef('');

  useEffect(() => {
    // Reset state on new sentence
    setSpokenText('');
    setStatus('idle');
    setAnalysis(null);
    setIsAnalyzing(false);
  }, [sentence]);

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
        spokenTextRef.current = '';
        startRecording();
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setSpokenText(transcript);
        spokenTextRef.current = transcript;
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        setStatus('error');
        stopRecording(); // Ensure recording stops
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        stopRecording(); // Ensure recording stops and triggers analysis
      };
    } else {
      setStatus('unsupported');
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [sentence]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Better browser compatibility handling
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');
        
      const options = mimeType ? { mimeType } : undefined;
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const type = mediaRecorderRef.current.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type });
        analyzeAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      // Non-blocking error, we can still use text recognition
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setSpokenText('');
      setStatus('listening');
      setAnalysis(null);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const fallbackValidation = () => {
    const textToCheck = spokenTextRef.current || spokenText;
    const target = cleanText(sentence.text);
    const spoken = cleanText(textToCheck || ""); 
    
    if (spoken && (target === spoken || spoken.includes(target) || target.includes(spoken))) {
        setStatus('success');
        setAnalysis({
            overall_score: 85,
            pronunciation_score: 0,
            intonation_score: 0,
            fluency_score: 0,
            general_feedback: "Good reading! (Text match verified)",
            phoneme_feedback: "Detailed audio analysis unavailable."
        });
        onComplete(true);
    } else {
        setStatus('retry');
        if (!spoken) {
            toast.error("We didn't catch that. Please speak clearly.");
        }
    }
  };

  const analyzeAudio = async (audioBlob) => {
    // Check if too short - fallback to text validation
    if (audioBlob.size < 500) { 
        fallbackValidation();
        return;
    }

    setIsAnalyzing(true);
    try {
      // 1. Upload File
      const fileExt = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([audioBlob], `reading_practice.${fileExt}`, { type: audioBlob.type });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // 2. Analyze with LLM
      const prompt = `Analyze the pronunciation of the user reading the following target sentence: "${sentence.text}".
      
      The user's audio is provided.
      Evaluate their:
      1. Pronunciation (accuracy of phonemes)
      2. Intonation (natural rise and fall)
      3. Fluency (speed and smoothness)
      4. Overall Score (0-100)

      Return ONLY a JSON object with this schema:
      {
        "pronunciation_score": number (0-100),
        "intonation_score": number (0-100),
        "fluency_score": number (0-100),
        "overall_score": number (0-100),
        "phoneme_feedback": string (brief specific sounds to improve, e.g. "Watch the 'th' sound"),
        "general_feedback": string (brief encouraging advice)
      }`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [file_url],
        response_json_schema: {
            type: "object",
            properties: {
                pronunciation_score: { type: "number" },
                intonation_score: { type: "number" },
                fluency_score: { type: "number" },
                overall_score: { type: "number" },
                phoneme_feedback: { type: "string" },
                general_feedback: { type: "string" }
            }
        }
      });

      setAnalysis(result);
      
      if (result.overall_score >= 70) {
        setStatus('success');
        onComplete(true);
      } else {
        setStatus('retry');
      }

    } catch (error) {
      console.error("Analysis failed", error);
      fallbackValidation();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const cleanText = (text) => {
    return text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
  };

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
        
        <CardContent className="p-8 md:p-12 flex flex-col items-center text-center min-h-[500px] justify-between">
          
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
             <div className="min-h-[160px] w-full flex flex-col items-center justify-center">
                {isListening ? (
                    <div className="flex items-center gap-2 text-purple-600 animate-pulse">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-75" />
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-150" />
                        <span className="font-medium">Listening & Recording...</span>
                    </div>
                ) : isAnalyzing ? (
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                         <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                         <p className="text-sm font-medium">Analyzing your pronunciation...</p>
                    </div>
                ) : analysis ? (
                    <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${analysis.overall_score >= 70 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {analysis.overall_score >= 70 ? <Check className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-900 text-lg">{analysis.overall_score}%</p>
                                    <p className="text-xs text-slate-500">Overall Score</p>
                                </div>
                            </div>
                            <div className="text-right max-w-[60%]">
                                <p className="text-sm font-medium text-slate-800">{analysis.general_feedback}</p>
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                                <p className="text-xs text-slate-500 mb-1">Pronunciation</p>
                                <Progress value={analysis.pronunciation_score} className="h-2" />
                                <span className="text-xs font-medium mt-1 block">{analysis.pronunciation_score}%</span>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 mb-1">Intonation</p>
                                <Progress value={analysis.intonation_score} className="h-2" />
                                <span className="text-xs font-medium mt-1 block">{analysis.intonation_score}%</span>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 mb-1">Fluency</p>
                                <Progress value={analysis.fluency_score} className="h-2" />
                                <span className="text-xs font-medium mt-1 block">{analysis.fluency_score}%</span>
                            </div>
                         </div>

                         {analysis.phoneme_feedback && (
                             <div className="bg-white p-2 rounded-lg border border-slate-100 text-left">
                                 <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Tip:</p>
                                 <p className="text-sm text-slate-600">{analysis.phoneme_feedback}</p>
                             </div>
                         )}
                    </div>
                ) : spokenText ? (
                    <div className="text-slate-500">
                        <p className="text-xs uppercase font-bold mb-1">You said:</p>
                        <p className="text-lg">"{spokenText}"</p>
                        <p className="text-xs text-slate-400 mt-2">Waiting for analysis...</p>
                    </div>
                ) : (
                    <p className="text-slate-400">Tap microphone to start reading</p>
                )}
             </div>

             {/* Controls */}
             <div className="flex justify-center gap-4">
                {(!analysis || analysis.overall_score < 70) ? (
                    <Button
                        size="lg"
                        onClick={toggleListening}
                        disabled={isAnalyzing}
                        className={`h-16 w-16 rounded-full shadow-lg transition-all duration-300 ${
                            isListening 
                            ? 'bg-red-100 text-red-600 hover:bg-red-200 ring-4 ring-red-50' 
                            : 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105'
                        } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
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