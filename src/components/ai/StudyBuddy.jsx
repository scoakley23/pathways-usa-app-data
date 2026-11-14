import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Globe, History, Loader2, Scale, Users, Volume2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { auth } from '@/api/auth';
import { createPageUrl } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import { getSavedLanguage, RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { Button, Chip, Eyebrow } from '@/components/pathways/ui';
import NavyBanner from '@/components/pathways/NavyBanner';
import MicButton from '@/components/pathways/MicButton';
import { Amio, AmioSays } from '@/components/pathways/Amio';
import { stopReading } from '@/components/persona/useAutoRead';
import { speakText } from '@/components/utils/textToSpeech';
import useTutorProfile from '@/components/persona/useTutorProfile';
import { getLearnerLocation } from '@/components/civics/useLearnerLocation';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import { languageNameFor } from '@/components/persona/languageName';
import {
  ASK_LINES,
  ASK_LINES_ES,
  ASK_LINES_CACHE_KEY,
  ASK_RESPONSE_SCHEMA,
  ASK_SCREEN_LINES,
  ASK_SCREEN_LINES_ES,
  ASK_SCREEN_CACHE_KEY,
  MAX_QUESTION_LENGTH,
  buildAskPrompt,
  historyAnswerText,
  interpretAskResponse,
  looksPersonalLegal,
  redactIdentifiers,
} from '@/lib/askTutor';
import { lessonSuggestions, STARTER_SUGGESTIONS, INTERVIEW_SUGGESTIONS } from '@/lib/askSuggestions';
import { loadCivicsBank } from '@/lib/civicsBank';
import TalkToPerson from './TalkToPerson';

// "Ask Amio" (frame R30AskAmio), a screen under Me (/ask). No open chat box
// (rule 1): the learner taps a suggested question (from their recent
// lessons, or about the interview), asks out loud with the big mic (the
// browser turns speech into text; nothing is recorded), or uses the small
// "Type instead" link. Amio answers the one question in a short reply with
// "Hear it" and a language switch; past questions are in History. It is not
// a chat log: "Ask another question" goes back to the suggestions.
// Questions about the learner's own case or eligibility get a fixed, kind
// decline and a link to "Talk to a lawyer first", caught by a local keyword
// check (no AI call) or by the AI's is_personal_legal flag. Declined
// questions are not saved. Answered ones are saved to AIStudyLog
// (learner-only), exactly as before.

// Privacy note. English and Spanish are written by hand; other languages are
// translated once by AI and cached on the device. Bump the cache key
// whenever the English text changes. ("Your teacher or class" = partner
// program staff, who never see these chats.)
const PRIVACY_NOTE = {
  en: "Your questions to Amio are private. Your teacher or class can't see them. Don't share your immigration status, A-number, case details, or address. Your questions are saved to your account so you can see them in History.",
  es: 'Sus preguntas a Amio son privadas. Su maestro o su clase no pueden verlas. No comparta su estatus migratorio, número A, detalles de su caso ni su dirección. Sus preguntas se guardan en su cuenta para que pueda verlas en el Historial.',
};
const PRIVACY_NOTE_CACHE_KEY = 'pathways_sb_privacy_v5_';

// The short line on the screen; "Read more" shows the full note.
const PRIVACY_SHORT = {
  en: "Private: your teacher or class can't see this. Don't share your immigration status, A-number, case details, or address.",
  es: 'Privado: su maestro o su clase no pueden verlo. No comparta su estatus migratorio, número A, detalles de su caso ni su dirección.',
};
const PRIVACY_SHORT_CACHE_KEY = 'pathways_sb_privacy_short_v3_';

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

// Amio's reply: Amio and a white bubble with a 2px red border. It shows the
// chat language first ("Said in your language"); the chip switches this
// reply to English and back. "Hear it" reads what is shown.
function AmioReply({ mine, en, language, t, action, mood = 'happy' }) {
  const [english, setEnglish] = useState(false);
  const hasMine = !!mine && language !== 'en';
  const both = hasMine && !!en;
  const showEn = !hasMine || (both && english);
  const text = showEn ? (en || mine) : mine;
  const textLang = showEn && en ? 'en' : language;
  const dir = !showEn && RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  return (
    <div className="flex items-start gap-2.5">
      <Amio mood={mood} size={56} className="mt-1" />
      <div className="min-w-0 flex-1">
        {hasMine && !showEn && <p className="text-small font-semibold text-muted mb-1">{t('said_in_your_language')}</p>}
        <div className="rounded-card rounded-ss-[4px] border-2 border-red bg-white px-4 py-3 text-navy">
          <p dir={dir} lang={textLang} className="text-base leading-relaxed whitespace-pre-line break-words">{text}</p>
          {action}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Chip onClick={() => { stopReading(); speakText(text, textLang); }}>
            <Volume2 className="w-4 h-4" aria-hidden="true" /> {t('hear_it')}
          </Chip>
          {both && (
            <Chip onClick={() => setEnglish((v) => !v)} aria-pressed={english}>
              <Globe className="w-4 h-4" aria-hidden="true" /> {english ? t('in_my_language') : t('in_english')}
            </Chip>
          )}
        </div>
      </div>
    </div>
  );
}

// One tappable suggested question: a white card with a line border.
function Suggestion({ children, onClick, lang }) {
  return (
    <button
      type="button"
      onClick={onClick}
      lang={lang}
      dir="auto"
      className="w-full min-h-[56px] rounded-card border border-line bg-white px-4 py-3 text-start text-base font-semibold text-navy flex items-center gap-3 hover:border-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
    >
      <span className="flex-1 min-w-0">{children}</span>
      <ChevronRight className="w-5 h-5 shrink-0 text-muted rtl:rotate-180" aria-hidden="true" />
    </button>
  );
}

export default function StudyBuddy() {
  const navigate = useNavigate();
  const [talkOpen, setTalkOpen] = useState(false);
  const appLanguage = getSavedLanguage();
  // Amio explains in the app language by default; "Amio explains in" can
  // change it for this screen.
  const [language, setLanguage] = useState(appLanguage);
  const [asked, setAsked] = useState(null); // { question, reply: { kind: 'answer'|'decline'|'error', en, mine, language } | null }
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState('');
  const [heard, setHeard] = useState('');
  const [listening, setListening] = useState(false);
  const [user, setUser] = useState(undefined);
  const [fromLessons, setFromLessons] = useState([]);
  const recognitionRef = useRef(null);
  const heardRef = useRef('');
  const canDictate = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const privacyNote = usePrivacyNote(appLanguage);
  const privacyShort = usePrivacyNote(appLanguage, PRIVACY_SHORT, PRIVACY_SHORT_CACHE_KEY);
  const [privacyMore, setPrivacyMore] = useState(false);
  const { profile } = useTutorProfile();
  const askLine = useTranslatedLines(ASK_LINES, language, { cacheKey: ASK_LINES_CACHE_KEY, handWritten: { es: ASK_LINES_ES } });
  const screenLine = useTranslatedLines(ASK_SCREEN_LINES, appLanguage, { cacheKey: ASK_SCREEN_CACHE_KEY, handWritten: { es: ASK_SCREEN_LINES_ES } });
  const t = (key) => (appLanguage !== 'en' && screenLine(key)) || ASK_SCREEN_LINES[key];
  const dir = RTL_LANGUAGES.includes(appLanguage) ? 'rtl' : 'ltr';

  useEffect(() => {
    let active = true;
    auth.me()
      .then(async (u) => {
        if (!active) return;
        setUser(u);
        // Suggestions from the learner's 2 most recent lessons: their own
        // lesson progress (owner-only) and the lessons' reviewed key points.
        const email = u.email.toLowerCase().trim();
        const [progress, lessons] = await Promise.all([
          base44.entities.LessonProgress.filter({ user_email: email }, '-last_attempt_date', 20).catch(() => []),
          base44.entities.Lesson.list(null, 300).catch(() => []),
        ]);
        if (active) setFromLessons(lessonSuggestions(progress, lessons));
      })
      .catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, []);

  const ask = async (raw) => {
    const typed = String(raw || '').trim().slice(0, MAX_QUESTION_LENGTH);
    if (!typed || asked?.loading) return;
    stopReading();
    setTyping(false);
    setInput('');
    window.scrollTo({ top: 0 });

    // Safety net: clearly personal legal questions never reach the AI and
    // are not saved.
    if (looksPersonalLegal(typed)) {
      setAsked({ question: typed, reply: { kind: 'decline' } });
      return;
    }

    // Only the question goes to the AI: no email, no name.
    const question = redactIdentifiers(typed);
    const askedIn = language;
    setAsked({ question: typed, reply: null, loading: true });
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
        setAsked({ question: typed, reply: { kind: 'decline' } });
      } else if (result.type === 'answer') {
        answer = result;
        setAsked({ question: typed, reply: { kind: 'answer', en: result.en, mine: result.mine, language: askedIn } });
      } else {
        setAsked({ question: typed, reply: { kind: 'error' } });
      }
    } catch (error) {
      console.error('Ask Amio error:', error);
      setAsked({ question: typed, reply: { kind: 'error' } });
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
        console.error('Could not save to History:', error);
      }
    }
  };

  // Asking out loud: the browser turns speech into text in Amio's language
  // (nothing is recorded); when the learner stops, the words are asked.
  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch (e) { /* already stopped */ }
  };
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setTyping(true); return; }
    stopReading();
    const rec = new SR();
    rec.lang = language === 'en' ? 'en-US' : language;
    rec.continuous = false;
    rec.interimResults = true;
    heardRef.current = '';
    setHeard('');
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      const text = Array.from(e.results).map((r) => r[0].transcript).join('').slice(0, MAX_QUESTION_LENGTH);
      heardRef.current = text;
      setHeard(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      const words = heardRef.current.trim();
      heardRef.current = '';
      setHeard('');
      if (words) ask(words);
    };
    recognitionRef.current = rec;
    try { rec.start(); } catch (e) { setListening(false); }
  };
  // Stop listening when leaving the screen.
  useEffect(() => () => stopListening(), []);

  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/me'));
  const suggestionsFromLessons = fromLessons.length > 0;
  const starters = STARTER_SUGGESTIONS;

  if (user === undefined) {
    return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-navy" aria-label="Loading" /></div>;
  }
  if (user === null) {
    return (
      <div>
        <NavyBanner title={t('title')} subtitle={t('subtitle')} />
        <div className="max-w-lg mx-auto px-4 py-8 text-center space-y-4">
          <AmioSays mood="wave">Sign in to ask me questions.</AmioSays>
          <Button variant="main" className="w-full" onClick={() => auth.goToSignIn()}>Sign in</Button>
        </div>
      </div>
    );
  }

  const reply = asked?.reply;
  return (
    <div dir={dir}>
      <NavyBanner
        title={t('title')}
        subtitle={t('subtitle')}
        left={(
          <button type="button" onClick={back} aria-label="Back" className="w-11 h-11 grid place-items-center rounded-full text-white hover:bg-chip-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
          </button>
        )}
        right={(
          <Link
            to={createPageUrl('StudyHistory')}
            className="min-h-11 rounded-full bg-chip-navy px-4 inline-flex items-center gap-1.5 text-small font-semibold text-white hover:bg-navy-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <History className="w-4 h-4" aria-hidden="true" /> {t('history')}
          </Link>
        )}
      />

      <div className="max-w-lg mx-auto px-4 pt-5 pb-10 space-y-5">
        {/* Privacy, wherever learners can talk to Amio */}
        <div className="text-center">
          <p className="text-small leading-snug text-muted">{privacyShort}</p>
          <button
            type="button"
            onClick={() => setPrivacyMore((v) => !v)}
            aria-expanded={privacyMore}
            className="inline-flex items-center gap-0.5 min-h-11 px-2 text-small font-semibold text-navy underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded"
          >
            {privacyMore ? 'Show less' : 'Read more'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${privacyMore ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {privacyMore && <p className="mt-1 text-small leading-snug text-muted text-start rounded-card bg-tint p-3">{privacyNote}</p>}
        </div>

        {asked ? (
          <>
            {/* The one question, and Amio's one reply */}
            <div className="flex justify-end ps-10">
              <div className="min-w-0">
                <p className="text-small font-semibold text-muted text-end mb-1">{t('you_asked')}</p>
                <p className="rounded-card rounded-se-[4px] bg-denim text-white px-4 py-3 text-base leading-snug break-words">{asked.question}</p>
              </div>
            </div>
            <div aria-live="polite">
              {asked.loading && (
                <div className="flex items-center gap-3" role="status">
                  <Amio mood="listen" size={56} />
                  <Loader2 className="w-6 h-6 animate-spin text-muted" aria-hidden="true" />
                  <span className="sr-only">{t('thinking')}</span>
                </div>
              )}
              {reply?.kind === 'answer' && <AmioReply en={reply.en} mine={reply.mine} language={reply.language} t={t} />}
              {reply?.kind === 'decline' && (
                <AmioReply
                  mood="kind"
                  en={ASK_LINES.decline}
                  mine={askLine('decline')}
                  language={language}
                  t={t}
                  action={(
                    <Link
                      to="/lawyer-first"
                      className="mt-3 min-h-[48px] w-full rounded-button bg-denim text-white hover:bg-denim-deep px-4 py-2 text-base font-bold inline-flex items-center justify-center gap-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                    >
                      <Scale className="w-5 h-5 shrink-0" aria-hidden="true" /> {askLine('lawyerLink') || ASK_LINES.lawyerLink}
                    </Link>
                  )}
                />
              )}
              {reply?.kind === 'error' && <AmioSays mood="kind">{t('no_answer')}</AmioSays>}
            </div>
            {!asked.loading && (
              <Button variant="second" className="w-full" onClick={() => { setAsked(null); window.scrollTo({ top: 0 }); }}>
                {t('ask_another')}
              </Button>
            )}
          </>
        ) : (
          <>
            <AmioSays mood="curious" size={72}>{t('prompt')}</AmioSays>

            <section className="space-y-2">
              <Eyebrow>{suggestionsFromLessons ? t('from_lessons') : t('to_start')}</Eyebrow>
              {suggestionsFromLessons
                ? fromLessons.map((q) => <Suggestion key={q} lang="en" onClick={() => ask(q)}>{q}</Suggestion>)
                : starters.map((key) => <Suggestion key={key} onClick={() => ask(t(key))}>{t(key)}</Suggestion>)}
            </section>

            <section className="space-y-2">
              <Eyebrow>{t('about_interview')}</Eyebrow>
              {INTERVIEW_SUGGESTIONS.map((key) => <Suggestion key={key} onClick={() => ask(t(key))}>{t(key)}</Suggestion>)}
            </section>

            <p className="text-small text-muted">{t('own_case')}</p>

            {/* Ask out loud (the biggest button), or type instead */}
            <div className="pt-2 space-y-3">
              {listening && heard && <p className="text-center text-base text-navy" aria-live="polite">“{heard}”</p>}
              {canDictate && (
                <MicButton
                  listening={listening}
                  onStart={startListening}
                  onStop={stopListening}
                  label={t('ask_out_loud')}
                  listeningLabel={t('listening')}
                  onTypeInstead={typing ? undefined : () => setTyping(true)}
                  typeInsteadLabel={t('type_instead')}
                />
              )}
              {(typing || !canDictate) && (
                <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="space-y-2">
                  <label htmlFor="ask-amio-type" className="block text-small font-semibold text-navy">{t('type_label')}</label>
                  <div className="flex items-center gap-2">
                    <input
                      id="ask-amio-type"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      maxLength={MAX_QUESTION_LENGTH}
                      autoFocus={canDictate}
                      className="flex-1 min-w-0 h-[52px] rounded-button border border-line bg-white px-4 text-base text-navy focus:outline-none focus:ring-2 focus:ring-denim"
                    />
                    <Button variant="second" type="submit" disabled={!input.trim()} className="shrink-0 min-h-[52px] px-5">{t('send')}</Button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}

        {/* Amio's language, and Talk to a person */}
        <div className="pt-4 border-t border-line space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-small font-semibold text-muted">{t('chat_language')}</span>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-auto min-h-11 h-11 rounded-full bg-white border-line text-navy text-small font-semibold gap-1.5 px-3" aria-label="Amio explains in">
                <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={() => setTalkOpen(true)}
            className="min-h-11 px-1 text-navy text-base font-semibold inline-flex items-center gap-2 underline underline-offset-4 decoration-navy/40 hover:decoration-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded"
          >
            <Users className="w-5 h-5" aria-hidden="true" /> {t('talk_to_person')}
          </button>
        </div>
      </div>

      <TalkToPerson open={talkOpen} onOpenChange={setTalkOpen} userEmail={user.email} language={appLanguage} />
    </div>
  );
}
