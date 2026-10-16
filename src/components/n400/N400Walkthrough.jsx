import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2, Loader2, FileText, MessagesSquare } from 'lucide-react';
import { speakText } from '@/components/utils/textToSpeech';
import { EXAMPLE_APPLICANTS } from './exampleApplicants';
import N400PersonaCard from './N400PersonaCard';
import N400PaperForm from './N400PaperForm';

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

// Example applicants sub-page of the N-400 guide: meet the fictional people,
// read how they would answer, and see what their N-400 form would look like.
// Nothing here is collected or saved.
export default function N400Walkthrough() {
  const [selectedId, setSelectedId] = useState(EXAMPLE_APPLICANTS[0].id);
  const [playingKey, setPlayingKey] = useState(null);
  const [mode, setMode] = useState('qa'); // 'qa' = interview answers, 'form' = N-400 practice copy
  const applicant = EXAMPLE_APPLICANTS.find((p) => p.id === selectedId);
  const firstName = applicant.name.split(' ')[0];

  const speak = (key, text) => {
    speakText(text, 'en', {
      onStart: () => setPlayingKey(key),
      onEnd: () => setPlayingKey(null),
    });
  };

  const toggleClasses = (active) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
      active ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'
    }`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {EXAMPLE_APPLICANTS.map((p) => (
          <N400PersonaCard
            key={p.id}
            applicant={p}
            selected={p.id === selectedId}
            onSelect={() => {
              setSelectedId(p.id);
              setPlayingKey(null);
            }}
          />
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-5 md:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <img
              src={applicant.image}
              alt={`Illustration of ${applicant.name}, a fictional practice person`}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shrink-0"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">{applicant.name}</h2>
                <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                  Practice person. Not real.
                </Badge>
              </div>
              <p className="text-sm text-slate-600">{applicant.blurb}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 bg-slate-100 rounded-xl p-1 w-fit">
            <button type="button" onClick={() => setMode('qa')} className={toggleClasses(mode === 'qa')}>
              <MessagesSquare className="w-4 h-4" /> Interview Q&A
            </button>
            <button type="button" onClick={() => setMode('form')} className={toggleClasses(mode === 'form')}>
              <FileText className="w-4 h-4" /> Their N-400 form
            </button>
          </div>

          {mode === 'form' ? (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed" style={{ color: '#4A5A78' }}>
                This is what {firstName}'s Form N-400 would look like, using the answers above — laid out like
                the official 14-page paper form, part by part. It is long because the real form is long. This
                form is an example for learning — it is not real, and this guide does not fill out or file any
                form.
              </p>
              <N400PaperForm applicant={applicant} />
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed" style={{ color: '#4A5A78' }}>
                See how {firstName} would answer the questions in the guide. These examples help you understand the
                questions — every real applicant's answers are their own. Example answers are in English, like the
                real interview. Nothing here is legal advice.
              </p>

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
                          <p className="text-sm text-slate-700 italic flex-1">
                            {firstName} answers: “{pair.a}”
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Listen to this example answer"
                            className="rounded-full w-9 h-9 shrink-0"
                            onClick={() => (playingKey === key ? setPlayingKey(null) : speak(key, pair.a))}
                          >
                            {playingKey === key ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Volume2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}