import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, Loader2, Languages, Scale } from 'lucide-react';
import { Chip, Eyebrow, ExplainSimplyButton, Tag } from '@/components/pathways/ui';
import { speakText } from '@/components/utils/textToSpeech';
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import SayItBack from './SayItBack';
import useN400Translation from './useN400Translation';

// One N-400 question card (The Road): on navy, the form's wording word for
// word ("Item n · On the form · word for word", "— Form N-400, item n"),
// Listen and the translation chip; on cream, "Explain it simply" revealing
// the plain meaning, words to know and officer phrasings from n400Content.js
// (verbatim), the machine-translation note, Say it back, and the
// not-legal-advice line with "Talk to a lawyer first", unchanged. There is deliberately NO field for the learner
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
    <article className="rounded-card overflow-hidden border border-card-line bg-white text-ink">
      {/* NAVY: the form's question, word for word */}
      <div className="bg-navy text-white p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-label uppercase text-on-navy-label">Item {question.label} · On the form · word for word</p>
          {isAdmin && question.status === 'draft' && <Tag tone="red">Draft — pending review</Tag>}
        </div>
        <blockquote className="text-xl sm:text-[22px] font-medium leading-snug">{question.official}</blockquote>
        <p className="text-base text-on-navy-2">— Form N-400, item {question.label}</p>
        <div className="flex flex-wrap gap-2">
          <Chip onNavy onClick={() => speak(question.official)} aria-label="Listen to the question">
            {isPlaying ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Volume2 className="w-5 h-5" aria-hidden="true" />}
            <span aria-hidden="true">Listen</span>
          </Chip>
          {language && language !== 'en' && (
            <Chip onNavy aria-pressed={showTranslation} onClick={() => setShowTranslation((v) => !v)}>
              <Languages className="w-5 h-5" aria-hidden="true" /> In {langName}
            </Chip>
          )}
        </div>
      </div>

      {/* CREAM: what it means, words, the officer's phrasings, Say it back */}
      <div className="bg-cream p-4 sm:p-5 space-y-4">
        <ExplainSimplyButton aria-expanded={explained} onClick={() => setExplained((v) => !v)} />

        {explained && (
          <div className="space-y-4 rounded-card bg-white border border-card-line p-4">
            <div>
              <Eyebrow className="mb-1">What this question means</Eyebrow>
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
                <Eyebrow className="mb-1">How the officer might say it</Eyebrow>
                <ul className="space-y-2">
                  {question.officerPhrasings.map((p, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <p className="flex-1 font-medium text-xl leading-snug">“{p}”</p>
                      <button
                        type="button"
                        aria-label="Listen to this phrasing"
                        onClick={() => speak(p)}
                        className="w-11 h-11 shrink-0 rounded-full bg-sand text-ink hover:bg-sand-hover grid place-items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
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
          <div className="rounded-card bg-white border border-card-line p-4 space-y-3">
            <p className="text-sm text-ink-2">
              Machine translation. If anything is unclear, ask a person you trust or a lawyer.
            </p>
            {isTranslating ? (
              <p className="flex items-center gap-2 text-sm text-ink-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Translating…
              </p>
            ) : translation ? (
              <div className="space-y-3 text-base text-ink">
                <p className="font-semibold">{translation.official}</p>
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
                  <ul className="space-y-1">
                    {translation.officerPhrasings.map((p, i) => (
                      <li key={i}>“{p}”</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink-2">Translation unavailable.</p>
            )}
          </div>
        )}

        <SayItBack targets={sayItBackTargets} />

        <div className="border-t border-card-line pt-4 space-y-3">
          <p className="text-base leading-relaxed">
            We explain what questions mean. How they apply to you is for a lawyer. If you are not sure your answer is “no,” talk to a lawyer before you file.
          </p>
          <Link
            to="/lawyer-first"
            className="min-h-tap rounded-full border-2 border-navy text-ink font-semibold text-base inline-flex items-center gap-2 px-5 hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
          >
            <Scale className="w-5 h-5" aria-hidden="true" /> Talk to a lawyer first
          </Link>
          <p className="text-sm text-ink-2">We never save your answers to the N-400.</p>
        </div>
      </div>
    </article>
  );
}
