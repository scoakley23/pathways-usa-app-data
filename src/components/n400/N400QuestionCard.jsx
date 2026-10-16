import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, Loader2, Lightbulb, BookOpen, HelpCircle, Languages } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { speakText } from '@/components/utils/textToSpeech';
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import SayItBack from './SayItBack';
import useN400Translation from './useN400Translation';

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
        active
          ? 'bg-[#1F3A6B] text-white border-[#1F3A6B]'
          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
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
    <Card className="rounded-2xl">
      <CardContent className="p-5 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-[#1F3A6B]">Item {question.label}</Badge>
          {isAdmin && question.status === 'draft' && (
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
              Draft — pending review
            </Badge>
          )}
        </div>

        <div className="flex items-start justify-between gap-4">
          <blockquote className="text-base md:text-lg font-semibold text-slate-800 border-l-4 border-slate-300 pl-4 leading-relaxed">
            {question.official}
          </blockquote>
          <Button
            variant="outline"
            size="icon"
            onClick={() => speak(question.official)}
            aria-label="Listen to the question"
            className="rounded-full w-11 h-11 shrink-0"
          >
            {isPlaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip active={showMeaning} onClick={() => setShowMeaning(!showMeaning)}>
            <span className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" /> What it means
            </span>
          </Chip>
          <Chip active={showWords} onClick={() => setShowWords(!showWords)}>
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Words to know ({question.words.length})
            </span>
          </Chip>
          <Chip active={showPhrasings} onClick={() => setShowPhrasings(!showPhrasings)}>
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" /> How the officer might ask ({question.officerPhrasings.length})
            </span>
          </Chip>
          {language && language !== 'en' && (
            <Chip active={showTranslation} onClick={() => setShowTranslation(!showTranslation)}>
              <span className="flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5" /> In {langName}
              </span>
            </Chip>
          )}
        </div>

        {showMeaning && (
          <p className="text-slate-700 leading-relaxed">{question.meaning}</p>
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
              <p className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900">{question.words[openWord].word}</span> —{' '}
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
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                <p className="text-slate-700 italic flex-1">“{question.officerPhrasings[activePhrase]}”</p>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Listen to this phrasing"
                  onClick={() => speak(question.officerPhrasings[activePhrase])}
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {showTranslation && language !== 'en' && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-3">
            <p className="text-xs italic" style={{ color: '#4A5A78' }}>
              Machine translation. If anything is unclear, ask a person you trust or a lawyer.
            </p>
            {isTranslating ? (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Translating…
              </p>
            ) : translation ? (
              <div className="space-y-3 text-slate-700">
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
                  <ul className="space-y-1 italic">
                    {translation.officerPhrasings.map((p, i) => (
                      <li key={i}>“{p}”</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Translation unavailable.</p>
            )}
          </div>
        )}

        <SayItBack targets={sayItBackTargets} />

        <p className="border-t border-slate-200 pt-3 text-xs leading-relaxed" style={{ color: '#4A5A78' }}>
          This explains what the question means. It is not legal advice about how you should answer. If you are
          not sure your answer is “no,”{' '}
          <Link to="/lawyer-first" className="underline font-semibold" style={{ color: '#1F3A6B' }}>
            talk to a lawyer before you file
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}