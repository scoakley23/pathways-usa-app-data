import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Send, Loader2, Globe, History, Users, Scale, Mic, MicOff, ChevronDown } from 'lucide-react';
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import { getSavedLanguage, RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { Chip, ViaMark } from '@/components/pathways/ui';
import { stopReading } from '@/components/persona/useAutoRead';
import { ListenButton } from '@/components/persona/TutorMessage';
import useTutorProfile from '@/components/persona/useTutorProfile';
import { getLearnerLocation } from '@/components/civics/useLearnerLocation';
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
import { loadCivicsBank } from '@/lib/civicsBank';
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

// The short line at the top of the conversation (The Road); "Read more"
// shows the full note above. Same translation and cache as the full note.
const PRIVACY_SHORT = {
  en: "Private: your tutor can't see this chat. Don't share your immigration status, A-number, case details, or address.",
  es: 'Privado: su tutor no puede ver esta conversación. No comparta su estatus migratorio, número A, detalles de su caso ni su dirección.',
};
const PRIVACY_SHORT_CACHE_KEY = 'pathways_sb_privacy_short_v1_';

function usePrivacyNote(language, texts = PRIVACY_NOTE, cacheKey = PRIVACY_NOTE_CACHE_KEY) {
  const [note, setNote] = useState(texts[language] || texts.en);

  useEffect(() => {
    if (texts[language]) {
      setNote(texts[language]);
      return;
    }
    setNote(texts.en);
    try {
      const cached = localStorage.getItem(cacheKey + language);
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
      prompt: `Translate this privacy note for an app that helps immigrants study for the U.S. citizenship test into ${langName}. Keep "A-number" understandable (you may add the local term). Return only the translated text.\n\n${texts.en}`,
    }).then((res) => {
      if (cancelled || typeof res !== 'string' || !res.trim()) return;
      setNote(res.trim());
      try {
        localStorage.setItem(cacheKey + language, res.trim());
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

// One assistant bubble (The Road): white with a thin border, on the left.
// It shows the chat language first; "In English" switches this bubble to the
// English version and back ("In Spanish"). Listen reads what is shown. An
// optional action (the lawyer link on a decline) sits under the text.
function TutorBubble({ profile, language, mine, en, action }) {
  const [english, setEnglish] = useState(false);
  const hasMine = !!mine && language !== 'en';
  const both = hasMine && !!en;
  const showEn = !hasMine || (both && english);
  const text = showEn ? (en || mine) : mine;
  const textLang = showEn && en ? 'en' : language;
  const dir = !showEn && RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  const otherName = english ? languageNameFor(language) : 'English';
  return (
    <div className="pe-8">
      <div className="min-w-0 px-4 py-3 rounded-card rounded-ss-md bg-white border border-card-line text-ink text-lg leading-snug">
        <p dir={dir} lang={textLang} className="whitespace-pre-line">{text}</p>
        {action && <div className="text-base">{action}</div>}
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        <ListenButton text={text} language={textLang} tutorName={profile.name} className="px-3 min-h-11 text-sm" />
        {both && (
          <Chip onClick={() => setEnglish((v) => !v)} aria-pressed={english} className="px-3 text-sm">
            <Globe className="w-4 h-4" aria-hidden="true" /> In {otherName}
          </Chip>
        )}
      </div>
    </div>
  );
}

// Other screens (the tab bar's tutor button) open the chat with this event.
export const OPEN_TUTOR_EVENT = 'pathways-open-tutor';
export const openTutorChat = () => window.dispatchEvent(new Event(OPEN_TUTOR_EVENT));

// The chat has no button of its own: the Vía tab (phones) and the Vía pill in
// the header (desktop) open it with openTutorChat(). It is a sheet: full
// screen on phones (with its own close button), a side drawer on desktop,
// with Vía's mark in its header.
export default function StudyBuddy() {
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
  const privacyShort = usePrivacyNote(appLanguage, PRIVACY_SHORT, PRIVACY_SHORT_CACHE_KEY);
  const [privacyMore, setPrivacyMore] = useState(false);
  // The microphone fills the text box (browser speech recognition, nothing
  // recorded); the learner reads it and sends it like typed text.
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const canDictate = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const { profile } = useTutorProfile();
  const tutorLine = useTutorLines(profile, language);
  const askLine = useTranslatedLines(ASK_LINES, language, { cacheKey: ASK_LINES_CACHE_KEY, handWritten: { es: ASK_LINES_ES } });

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
      // Officeholder names come only from the official list in the prompt
      // (src/data/officeholders.json), never from a web search, so internet
      // context stays off here. Only the saved state and district are
      // added, never an address or account details.
      const location = await getLearnerLocation();
      // The official 2025 civics list, loaded once and reused.
      const civics = await loadCivicsBank();
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildAskPrompt(profile, languageNameFor(askedIn), question, { location, civics }),
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

  const stopDictation = () => {
    try { recognitionRef.current?.stop(); } catch (e) { /* already stopped */ }
  };
  const startDictation = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    stopReading();
    const rec = new SR();
    rec.lang = language === 'en' ? 'en-US' : language;
    rec.continuous = false;
    rec.interimResults = true;
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0].transcript).join('');
      setInput(text.slice(0, MAX_QUESTION_LENGTH));
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    try { rec.start(); } catch (e) { setListening(false); }
  };
  // Stop listening when the chat closes.
  useEffect(() => { if (!isOpen) stopDictation(); }, [isOpen]);

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
            className="my-3 min-h-[44px] w-full rounded-2xl bg-pw-navy text-white hover:bg-pw-navy-deep px-4 py-2 text-base font-bold inline-flex items-center justify-center gap-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2"
          >
            <Scale className="w-5 h-5 shrink-0" aria-hidden="true" /> {linkLabel}
          </Link>
          )}
        />
      );
    }
    return <TutorBubble key={i} profile={profile} language={msg.language} en={msg.en} mine={msg.mine} />;
  };

  const sendable = !!input.trim() && !isLoading;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[420px] p-0 gap-0 flex flex-col bg-navy text-ink [&>button.absolute]:text-white [&>button.absolute]:hover:bg-navy-2 [&>button.absolute]:focus-visible:ring-white"
        >
          {/* NAVY TOP: who this is */}
          <div className="bg-navy text-white px-4 pt-4 pb-9 pe-16 shrink-0 space-y-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-12 h-12 shrink-0 rounded-full bg-cream grid place-items-center">
                <ViaMark size={40} label={`${profile.name} · AI tutor`} />
              </span>
              <div className="min-w-0 flex-1">
                <SheetTitle className="font-display text-[24px] leading-tight text-white truncate">{profile.name}</SheetTitle>
                <SheetDescription className="text-base text-on-navy-2 truncate">Your AI study partner</SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger
                  className="w-auto min-h-11 h-11 rounded-full bg-navy-2 border-navy-line text-white text-sm font-semibold gap-1.5 px-3 focus:ring-white focus:ring-offset-navy [&>svg]:text-white [&>svg]:opacity-100"
                  aria-label="Chat language"
                >
                  <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link
                to={createPageUrl('StudyHistory')}
                onClick={() => setIsOpen(false)}
                className="min-h-11 rounded-full bg-navy-2 px-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:bg-navy-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <History className="w-4 h-4" aria-hidden="true" /> History
              </Link>
            </div>
          </div>

          {/* CREAM SHEET: the conversation */}
          <div className="relative -mt-7 flex-1 min-h-0 flex flex-col rounded-t-sheet bg-cream">
            <div className="relative flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-3 space-y-4" ref={scrollRef} aria-live="polite">
              <div className="text-center">
                <p dir={RTL_LANGUAGES.includes(appLanguage) ? 'rtl' : 'ltr'} className="text-[13px] leading-snug text-ink-2">
                  {privacyShort}
                </p>
                <button
                  type="button"
                  onClick={() => setPrivacyMore((v) => !v)}
                  aria-expanded={privacyMore}
                  className="inline-flex items-center gap-0.5 min-h-11 px-2 text-[13px] font-semibold text-ink underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded"
                >
                  {privacyMore ? 'Show less' : 'Read more'}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${privacyMore ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {privacyMore && (
                  <p dir={RTL_LANGUAGES.includes(appLanguage) ? 'rtl' : 'ltr'} className="mt-1 text-sm leading-snug text-ink-2 text-start rounded-card bg-sand p-3">
                    {privacyNote}
                  </p>
                )}
              </div>
              {messages.map((msg, i) => (
                msg.role === 'assistant' ? renderAssistant(msg, i) : (
                  <div key={i} className="flex justify-end ps-10">
                    <div className="px-4 py-3 rounded-card rounded-se-md text-lg leading-snug bg-navy text-white whitespace-pre-line break-words min-w-0">
                      {msg.content}
                    </div>
                  </div>
                )
              ))}
              {isLoading && (
                <div className="flex">
                  <div className="bg-white border border-card-line px-4 py-3 rounded-card rounded-ss-md" role="status" aria-label="Thinking">
                    <Loader2 className="w-5 h-5 animate-spin text-ink-2" />
                  </div>
                </div>
              )}
            </div>

            {/* The text box, the one star-red button (mic, or Send once there is text), Talk to a person */}
            <div className="px-4 pt-2 shrink-0 flex flex-col gap-1 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <form onSubmit={handleSend} className="flex w-full items-center gap-2">
                <input
                  placeholder={listening ? 'Listening…' : 'Ask a question...'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={MAX_QUESTION_LENGTH}
                  className="flex-1 min-w-0 h-[54px] rounded-full border border-card-line bg-white px-5 text-base text-ink placeholder:text-ink-2 focus:outline-none focus:ring-2 focus:ring-navy"
                  aria-label="Ask a question"
                />
                {listening ? (
                  <button type="button" onClick={stopDictation} aria-label="Stop listening" className="w-[54px] h-[54px] shrink-0 rounded-full bg-star text-white grid place-items-center hover:bg-star-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
                    <MicOff className="w-6 h-6" aria-hidden="true" />
                  </button>
                ) : input.trim() || !canDictate ? (
                  <button type="submit" disabled={!sendable} aria-label="Send" className="w-[54px] h-[54px] shrink-0 rounded-full bg-star text-white grid place-items-center hover:bg-star-deep disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
                    <Send className="w-5 h-5 rtl:-scale-x-100" aria-hidden="true" />
                  </button>
                ) : (
                  <button type="button" onClick={startDictation} disabled={isLoading} aria-label="Say your question" className="w-[54px] h-[54px] shrink-0 rounded-full bg-star text-white grid place-items-center hover:bg-star-deep disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
                    <Mic className="w-6 h-6" aria-hidden="true" />
                  </button>
                )}
              </form>
              <button
                type="button"
                onClick={() => setTalkOpen(true)}
                className="self-center min-h-11 px-3 rounded-full text-ink text-base font-semibold inline-flex items-center gap-2 underline underline-offset-4 decoration-ink/40 hover:decoration-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              >
                <Users className="w-5 h-5" aria-hidden="true" /> Talk to a person
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <TalkToPerson open={talkOpen} onOpenChange={setTalkOpen} userEmail={user.email} language={appLanguage} />
    </>
  );
}
