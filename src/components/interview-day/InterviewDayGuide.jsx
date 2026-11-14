import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, Eyebrow } from '@/components/pathways/ui';
import { civicsRules, SENTENCE_TRIES } from '@/lib/interviewDay';

// "What happens on the day" (frame R30DayGuide): six steps, then what to
// bring, what you can always say, and what happens after. General education
// only: nothing here tells a learner how to answer about their own life or
// whether they are eligible. The test numbers come from CIVICS_TEST_RULES and
// SENTENCE_TRIES (src/lib/interviewDay.js), never typed into the text.
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'];

export function dayGuideSteps(version = '2025') {
  const rules = civicsRules(version);
  const tries = NUMBER_WORDS[SENTENCE_TRIES] || String(SENTENCE_TRIES);
  return [
    { title: 'Check in', body: 'Bring everything your interview letter asks for.' },
    { title: 'Promise to tell the truth', body: 'The officer asks you to stand and raise your right hand.' },
    { title: 'Your N-400 questions', body: 'The officer goes over your application with you.' },
    { title: 'Reading', body: `Read one of up to ${tries} sentences out loud.` },
    { title: 'Writing', body: `Write one of up to ${tries} sentences.` },
    { title: 'Civics', body: `Answer out loud. Up to ${rules.maxQuestions} questions; pass with ${rules.passAt}.` },
  ];
}

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

const linkClass = 'min-h-[48px] w-full rounded-2xl bg-pw-soft hover:bg-pw-soft-hover px-4 py-3 text-base font-bold text-pw-navy inline-flex items-center justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2';

export default function InterviewDayGuide({ version = '2025' }) {
  const before = SECTIONS.find((x) => x.tag === 'Before you go');
  const okToAsk = SECTIONS.find((x) => x.tag === 'It’s OK to ask');
  const inRoom = SECTIONS.find((x) => x.tag === 'In the room');
  return (
    <section aria-label="What happens on the day" className="space-y-4 text-navy">
      <ol className="space-y-3">
        {dayGuideSteps(version).map((step, i) => (
          <li key={step.title}>
            <Card padding="p-4" className="flex items-start gap-4">
              <span className="w-10 h-10 shrink-0 rounded-full bg-navy text-white grid place-items-center text-lg font-bold" aria-hidden="true">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-lg font-bold">{step.title}</p>
                <p className="text-base text-muted">{step.body}</p>
              </div>
            </Card>
          </li>
        ))}
      </ol>
      <p className="text-small text-muted">{inRoom.items[inRoom.items.length - 1]}</p>

      <Card className="bg-tint border-tint">
        <p className="text-base">You can always say: <strong>“Could you repeat that, please?”</strong></p>
        <p className="text-base text-muted mt-1">{okToAsk.items[1]}</p>
      </Card>

      <Card className="space-y-3">
        <Eyebrow>{before.tag}</Eyebrow>
        <ul className="space-y-2">
          {before.items.map((item) => (
            <li key={item} className="flex gap-3 text-base leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-navy mt-2.5 shrink-0" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-3">
        <Eyebrow>After the interview</Eyebrow>
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
      </Card>

      <div className="rounded-card bg-not-yet-bg border-2 border-not-yet p-5 space-y-3">
        <p className="text-lg font-extrabold">Questions about your own case?</p>
        <p className="text-base leading-relaxed">
          This page is for practice only. It can&apos;t tell you how to answer about your own life or whether you can apply.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link to="/lawyer-first" className={`${linkClass} bg-white hover:bg-white/80`}>
            Talk to a lawyer first <ArrowRight className="w-5 h-5 shrink-0 rtl:rotate-180" aria-hidden="true" />
          </Link>
          <Link to="/resources" className={`${linkClass} bg-white hover:bg-white/80`}>
            Find help near you <ArrowRight className="w-5 h-5 shrink-0 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
