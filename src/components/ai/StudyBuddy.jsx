import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, Globe, History, Loader2, Scale, Users, Volume2 } from 'lucide-react';
import { ai, isAiLimit } from '@/api/ai';
import { askHistory } from '@/api/askHistory';
import { lessonProgress as lessonProgressApi } from '@/api/lessons';
import { content } from '@/api/content';
import { auth } from '@/api/auth';
import { createPageUrl } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import { getSavedLanguage, RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { Button, Chip, MAIN_LINK } from '@/components/pathways/ui';
import MicButton from '@/components/pathways/MicButton';
import { Amio, AmioSays } from '@/components/pathways/Amio';
import { stopReading } from '@/components/persona/useAutoRead';
import { speakText } from '@/components/utils/textToSpeech';
import useTutorProfile from '@/components/persona/useTutorProfile';
import { getLearnerLocation } from '@/components/civics/useLearnerLocation';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import {
  ASK_LINES,
  ASK_LINES_ES,
  ASK_LINES_CACHE_KEY,
  ASK_SCREEN_LINES,
  ASK_SCREEN_LINES_ES,
  ASK_SCREEN_CACHE_KEY,
  MAX_QUESTION_LENGTH,
  historyAnswerText,
  interpretAskResponse,
  looksPersonalLegal,
  redactIdentifiers,
} from '@/lib/askTutor';
import { lessonSuggestions, STARTER_SUGGESTIONS, INTERVIEW_SUGGESTIONS } from '@/lib/askSuggestions';
import { preparedAnswer } from '@/lib/askAnswers';
import { loadCivicsBank } from '@/lib/civicsBank';
import TalkToPerson from './TalkToPerson';
import { PACK_ONLY, packText } from '@/lib/translationPack';
import { PRIVACY_NOTE, PRIVACY_SHORT } from './privacyStrings';

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

// Privacy note. English and Spanish are written by hand; other languages come
// from the translation pack (or, switch off only, are translated once by AI
// and cached on the device). Bump the cache key
// whenever the English text changes. ("Your teacher or class" = partner
// program staff, who never see these chats.)
const PRIVACY_NOTE_CACHE_KEY = 'pathways_sb_privacy_v5_';

// The short line on the screen; "Read more" shows the full note.
const PRIVACY_SHORT_CACHE_KEY = 'pathways_sb_privacy_short_v3_';

function usePrivacyNote(language, texts = PRIVACY_NOTE, cacheKey = PRIVACY_NOTE_CACHE_KEY) {
  const [note, setNote] = useState(texts[language] || texts.en);

  useEffect(() => {
    if (texts[language]) {
      setNote(texts[language]);
      return;
    }
    setNote(texts.en);
    let cancelled = false;

    // Live AI (switch off only), cached on the device.
    const translateLive = () => {
      try {
        const cached = localStorage.getItem(cacheKey + language);
        if (cached) { setNote(cached); return; }
      } catch (e) {
        // ignore
      }
      const langName = LANGUAGES.find((l) => l.value === language)?.label || language;
      ai.translate({
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
    };

    // The translation pack first; live AI only when it doesn't have the note,
    // and never when PACK_ONLY (the switch on).
    packText(language, texts.en).then((packed) => {
      if (cancelled) return;
      if (packed) setNote(packed);
      else if (!PACK_ONLY) translateLive();
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
    <div>
      {hasMine && !showEn && <p className="text-small font-semibold text-muted mb-1">{t('said_in_your_language')}</p>}
      <AmioSays mood={mood} size={56}>
        <span dir={dir} lang={textLang} className="block font-normal leading-relaxed whitespace-pre-line break-words">{text}</span>
      </AmioSays>
      <div className="min-w-0">
        {action && <div className="mt-2">{action}</div>}
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
      className="w-full min-h-[56px] rounded-card border-[1.5px] border-line bg-white px-4 py-3 text-start text-base font-semibold text-navy flex items-center gap-3 hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
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
  const [asked, setAsked] = useState(null); // { question, reply: { kind: 'answer'|'decline'|'error'|'limit', en, mine, language } | null }
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
          lessonProgressApi.list({ sort: '-last_attempt_date', limit: 20 }).catch(() => []),
          content.lessons({ limit: 300 }).catch(() => []),
        ]);
        if (active) setFromLessons(lessonSuggestions(progress, lessons));
      })
      .catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, []);

  // answerId: the suggestion tapped, so its pre-written answer is found in
  // any language.
  const ask = async (raw, { answerId = null } = {}) => {
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

    // A suggested question with a reviewed, pre-written answer in this
    // language (content/ask/answers.json): shown without asking the AI.
    try {
      const translations = Object.fromEntries([...STARTER_SUGGESTIONS, ...INTERVIEW_SUGGESTIONS].map((key) => [key, t(key)]));
      const prepared = await preparedAnswer({ id: answerId, text: typed, language: askedIn, translations });
      if (prepared) {
        answer = { type: 'answer', en: prepared.en, mine: prepared.mine };
        setAsked({ question: typed, reply: { kind: 'answer', en: prepared.en, mine: prepared.mine, language: askedIn } });
      }
    } catch (error) {
      answer = null; // fall back to asking the AI
    }

    if (!answer) {
      try {
        // Officeholder names come only from the official list in the prompt
        // (src/data/officeholders.json), never from a web search, so internet
        // context stays off here. Only the saved state and district are
        // added, never an address or account details. The instructions are
        // `ask` in src/lib/aiRequests.js; on Supabase the server builds them
        // and counts the daily limit (src/api/ai.js).
        const location = await getLearnerLocation();
        // The official 2025 civics list, loaded once and reused (on Base44;
        // the server has its own copy).
        const res = await ai.run('ask', {
          question,
          language: askedIn,
          tutor: { tone: profile?.tone, english_mix: profile?.english_mix },
          location: location ? { state: location.state, district: location.district } : null,
        }, { civics: loadCivicsBank });
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
        setAsked({ question: typed, reply: { kind: isAiLimit(error) ? 'limit' : 'error' } });
      }
    }

    // Save answered questions to History (learner-only).
    if (answer && user) {
      try {
        await askHistory.add({ question, answer: historyAnswerText(answer), language: askedIn });
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
    return <div className="min-h-[60vh] grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-navy" aria-label={t('loading')} /></div>;
  }
  if (user === null) {
    return (
      <div dir={dir} className="min-h-full bg-paper text-navy">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-8 flex flex-col gap-4">
          <h1 className="font-display text-[1.75rem] leading-tight" dir="auto">{t('title')}</h1>
          <AmioSays mood="wave">{t('sign_in_line')}</AmioSays>
          <Button variant="main" className="w-full" onClick={() => auth.goToSignIn()}>{t('sign_in')}</Button>
        </div>
      </div>
    );
  }

  const reply = asked?.reply;
  return (
    <div dir={dir} className="min-h-full bg-paper text-navy">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-10 space-y-5">
        <div className="flex items-start gap-2">
          <button type="button" onClick={back} aria-label={t('back')} className="w-11 h-11 shrink-0 -ms-2 grid place-items-center rounded-full text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
            <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1 pt-1">
            <h1 className="font-display text-[1.75rem] leading-tight" dir="auto">{t('title')}</h1>
            <p className="text-base text-muted" dir="auto">{t('subtitle')}</p>
          </div>
          <Link
            to={createPageUrl('StudyHistory')}
            className="shrink-0 min-h-11 rounded-button border-[1.5px] border-line bg-white px-3 inline-flex items-center gap-1.5 text-small font-semibold text-navy hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
          >
            <History className="w-4 h-4" aria-hidden="true" /> <span dir="auto">{t('history')}</span>
          </Link>
        </div>

        {/* Privacy, wherever learners can talk to Amio */}
        <div className="text-center">
          <p className="text-small leading-snug text-muted" dir="auto">{privacyShort}</p>
          <button
            type="button"
            onClick={() => setPrivacyMore((v) => !v)}
            aria-expanded={privacyMore}
            className="inline-flex items-center gap-0.5 min-h-11 px-2 text-small font-semibold text-navy underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded"
          >
            {privacyMore ? t('show_less') : t('read_more')}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${privacyMore ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {privacyMore && <p className="mt-1 text-small leading-snug text-muted text-start rounded-card bg-white border border-line p-3" dir="auto">{privacyNote}</p>}
        </div>

        {asked ? (
          <>
            {/* The one question, and Amio's one reply */}
            <div className="flex justify-end ps-10">
              <div className="min-w-0">
                <p className="text-small font-semibold text-muted text-end mb-1" dir="auto">{t('you_asked')}</p>
                <p className="rounded-card rounded-se-[4px] bg-navy text-white px-4 py-3 text-base leading-snug break-words" dir="auto">{asked.question}</p>
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
                      className={`mt-3 w-full px-4 gap-2 text-base text-center ${MAIN_LINK}`}
                    >
                      <Scale className="w-5 h-5 shrink-0" aria-hidden="true" /> {askLine('lawyerLink') || ASK_LINES.lawyerLink}
                    </Link>
                  )}
                />
              )}
              {reply?.kind === 'error' && <AmioSays mood="kind">{t('no_answer')}</AmioSays>}
              {reply?.kind === 'limit' && <AmioSays mood="kind">{t('ai_limit')}</AmioSays>}
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
              <h2 className="text-lg font-bold" dir="auto">{suggestionsFromLessons ? t('from_lessons') : t('to_start')}</h2>
              {suggestionsFromLessons
                ? fromLessons.map((q) => <Suggestion key={q} lang="en" onClick={() => ask(q)}>{q}</Suggestion>)
                : starters.map((key) => <Suggestion key={key} onClick={() => ask(t(key), { answerId: key })}>{t(key)}</Suggestion>)}
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold" dir="auto">{t('about_interview')}</h2>
              {INTERVIEW_SUGGESTIONS.map((key) => <Suggestion key={key} onClick={() => ask(t(key), { answerId: key })}>{t(key)}</Suggestion>)}
            </section>

            <p className="text-small text-muted" dir="auto">{t('own_case')}</p>

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
              <SelectTrigger className="w-auto min-h-11 h-11 rounded-button bg-white border-line text-navy text-small font-semibold gap-1.5 px-3" aria-label={t('chat_language')}>
                <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
                <SelectValue placeholder={t('language')} />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={() => setTalkOpen(true)}
            className="min-h-11 px-1 text-denim text-base font-semibold inline-flex items-center gap-2 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded"
          >
            <Users className="w-5 h-5" aria-hidden="true" /> {t('talk_to_person')}
          </button>
        </div>
      </div>

      <TalkToPerson open={talkOpen} onOpenChange={setTalkOpen} userEmail={user.email} language={appLanguage} />
    </div>
  );
}
