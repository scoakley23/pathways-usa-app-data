import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { RaisedCard, Tag } from '@/components/pathways/ui';

// "What to expect" cards at the top of Interview Day. General education only:
// nothing here tells a learner how to answer about their own life or whether
// they are eligible.
const SECTIONS = [
  {
    tag: 'Before you go',
    tone: 'blue',
    items: [
      'Bring your appointment notice (your interview letter).',
      'Bring your green card and a photo ID, like a driver’s license.',
      'Bring all your passports and travel documents.',
      'Bring any papers USCIS asked for in your letter.',
      'Arrive early. You will go through a security check.',
    ],
  },
  {
    tag: 'In the room',
    tone: 'teal',
    items: [
      'The officer asks you to promise to tell the truth.',
      'The officer goes over your N-400 application with you.',
      'The officer listens to your English speaking the whole time.',
      'Then you take the reading, writing, and civics tests.',
      'The order can be different at a real interview.',
    ],
  },
  {
    tag: 'It’s OK to ask',
    tone: 'green',
    intro: 'If you don’t understand, you can say:',
    items: ['“Could you repeat that, please?”', '“Could you say it another way?”'],
  },
];

const linkClass = 'min-h-[48px] w-full rounded-2xl bg-pw-soft hover:bg-pw-soft-hover px-4 py-3 text-base font-bold text-pw-navy inline-flex items-center justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2';

export default function InterviewDayGuide() {
  return (
    <section aria-labelledby="interview-guide-title" className="space-y-3 text-pw-navy">
      <h2 id="interview-guide-title" className="text-[22px] leading-snug font-extrabold">What to expect</h2>

      {SECTIONS.map((s) => (
        <RaisedCard key={s.tag} className="space-y-3">
          <Tag tone={s.tone}>{s.tag}</Tag>
          {s.intro && <p className="text-base">{s.intro}</p>}
          <ul className="space-y-2">
            {s.items.map((item) => (
              <li key={item} className="flex gap-3 text-base leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-pw-navy mt-2.5 shrink-0" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </RaisedCard>
      ))}

      <RaisedCard className="space-y-3">
        <Tag tone="navy">After the interview</Tag>
        <ul className="space-y-2">
          <li className="flex gap-3 text-base leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-pw-navy mt-2.5 shrink-0" aria-hidden="true" />
            <span>You get a results paper.</span>
          </li>
          <li className="flex gap-3 text-base leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-pw-navy mt-2.5 shrink-0" aria-hidden="true" />
            <span>
              It can say <strong>approved</strong>, <strong>continued</strong> (USCIS needs more papers, or you need to
              take a test again), or <strong>denied</strong>.
            </span>
          </li>
          <li className="flex gap-3 text-base leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-pw-navy mt-2.5 shrink-0" aria-hidden="true" />
            <span>If you don&apos;t pass a test, you get one retest, usually 60 to 90 days later.</span>
          </li>
        </ul>
      </RaisedCard>

      <div className="rounded-3xl bg-pw-red-soft p-5 space-y-3">
        <p className="text-lg font-extrabold">Questions about your own case?</p>
        <p className="text-base leading-relaxed">
          This page is for practice only. It can&apos;t tell you how to answer about your own life or whether you can apply.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link to="/lawyer-first" className={`${linkClass} bg-white hover:bg-white/80`}>
            Talk to a lawyer first <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
          </Link>
          <Link to="/resources" className={`${linkClass} bg-white hover:bg-white/80`}>
            Find help near you <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
