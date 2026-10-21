import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, Loader2, Lightbulb, BookOpen, HelpCircle, Languages } from 'lucide-react';
import { Tag, PillButton } from '@/components/pathways/ui';
import { speakText } from '@/components/utils/textToSpeech';
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import SayItBack from './SayItBack';
import useN400Translation from './useN400Translation';

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[44px] px-4 py-2 rounded-full text-base leading-tight text-left font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2 ${
        active
          ? 'bg-pw-navy text-white border-pw-navy'
          : 'bg-white text-pw-navy border-pw-line hover:bg-pw-soft'
      }`}
    >
      {children}
    </button>
  );
}

// One N-400 question card. Everything is revealed by tapping: what the
// question means, key words, and officer phrasings all start collapsed, so
// the learner sees the question first and explores on demand. There is
// deliberately NO field for the learner to answer the question.
export default function N400QuestionCard({ sectionId, question, isAdmin, language }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showWords, setShowWords] = useState(false);
  const [showPhrasings, setShowPhrasings] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [openWord, setOpenWord] = useState(null);
  const [activePhrase, setActivePhrase] = useState(null);
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
    <div className="rounded-2xl border border-pw-line bg-white p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone="blue">Item {question.label}</Tag>
          {isAdmin && question.status === 'draft' && <Tag tone="red">Draft — pending review</Tag>}
        </div>

        <blockquote className="text-lg sm:text-xl font-extrabold text-pw-navy leading-snug">
          {question.official}
        </blockquote>
        <PillButton
          onClick={() => speak(question.official)}
          aria-label="Listen to the question"
          className="bg-pw-blue-soft text-pw-blue-ink hover:bg-pw-blue-soft/70"
        >
          {isPlaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
          <span aria-hidden="true">Listen</span>
        </PillButton>

        <div className="flex flex-wrap gap-2">
          <Chip active={showMeaning} onClick={() => setShowMeaning(!showMeaning)}>
            <span className="flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4" /> What it means
            </span>
          </Chip>
          <Chip active={showWords} onClick={() => setShowWords(!showWords)}>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> Words to know ({question.words.length})
            </span>
          </Chip>
          <Chip active={showPhrasings} onClick={() => setShowPhrasings(!showPhrasings)}>
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" /> How the officer might ask ({question.officerPhrasings.length})
            </span>
          </Chip>
          {language && language !== 'en' && (
            <Chip active={showTranslation} onClick={() => setShowTranslation(!showTranslation)}>
              <span className="flex items-center gap-1.5">
                <Languages className="w-4 h-4" /> In {langName}
              </span>
            </Chip>
          )}
        </div>

        {showMeaning && (
          <p className="rounded-2xl bg-pw-soft px-4 py-3 text-base text-pw-navy leading-relaxed">{question.meaning}</p>
        )}

        {showWords && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {question.words.map((w, i) => (
                <Chip key={w.word} active={openWord === i} onClick={() => setOpenWord(openWord === i ? null : i)}>
                  {w.word}
                </Chip>
              ))}
            </div>
            {openWord !== null && question.words[openWord] && (
              <p className="rounded-2xl bg-pw-soft px-4 py-3 text-base text-pw-navy leading-relaxed">
                <span className="font-bold">{question.words[openWord].word}</span> —{' '}
                {question.words[openWord].definition}
              </p>
            )}
          </div>
        )}

        {showPhrasings && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {question.officerPhrasings.map((p, i) => (
                <Chip key={i} active={activePhrase === i} onClick={() => setActivePhrase(activePhrase === i ? null : i)}>
                  Way {i + 1}
                </Chip>
              ))}
            </div>
            {activePhrase !== null && question.officerPhrasings[activePhrase] && (
              <div className="flex items-center gap-3 rounded-2xl bg-pw-soft px-4 py-3">
                <p className="text-base text-pw-navy italic flex-1">“{question.officerPhrasings[activePhrase]}”</p>
                <button
                  type="button"
                  aria-label="Listen to this phrasing"
                  onClick={() => speak(question.officerPhrasings[activePhrase])}
                  className="w-11 h-11 shrink-0 rounded-full bg-white text-pw-navy border border-pw-line hover:bg-pw-blue-soft grid place-items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {showTranslation && language !== 'en' && (
          <div className="rounded-2xl bg-pw-blue-soft p-4 space-y-3">
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

        <p className="border-t border-pw-line pt-3 text-sm leading-relaxed text-pw-muted">
          This explains what the question means. It is not legal advice about how you should answer. If you are
          not sure your answer is “no,”{' '}
          <Link to="/lawyer-first" className="underline font-bold text-pw-navy">
            talk to a lawyer before you file
          </Link>
          .
        </p>
    </div>
  );
}