import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Loader2, Volume2 } from 'lucide-react';
import { Card, Eyebrow, Tag } from '@/components/pathways/ui';
import { speakText } from '@/components/utils/textToSpeech';
import { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { practiceAnswer, PRACTICE_PERSON_LABEL } from '@/lib/practicePerson';
import SayItBack from './SayItBack';
import useN400Translation from './useN400Translation';

// One N-400 question card (frame R30N400Card): "On the form" (the form's
// wording, word for word), "Said in your language" (the plain meaning from
// n400Content.js; machine-translated for other languages, with a note),
// words to know, "The officer might say" with Listen, the practice person's
// answer (content/n400/practice-person.json, reviewed only; "practice person,
// not real"), the lawyer card, and Say it back. There is deliberately NO field
// for the learner to answer the question, and nothing is saved.
export default function N400QuestionCard({ sectionId, question, isAdmin, language }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { translation, isTranslating } = useN400Translation(sectionId, question, language);
  const practice = practiceAnswer(question.id, { isAdmin });
  const mine = language && language !== 'en';
  const dir = mine && RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';

  const speak = (text) => {
    speakText(text, 'en', {
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
    });
  };

  const sayItBackTargets = [
    ...(practice ? [{ key: 'practice', label: `${practice.name}'s answer`, text: practice.answer }] : []),
    { key: 'question', label: 'The whole question', text: question.official },
    ...question.words.map((w, i) => ({ key: `word-${i}`, label: w.word, text: w.word })),
  ];

  return (
    <article className="space-y-3 text-navy">
      {/* On the form, word for word */}
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow>On the form · item {question.label}</Eyebrow>
          {isAdmin && question.status === 'draft' && <Tag tone="red">Draft — pending review</Tag>}
        </div>
        <blockquote className="mt-2 text-[20px] font-bold leading-snug">{question.official}</blockquote>
        <button
          type="button"
          onClick={() => speak(question.official)}
          className="mt-2 -ms-2 min-h-tap inline-flex items-center gap-2 px-2 text-base font-semibold text-denim rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
        >
          {isPlaying ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Volume2 className="w-5 h-5" aria-hidden="true" />} Listen
        </button>
      </Card>

      {/* What it means, in the learner's language */}
      <Card>
        <span className="inline-block rounded-full bg-tint px-3 py-1 text-label uppercase text-navy">
          {mine ? 'Said in your language' : 'What it means'}
        </span>
        {mine ? (
          isTranslating ? (
            <p className="mt-3 flex items-center gap-2 text-base text-muted"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Translating…</p>
          ) : translation?.meaning ? (
            <>
              <p className="mt-3 text-base leading-relaxed" dir={dir} lang={language}>{translation.meaning}</p>
              <p className="mt-2 text-small text-muted">Machine translation. If anything is unclear, ask a person you trust or a lawyer.</p>
            </>
          ) : (
            <p className="mt-3 text-base leading-relaxed">{question.meaning}</p>
          )
        ) : (
          <p className="mt-3 text-base leading-relaxed">{question.meaning}</p>
        )}
        {mine && translation?.meaning && (
          <details className="mt-2">
            <summary className="min-h-tap flex items-center cursor-pointer text-small font-semibold text-denim">In English</summary>
            <p className="text-base leading-relaxed">{question.meaning}</p>
          </details>
        )}
        {mine && translation && (
          <details className="mt-1">
            <summary className="min-h-tap flex items-center cursor-pointer text-small font-semibold text-denim">The whole card in your language</summary>
            <div className="space-y-2 text-base" dir={dir} lang={language}>
              <p className="font-semibold">{translation.official}</p>
              {translation.words?.length > 0 && (
                <ul className="space-y-1">{translation.words.map((w, i) => <li key={i}><span className="font-semibold">{w.word}</span> — {w.definition}</li>)}</ul>
              )}
              {translation.officerPhrasings?.length > 0 && (
                <ul className="space-y-1">{translation.officerPhrasings.map((x, i) => <li key={i}>“{x}”</li>)}</ul>
              )}
            </div>
          </details>
        )}
        {question.words.length > 0 && (
          <details className="mt-2 group">
            <summary className="min-h-tap flex items-center gap-1 cursor-pointer text-small font-semibold text-denim">
              Words to know <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" aria-hidden="true" />
            </summary>
            <dl className="space-y-2">
              {question.words.map((w) => (
                <div key={w.word}>
                  <dt className="font-semibold">{w.word}</dt>
                  <dd className="text-base leading-relaxed">{w.definition}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </Card>

      {/* How the officer might say it */}
      {question.officerPhrasings.length > 0 && (
        <Card>
          <Eyebrow>The officer might say</Eyebrow>
          <ul className="mt-2 space-y-2">
            {question.officerPhrasings.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <button
                  type="button"
                  aria-label="Listen to this"
                  onClick={() => speak(p)}
                  className="w-11 h-11 -ms-2 shrink-0 rounded-full text-denim grid place-items-center hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
                >
                  <Volume2 className="w-5 h-5" aria-hidden="true" />
                </button>
                <p className="flex-1 pt-2 text-[17px] leading-snug">“{p}”</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* The practice person's answer (made up, reviewed content only) */}
      {practice && (
        <Card className="flex items-start gap-3">
          <span className="w-12 h-12 shrink-0 rounded-full bg-tint grid place-items-center text-lg font-bold" aria-hidden="true">
            {practice.name.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="text-small text-muted">
              {practice.name} · {PRACTICE_PERSON_LABEL}
              {practice.draft && <span className="ms-2 font-semibold text-not-yet">(draft, admins only)</span>}
            </p>
            <p className="mt-0.5 text-[17px] font-bold leading-snug">“{practice.answer}”</p>
          </div>
        </Card>
      )}

      {/* If "yes" might be true for you */}
      <Link
        to="/lawyer-first"
        className="block rounded-card border-2 border-not-yet bg-not-yet-bg p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-not-yet focus-visible:ring-offset-2"
      >
        <span className="text-base leading-snug text-navy">
          <strong className="text-not-yet">If “yes” might be true for you,</strong> talk to a lawyer first, before you file.{' '}
          <ArrowRight className="inline w-4 h-4 rtl:rotate-180" aria-hidden="true" />
        </span>
      </Link>

      <SayItBack targets={sayItBackTargets} />

      <p className="text-small text-muted">We explain what questions mean. How they apply to you is for a lawyer. We never save your answers to the N-400.</p>
    </article>
  );
}
