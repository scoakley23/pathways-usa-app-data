import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Volume2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { speakText } from '@/components/utils/textToSpeech';
import SayItBack from './SayItBack';
import useN400Translation from './useN400Translation';

// One N-400 question card: official wording, plain-English meaning, words to
// know, officer phrasings, a machine translation of all of it, and listen /
// say-it-back practice. There is deliberately NO field for the learner to
// answer the question.
export default function N400QuestionCard({ sectionId, question, isAdmin, language }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { translation, isTranslating } = useN400Translation(sectionId, question, language);

  const speak = () => {
    speakText(question.official, 'en', {
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
    });
  };

  const sayItBackTargets = [
    { key: 'question', label: 'The question', text: question.official },
    ...question.words.map((w, i) => ({ key: `word-${i}`, label: w.word, text: w.word })),
  ];

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5 md:p-6 space-y-5">
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
            onClick={speak}
            aria-label="Listen to the question"
            className={`rounded-full w-11 h-11 shrink-0 ${isPlaying ? 'border-slate-400 bg-slate-100' : ''}`}
          >
            {isPlaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1.5">
            What this question means
          </h4>
          <p className="text-slate-700 leading-relaxed">{question.meaning}</p>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1.5">Words to know</h4>
          <ul className="space-y-1.5">
            {question.words.map((w) => (
              <li key={w.word} className="text-slate-700">
                <span className="font-semibold text-slate-900">{w.word}</span> — {w.definition}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1.5">
            How the officer might say it
          </h4>
          <ul className="space-y-1.5">
            {question.officerPhrasings.map((p, i) => (
              <li key={i} className="text-slate-600 italic">“{p}”</li>
            ))}
          </ul>
        </div>

        {language && language !== 'en' && (
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