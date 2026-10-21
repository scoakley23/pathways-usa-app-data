import React, { useState } from 'react';
import { RaisedCard, Tag } from '@/components/pathways/ui';
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
    `flex-1 sm:flex-none min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-base leading-tight font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red ${
      active ? 'bg-white shadow-raised text-pw-navy' : 'text-pw-muted hover:text-pw-navy'
    }`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

      <RaisedCard className="space-y-5 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <img
              src={applicant.image}
              alt={`Illustration of ${applicant.name}, a fictional practice person`}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-pw-line bg-pw-blue-soft shrink-0"
            />
            <div className="space-y-2">
              <Tag tone="red">Practice person. Not real.</Tag>
              <h2 className="text-2xl font-extrabold text-pw-navy leading-tight">{applicant.name}</h2>
              <p className="text-base text-pw-muted">{applicant.blurb}</p>
            </div>
          </div>

          <div className="flex gap-1 bg-pw-soft rounded-2xl p-1 w-full sm:w-fit">
            <button type="button" onClick={() => setMode('qa')} aria-pressed={mode === 'qa'} className={toggleClasses(mode === 'qa')}>
              <MessagesSquare className="w-5 h-5 shrink-0" /> <span>Interview Q&A</span>
            </button>
            <button type="button" onClick={() => setMode('form')} aria-pressed={mode === 'form'} className={toggleClasses(mode === 'form')}>
              <FileText className="w-5 h-5 shrink-0" /> <span>Their <span className="whitespace-nowrap">N-400</span> form</span>
            </button>
          </div>

          {mode === 'form' ? (
            <div className="space-y-3">
              <p className="text-base leading-relaxed text-pw-muted">
                This is what {firstName}'s Form N-400 would look like, using the answers above — laid out like
                the official 14-page paper form, part by part. It is long because the real form is long. This
                form is an example for learning — it is not real, and this guide does not fill out or file any
                form.
              </p>
              <N400PaperForm applicant={applicant} />
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-base leading-relaxed text-pw-muted">
                See how {firstName} would answer the questions in the guide. These examples help you understand the
                questions — every real applicant's answers are their own. Example answers are in English, like the
                real interview. Nothing here is legal advice.
              </p>

              {buildWalkthrough(applicant).map((group) => (
                <div key={group.title} className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-pw-muted">{group.title}</h3>
                  {group.pairs.map((pair, i) => {
                    const key = `${group.title}-${i}`;
                    return (
                      <div key={key} className="rounded-2xl border border-pw-line bg-white p-4 space-y-3">
                        <p className="text-base font-bold text-pw-navy">Officer asks: {pair.q}</p>
                        <div className="flex items-start gap-3 rounded-xl bg-pw-soft px-3 py-2.5">
                          <p className="text-base text-pw-navy italic flex-1 self-center">
                            {firstName} answers: “{pair.a}”
                          </p>
                          <button
                            type="button"
                            aria-label="Listen to this example answer"
                            className="w-11 h-11 rounded-full bg-white border border-pw-line text-pw-navy hover:bg-pw-blue-soft grid place-items-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red"
                            onClick={() => (playingKey === key ? setPlayingKey(null) : speak(key, pair.a))}
                          >
                            {playingKey === key ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Volume2 className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
      </RaisedCard>
    </div>
  );
}