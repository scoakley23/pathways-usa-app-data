import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, Loader2, Languages, Scale } from 'lucide-react';
import { Eyebrow, ExplainSimplyButton, FormQuote, PillButton, Tag } from '@/components/pathways/ui';
import { speakText } from '@/components/utils/textToSpeech';
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import SayItBack from './SayItBack';
import useN400Translation from './useN400Translation';

// One N-400 question card (Phase 6): the form's wording word for word in a
// FormQuote, then "Explain it simply" revealing the plain meaning, words to
// know and officer phrasings from n400Content.js (verbatim), then Say it back
// and "Talk to a lawyer first". There is deliberately NO field for the learner
// to answer the question.
export default function N400QuestionCard({ sectionId, question, isAdmin, language }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [explained, setExplained] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const { translation, isTranslating } = useN400Translation(sectionId, question, language);

  const speak = (text) => {
    speakText(text, 'en', {
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
    });
  };

  const langName = LANGUAGES.find((l) => l.value === language)?.label || '';
  const sayItBackTargets = [
    { key: 'question', label: 'The whole question', text: question.official },
    ...question.words.map((w, i) => ({ key: `word-${i}`, label: w.word, text: w.word })),
  ];

  return (
    <article className="rounded-[14px] border border-pw-line bg-white p-4 sm:p-5 space-y-4 text-pw-navy shadow-raised">
      <div className="flex flex-wrap items-center gap-2">
        <Eyebrow>Item {question.label}</Eyebrow>
        {isAdmin && question.status === 'draft' && <Tag tone="red">Draft — pending review</Tag>}
      </div>

      <FormQuote item={question.label} className="bg-pw-page">{question.official}</FormQuote>

      <div className="flex flex-wrap gap-2">
        <PillButton onClick={() => speak(question.official)} aria-label="Listen to the question">
          {isPlaying ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Volume2 className="w-5 h-5" aria-hidden="true" />}
          <span aria-hidden="true">Listen</span>
        </PillButton>
        <ExplainSimplyButton aria-expanded={explained} onClick={() => setExplained((v) => !v)} />
        {language && language !== 'en' && (
          <PillButton aria-pressed={showTranslation} onClick={() => setShowTranslation((v) => !v)}>
            <Languages className="w-5 h-5" aria-hidden="true" /> In {langName}
          </PillButton>
        )}
      </div>

      {explained && (
        <div className="space-y-4 rounded-[10px] bg-pw-soft p-4">
          <div>
            <Eyebrow className="mb-1">What it means</Eyebrow>
            <p className="text-lg leading-relaxed">{question.meaning}</p>
          </div>
          {question.words.length > 0 && (
            <div>
              <Eyebrow className="mb-1">Words to know</Eyebrow>
              <dl className="space-y-2">
                {question.words.map((w) => (
                  <div key={w.word}>
                    <dt className="font-semibold">{w.word}</dt>
                    <dd className="text-base leading-relaxed">{w.definition}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {question.officerPhrasings.length > 0 && (
            <div>
              <Eyebrow className="mb-1">How the officer might ask</Eyebrow>
              <ul className="space-y-2">
                {question.officerPhrasings.map((p, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <p className="flex-1 font-display italic text-xl leading-snug">“{p}”</p>
                    <button
                      type="button"
                      aria-label="Listen to this phrasing"
                      onClick={() => speak(p)}
                      className="w-11 h-11 shrink-0 rounded-full bg-white text-pw-navy border border-pw-line hover:bg-pw-blue-soft grid place-items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
                    >
                      <Volume2 className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

        {showTranslation && language !== 'en' && (
          <div className="rounded-[10px] bg-pw-blue-soft p-4 space-y-3">
            <p className="text-sm italic text-pw-blue-ink">
              Machine translation. If anything is unclear, ask a person you trust or a lawyer.
            </p>
            {isTranslating ? (
              <p className="flex items-center gap-2 text-sm text-pw-muted">
                <Loader2 className="w-4 h-4 animate-spin" /> Translating…
              </p>
            ) : translation ? (
              <div className="space-y-3 text-base text-pw-navy">
                <p className="font-bold">{translation.official}</p>
                <p>{translation.meaning}</p>
                {translation.words?.length > 0 && (
                  <ul className="space-y-1">
                    {translation.words.map((w, i) => (
                      <li key={i}>
                        <span className="font-semibold">{w.word}</span> — {w.definition}
                      </li>
                    ))}
                  </ul>
                )}
                {translation.officerPhrasings?.length > 0 && (
                  <ul className="space-y-1 italic">
                    {translation.officerPhrasings.map((p, i) => (
                      <li key={i}>“{p}”</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-sm text-pw-muted">Translation unavailable.</p>
            )}
          </div>
        )}

        <SayItBack targets={sayItBackTargets} />

        <div className="border-t border-pw-line pt-4 space-y-3">
          <p className="text-base leading-relaxed">
            We explain what questions mean. How they apply to you is for a lawyer. If you are not sure your answer is “no,” talk to a lawyer before you file.
          </p>
          <Link
            to="/lawyer-first"
            className="min-h-[48px] rounded-xl border-2 border-pw-navy bg-white text-pw-navy font-semibold text-base inline-flex items-center gap-2 px-4 hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2"
          >
            <Scale className="w-5 h-5" aria-hidden="true" /> Talk to a lawyer first
          </Link>
          <p className="text-sm text-pw-muted">We never save your answers to the N-400.</p>
        </div>
    </article>
  );
}