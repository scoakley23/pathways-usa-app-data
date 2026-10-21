import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MessageCircle, X, Send, Bot, User, Loader2, Volume2, Globe, History } from 'lucide-react';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { speakText } from "@/components/utils/textToSpeech";
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import { getSavedLanguage, RTL_LANGUAGES } from '@/hooks/useAppLanguage';

// Privacy note shown above the chat box. English and Spanish are written by
// hand; other languages are translated once by AI and cached on the device.
// Bump the cache key whenever the English text changes.
const PRIVACY_NOTE = {
  en: "Don't share your immigration status, A-number, case details, or address. Your questions are saved to your account so you can see them in History.",
  es: 'No comparta su estatus migratorio, número A, detalles de su caso ni su dirección. Sus preguntas se guardan en su cuenta para que pueda verlas en el Historial.',
};
const PRIVACY_NOTE_CACHE_KEY = 'pathways_sb_privacy_v2_';

function usePrivacyNote(language) {
  const [note, setNote] = useState(PRIVACY_NOTE[language] || PRIVACY_NOTE.en);

  useEffect(() => {
    if (PRIVACY_NOTE[language]) {
      setNote(PRIVACY_NOTE[language]);
      return;
    }
    setNote(PRIVACY_NOTE.en);
    try {
      const cached = localStorage.getItem(PRIVACY_NOTE_CACHE_KEY + language);
      if (cached) {
        setNote(cached);
        return;
      }
    } catch (e) {
      // ignore
    }

    let cancelled = false;
    const langName = LANGUAGES.find((l) => l.value === language)?.label || language;
    base44.integrations.Core.InvokeLLM({
      prompt: `Translate this privacy note for an app that helps immigrants study for the U.S. citizenship test into ${langName}. Keep "A-number" understandable (you may add the local term). Return only the translated text.\n\n${PRIVACY_NOTE.en}`,
    }).then((res) => {
      if (cancelled || typeof res !== 'string' || !res.trim()) return;
      setNote(res.trim());
      try {
        localStorage.setItem(PRIVACY_NOTE_CACHE_KEY + language, res.trim());
      } catch (e) {
        // ignore
      }
    }).catch(() => {
      // keep English
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  return note;
}

export default function StudyBuddy() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your AI study buddy. Ask me any question about the US Citizenship test!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('en');
  const scrollRef = useRef(null);
  const appLanguage = getSavedLanguage();
  const privacyNote = usePrivacyNote(appLanguage);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (e) {
        // Not logged in or other error
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const speak = (text) => {
    speakText(text, language);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuestion = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userQuestion }]);
    setIsLoading(true);

    try {
      // 1. Get AI Answer
      let prompt = `You are a helpful US Citizenship Test Tutor. 
      The student asked: "${userQuestion}"
      
      Provide a clear, accurate, and concise answer relevant to the US Civics test or English learning for the test. 
      Keep it simple and encouraging.`;

      if (language !== 'en') {
        prompt += `\n\nIMPORTANT: Provide the answer in ${language}. Also provide the English translation below it.`;
      }

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      const answerText = typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse);

      setMessages(prev => [...prev, { role: 'assistant', content: answerText }]);

      // 2. Save to History Log
      if (user) {
        await base44.entities.AIStudyLog.create({
            user_email: user.email,
            question: userQuestion,
            answer: answerText,
            language: language,
            created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Study Buddy Error:", error);
      toast.error("Sorry, I couldn't answer that right now.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {isOpen && (
        <Card className="w-[calc(100vw-3rem)] max-w-[350px] h-[500px] max-h-[calc(100vh-7rem)] shadow-lift border-pw-line overflow-hidden mb-4 pointer-events-auto flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
          <CardHeader className="bg-white text-pw-navy border-b border-pw-line p-3 flex flex-col gap-2 space-y-0 shrink-0">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-pw-blue-soft text-pw-blue-ink flex items-center justify-center" aria-hidden="true"><Bot className="w-5 h-5" /></span>
                <CardTitle className="text-lg">AI Study Buddy</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                    <Link to={createPageUrl('StudyHistory')}>
                        <Button variant="ghost" size="icon" className="text-pw-muted hover:text-pw-navy" title="View History" aria-label="View History">
                            <History className="w-4 h-4" />
                        </Button>
                    </Link>
                    <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-pw-muted hover:text-pw-navy"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close"
                    >
                    <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>
            <div className="flex items-center gap-2 w-full">
                <Globe className="w-4 h-4 text-pw-muted shrink-0" aria-hidden="true" />
                <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="min-h-11 h-11 bg-pw-soft border-transparent text-pw-navy text-sm font-semibold" aria-label="Language">
                        <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                        {LANGUAGES.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-hidden bg-pw-page">
             <div className="h-full overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "flex gap-2 max-w-[85%]", 
                      msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      msg.role === 'user' ? "bg-pw-soft text-pw-navy" : "bg-pw-blue-soft text-pw-blue-ink"
                    )}>
                      {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl text-base leading-snug group relative",
                      msg.role === 'user' 
                        ? "bg-pw-navy text-white rounded-tr-md" 
                        : "bg-white border border-pw-line text-pw-navy rounded-tl-md"
                    )}>
                      {msg.content}
                      {msg.role === 'assistant' && (
                          <button 
                            onClick={() => speak(msg.content)}
                            className="absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-pw-muted hover:text-pw-navy opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                            title="Read aloud"
                            aria-label="Read aloud"
                          >
                              <Volume2 className="w-4 h-4" />
                          </button>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-pw-blue-soft text-pw-blue-ink flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="bg-white border border-pw-line p-3 rounded-2xl rounded-tl-md">
                      <Loader2 className="w-4 h-4 animate-spin text-pw-muted" />
                    </div>
                  </div>
                )}
             </div>
          </CardContent>

          <CardFooter className="p-3 bg-white border-t border-pw-line shrink-0 flex-col gap-2">
            <p
              dir={RTL_LANGUAGES.includes(appLanguage) ? 'rtl' : 'ltr'}
              className="w-full text-base leading-snug text-pw-muted"
            >
              {privacyNote}
            </p>
            <form onSubmit={handleSend} className="flex w-full gap-2">
              <Input 
                placeholder="Ask a question..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 min-w-0"
                aria-label="Ask a question..."
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} aria-label="Send" className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="lg"
        aria-label="AI Study Buddy"
        className={cn(
          "rounded-full h-14 w-14 p-0 [&_svg]:size-6 shadow-lift pointer-events-auto transition-all duration-300",
          isOpen ? "rotate-90 opacity-0 scale-0" : "rotate-0 opacity-100 scale-100",
          "bg-pw-navy hover:bg-[#0F1B36] text-white"
        )}
      >
        <MessageCircle className="w-7 h-7" />
      </Button>
      
      {/* Close button that appears when open to allow closing if the card covers the toggle */}
      {isOpen && (
         <Button
            onClick={() => setIsOpen(false)}
            size="lg"
            className="rounded-full h-14 w-14 p-0 [&_svg]:size-6 shadow-lift pointer-events-auto bg-pw-navy hover:bg-[#0F1B36] text-white absolute bottom-0 right-0"
            aria-label="Close"
          >
            <X className="w-7 h-7" />
          </Button>
      )}
    </div>
  );
}