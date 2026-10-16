import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2 } from 'lucide-react';
import { speakText } from '@/components/utils/textToSpeech';
import { EXAMPLE_APPLICANTS } from './exampleApplicants';

// Oath answers are the same for every applicant who is able and willing to
// take the Oath, so they are shared across the example people.
const OATH_PAIRS = [
  { q: 'Do you support the Constitution and form of Government of the United States?', a: 'Yes, I do.' },
  { q: 'Are you willing to take the full Oath of Allegiance to the United States?', a: 'Yes, I am.' },
  { q: 'If the law requires it, are you willing to bear arms on behalf of the United States?', a: 'Yes, if the law requires it.' },
  { q: 'If the law requires it, are you willing to perform noncombatant services in the U.S. armed forces?', a: 'Yes, if the law requires it.' },
  { q: 'If the law requires it, are you willing to perform work of national importance under civilian direction?', a: 'Yes, if the law requires it.' },
];

// Walkthrough for one example person: how they would answer the guide's
// question groups. Derived from the fictional profile — examples to
// reference, never answers to memorize.
function buildWalkthrough(a) {
  const childrenAnswer =
    a.children[0] === 'No children'
      ? 'No, I do not have any children.'
      : `Yes, I have ${a.children.length}. ${a.children.join('; ')}.`;
  const tripsAnswer = `Yes. ${a.trips.map((t) => `I traveled to ${t}`).join(' ')}`;

  return [
    {
      title: 'About you',
      pairs: [
        { q: 'Where do you live?', a: `I live at ${a.address}.` },
        { q: 'Where were you born?', a: `I was born in ${a.birthplace}.` },
        { q: 'How long have you lived in the United States?', a: `I have lived in the United States for ${a.yearsInUS} years.` },
        { q: 'What kind of work do you do? Where do you work?', a: `I am a ${a.job.toLowerCase()}. ${a.jobs[0]}.` },
        { q: 'Are you married? Tell me about it.', a: a.marital },
        { q: 'Do you have any children? How many?', a: childrenAnswer },
      ],
    },
    {
      title: 'Time outside the U.S.',
      pairs: [
        { q: 'Have you traveled outside the United States since you became a permanent resident? Tell me about your trips.', a: tripsAnswer },
      ],
    },
    {
      title: 'Crimes and traffic tickets',
      pairs: a.gmc.map((g) => ({ q: g.q, a: g.a })),
    },
    {
      title: 'Oath questions',
      pairs: OATH_PAIRS,
    },
  ];
}

// Example applicants section of the N-400 guide: pick a fictional person and
// read how they would answer. Nothing here is collected or saved.
export default function N400Walkthrough() {
  const [selectedId, setSelectedId] = useState(EXAMPLE_APPLICANTS[0].id);
  const [playingKey, setPlayingKey] = useState(null);
  const applicant = EXAMPLE_APPLICANTS.find((p) => p.id === selectedId);
  const firstName = applicant.name.split(' ')[0];

  const speak = (key, text) => {
    speakText(text, 'en', {
      onStart: () => setPlayingKey(key),
      onEnd: () => setPlayingKey(null),
    });
  };

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5 md:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Example applicants</h2>
            <p className="text-sm" style={{ color: '#4A5A78' }}>
              A walkthrough of this guide, person by person
            </p>
          </div>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: '#4A5A78' }}>
          See how a made-up person would answer the questions in this guide. These examples are here to help you
          understand the questions — every real applicant's answers are their own. Example answers are in English,
          like the real interview. Nothing you read here is legal advice.
        </p>

        <div className="flex flex-wrap gap-2">
          {EXAMPLE_APPLICANTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                selectedId === p.id
                  ? 'bg-[#1F3A6B] text-white border-[#1F3A6B]'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {p.name.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-900">{applicant.name}</p>
            <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
              Practice person. Not real.
            </Badge>
          </div>
          <p className="text-sm text-slate-600">{applicant.blurb}</p>
        </div>

        {buildWalkthrough(applicant).map((group) => (
          <div key={group.title} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: '#4A5A78' }}>
              {group.title}
            </h3>
            {group.pairs.map((pair, i) => {
              const key = `${group.title}-${i}`;
              return (
                <div key={key} className="rounded-xl border border-slate-200 p-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-800">Officer asks: {pair.q}</p>
                  <div className="flex items-start gap-3">
                    <p className="text-sm text-slate-700 italic flex-1">{firstName} answers: “{pair.a}”</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Listen to this example answer"
                      className="rounded-full w-9 h-9 shrink-0"
                      onClick={() => (playingKey === key ? setPlayingKey(null) : speak(key, pair.a))}
                    >
                      {playingKey === key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}