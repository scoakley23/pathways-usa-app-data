import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { X, Send, User, Loader2, Globe, History, Users, Scale } from 'lucide-react';
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import { getSavedLanguage, RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import TutorAvatar from '@/components/persona/TutorAvatar';
import { ListenButton } from '@/components/persona/TutorMessage';
import useTutorProfile from '@/components/persona/useTutorProfile';
import useTutorLines from '@/components/persona/useTutorLines';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import { languageNameFor } from '@/components/persona/languageName';
import {
  ASK_LINES,
  ASK_LINES_ES,
  ASK_LINES_CACHE_KEY,
  ASK_RESPONSE_SCHEMA,
  MAX_QUESTION_LENGTH,
  buildAskPrompt,
  historyAnswerText,
  interpretAskResponse,
  looksPersonalLegal,
  redactIdentifiers,
} from '@/lib/askTutor';
import TalkToPerson from './TalkToPerson';

// "Ask Vía" (or the learner's chosen tutor name): the AI tutor chat, using the
// tutor persona from the learner's tutor profile. Questions about the
// learner's own case or eligibility get a fixed, kind decline and a link to
// "Talk to a lawyer first" — caught by a local keyword check (no AI call) or
// by the AI's is_personal_legal flag. Declined questions are not saved.

// Privacy note shown above the chat box. English and Spanish are written by
// hand; other languages are translated once by AI and cached on the device.
// Bump the cache key whenever the English text changes.
const PRIVACY_NOTE = {
  en: "Your chats with Vía are private. Your tutor can't see them. Don't share your immigration status, A-number, case details, or address. Your questions are saved to your account so you can see them in History.",
  es: 'Sus conversaciones con Vía son privadas. Su tutor no puede verlas. No comparta su estatus migratorio, número A, detalles de su caso ni su dirección. Sus preguntas se guardan en su cuenta para que pueda verlas en el Historial.',
};
const PRIVACY_NOTE_CACHE_KEY = 'pathways_sb_privacy_v3_';

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

// One assistant bubble: learner-language text, English under it, Listen
// buttons, and an optional action (the lawyer link on a decline) right after
// the first paragraph so it is visible without scrolling.
function TutorBubble({ profile, language, mine, en, action, expression }) {
  const showMine = !!mine && language !== 'en';
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  return (
    <div className="flex gap-2 items-start">
      <TutorAvatar avatar={profile.avatar} size={28} className="mt-1" expression={expression} />
      <div className="min-w-0 flex-1 px-3 py-3 rounded-2xl rounded-tl-md bg-white border border-pw-line text-pw-navy text-base leading-snug">
        {showMine && <p dir={dir} className="whitespace-pre-line">{mine}</p>}
        {showMine && action}
        {en && <p className={cn('whitespace-pre-line', showMine && 'text-pw-muted mt-2')}>{en}</p>}
        {!en && !showMine && mine && <p dir={dir} className="whitespace-pre-line">{mine}</p>}
        {!showMine && action}
        <div className="flex flex-wrap gap-2 mt-2">
          {showMine && <ListenButton text={mine} language={language} tutorName={profile.name} className="px-3" />}
          {en && <ListenButton text={en} language="en" label={showMine ? 'English' : 'Listen'} tutorName={profile.name} className="px-3" />}
        </div>
      </div>
    </div>
  );
}

// Other screens (the tab bar's tutor button) open the chat with this event.
export const OPEN_TUTOR_EVENT = 'pathways-open-tutor';
export const openTutorChat = () => window.dispatchEvent(new Event(OPEN_TUTOR_EVENT));

// `aboveTabBar`: on phones the tab bar opens the chat, so the floating button
// is hidden there and the chat sits above the bar.
export default function StudyBuddy({ aboveTabBar = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);
  const appLanguage = getSavedLanguage();
  // The tutor explains in the app language by default; the selector in the
  // chat header can change it for this chat.
  const [language, setLanguage] = useState(appLanguage);
  const [messages, setMessages] = useState([{ role: 'assistant', kind: 'greeting' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const scrollRef = useRef(null);
  const privacyNote = usePrivacyNote(appLanguage);
  const { profile } = useTutorProfile();
  const tutorLine = useTutorLines(profile, language);
  const askLine = useTranslatedLines(ASK_LINES, language, { cacheKey: ASK_LINES_CACHE_KEY, handWritten: { es: ASK_LINES_ES } });
  const title = `Ask ${profile.name}`;

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

  // Scroll so the newest message starts in view (long answers are read from
  // the top, not the bottom).
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    const last = box.lastElementChild;
    if (last && last.offsetHeight > box.clientHeight - 24) {
      box.scrollTop = last.offsetTop - 12;
    } else {
      box.scrollTop = box.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  const decline = () => setMessages((prev) => [...prev, { role: 'assistant', kind: 'decline' }]);

  const handleSend = async (e) => {
    e.preventDefault();
    const typed = input.trim().slice(0, MAX_QUESTION_LENGTH);
    if (!typed || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: typed }]);

    // Safety net: clearly personal legal questions never reach the AI and
    // are not saved.
    if (looksPersonalLegal(typed)) {
      decline();
      return;
    }

    // Only the question goes to the AI: no email, no name.
    const question = redactIdentifiers(typed);
    const askedIn = language;
    setIsLoading(true);
    let answer = null;
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildAskPrompt(profile, languageNameFor(askedIn), question),
        response_json_schema: ASK_RESPONSE_SCHEMA,
      });
      const result = interpretAskResponse(res, askedIn);
      if (result.type === 'decline') {
        decline();
      } else if (result.type === 'answer') {
        answer = result;
        setMessages(prev => [...prev, { role: 'assistant', kind: 'answer', en: result.en, mine: result.mine, language: askedIn }]);
      } else {
        toast.error("Sorry, I couldn't answer that right now.");
      }
    } catch (error) {
      console.error("Ask tutor error:", error);
      toast.error("Sorry, I couldn't answer that right now.");
    } finally {
      setIsLoading(false);
    }

    // Save answered questions to History (learner-only).
    if (answer && user) {
      try {
        await base44.entities.AIStudyLog.create({
          user_email: user.email,
          question,
          answer: historyAnswerText(answer),
          language: askedIn,
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Could not save to History:", error);
      }
    }
  };

  useEffect(() => {
    const open = () => setIsOpen(true);
    window.addEventListener(OPEN_TUTOR_EVENT, open);
    return () => window.removeEventListener(OPEN_TUTOR_EVENT, open);
  }, []);

  if (!user) return null;

  const renderAssistant = (msg, i) => {
    if (msg.kind === 'greeting') {
      const intro = tutorLine('intro');
      const invite = askLine('invite');
      return (
        <TutorBubble
          key={i}
          profile={profile}
          language={language}
          expression="greeting"
          en={`${intro.en} ${ASK_LINES.invite}`}
          mine={intro.mine && invite ? `${intro.mine} ${invite}` : null}
        />
      );
    }
    if (msg.kind === 'decline') {
      const linkLabel = askLine('lawyerLink') || ASK_LINES.lawyerLink;
      return (
        <TutorBubble
          key={i}
          profile={profile}
          language={language}
          en={ASK_LINES.decline}
          mine={askLine('decline')}
          action={(
          <Link
            to="/lawyer-first"
            onClick={() => setIsOpen(false)}
            className="my-3 min-h-[44px] w-full rounded-2xl bg-pw-navy text-white hover:bg-pw-navy-deep px-4 py-2 text-base font-bold inline-flex items-center justify-center gap-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
          >
            <Scale className="w-5 h-5 shrink-0" aria-hidden="true" /> {linkLabel}
          </Link>
          )}
        />
      );
    }
    return <TutorBubble key={i} profile={profile} language={msg.language} en={msg.en} mine={msg.mine} />;
  };

  return (
    <div className={cn('fixed z-50 flex flex-col items-end pointer-events-none', aboveTabBar ? 'right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:right-6 lg:bottom-6' : 'right-6 bottom-6')}>
      {isOpen && (
        <Card
          role="dialog"
          aria-label={title}
          className={cn(
            'w-[calc(100vw-2rem)] max-w-[350px] h-[620px] shadow-lift border-pw-line overflow-hidden mb-4 pointer-events-auto flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300',
            aboveTabBar ? 'max-h-[calc(100dvh-11rem)] lg:max-h-[calc(100vh-7rem)]' : 'max-h-[calc(100vh-7rem)]'
          )}
        >
          <CardHeader className="bg-white text-pw-navy border-b border-pw-line p-3 flex flex-col gap-2 space-y-0 shrink-0">
            <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2 min-w-0">
                <TutorAvatar avatar={profile.avatar} size={36} />
                <CardTitle className="text-lg truncate">{title}</CardTitle>
                </div>
                <div className="flex items-center gap-1 shrink-0">
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
             <div className="relative h-full overflow-y-auto p-3 space-y-4" ref={scrollRef} aria-live="polite">
                {messages.map((msg, i) => (
                  msg.role === 'assistant' ? renderAssistant(msg, i) : (
                    <div key={i} className="flex gap-2 max-w-[85%] ml-auto flex-row-reverse">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-pw-soft text-pw-navy" aria-hidden="true">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="p-3 rounded-2xl rounded-tr-md text-base leading-snug bg-pw-navy text-white whitespace-pre-line break-words min-w-0">
                        {msg.content}
                      </div>
                    </div>
                  )
                ))}
                {isLoading && (
                  <div className="flex gap-2 items-start">
                    <TutorAvatar avatar={profile.avatar} size={28} className="mt-1" expression="listening" />
                    <div className="bg-white border border-pw-line p-3 rounded-2xl rounded-tl-md" role="status" aria-label="Thinking">
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
                maxLength={MAX_QUESTION_LENGTH}
                className="flex-1 min-w-0"
                aria-label="Ask a question..."
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} aria-label="Send" className="shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setTalkOpen(true)}
              className="w-full min-h-[44px] rounded-2xl text-pw-navy hover:bg-pw-soft text-base font-bold inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red"
            >
              <Users className="w-5 h-5" aria-hidden="true" /> Talk to a person
            </button>
          </CardFooter>
        </Card>
      )}

      <TalkToPerson open={talkOpen} onOpenChange={setTalkOpen} userEmail={user.email} language={appLanguage} />

      {/* The tutor's face, always one tap away. */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={title}
        aria-expanded={isOpen}
        className={cn(
          "h-14 rounded-full bg-pw-navy hover:bg-pw-navy-deep text-white shadow-lift pointer-events-auto transition-all duration-300 inline-flex items-center gap-2 pl-1.5 pr-5 font-bold text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2",
          isOpen ? "opacity-0 scale-0" : "opacity-100 scale-100",
          aboveTabBar && "hidden lg:inline-flex"
        )}
      >
        <TutorAvatar avatar={profile.avatar} size={44} decorative className="ring-2 ring-white" />
        <span className="max-w-[10rem] truncate">{title}</span>
      </button>

      {/* Close button that appears when open to allow closing if the card covers the toggle */}
      {isOpen && (
         <Button
            onClick={() => setIsOpen(false)}
            size="lg"
            className={cn("rounded-full h-14 w-14 p-0 [&_svg]:size-6 shadow-lift pointer-events-auto bg-pw-navy hover:bg-pw-navy-deep text-white absolute bottom-0 right-0", aboveTabBar && "hidden lg:inline-flex")}
            aria-label="Close"
          >
            <X className="w-7 h-7" />
          </Button>
      )}
    </div>
  );
}
