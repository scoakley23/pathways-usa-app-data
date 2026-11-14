import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, MessageSquareText } from 'lucide-react';
import { Card, Eyebrow } from '@/components/pathways/ui';
import { PRACTICE_PERSON } from '@/lib/practicePerson';
import N400SectionList from './N400SectionList';

// The guide's home (frame R30N400): the warning, "n of 7 sections read", the
// sections as numbered rows, "Practice with Amio" (the N-400 coach:
// understanding only), "Talk to a lawyer first" with a not-yet border, and
// "We never save your answers". (The file keeps its old name; it used to be
// the folder cover.)
export default function N400Cover({ sections, completedIds = [], countFor, onSelect, tutorName }) {
  const read = sections.filter((s) => completedIds.includes(s.id)).length;
  return (
    <div className="space-y-5 text-navy">
      <Card className="border-2 border-not-yet bg-not-yet-bg">
        <p className="text-base leading-relaxed">
          <strong>Never type your own answers here.</strong>{' '}
          {PRACTICE_PERSON.person.status === 'reviewed'
            ? 'You practice as a made-up person.'
            : 'You learn what each question means.'}
        </p>
      </Card>
      <Eyebrow>{read} of {sections.length} sections read</Eyebrow>
      <N400SectionList sections={sections} completedIds={completedIds} countFor={countFor} onSelect={onSelect} />

      <Link
        to="/n400-coach"
        className="block rounded-card bg-white border border-line p-5 hover:border-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
      >
        <span className="flex items-start gap-4">
          <span className="w-12 h-12 shrink-0 rounded-full bg-navy text-white grid place-items-center">
            <MessageSquareText className="w-6 h-6" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold leading-tight">Practice with {tutorName || 'Amio'}</span>
            <span className="mt-1 block text-base text-ink-2">Say what each question asks. Your answers are never saved.</span>
          </span>
          <ArrowRight className="w-5 h-5 shrink-0 mt-1 text-ink-2 rtl:rotate-180" aria-hidden="true" />
        </span>
      </Link>

      <Link
        to="/lawyer-first"
        className="block rounded-card bg-white border-2 border-not-yet p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
      >
        <span className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 shrink-0 text-not-yet" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold leading-tight">Talk to a lawyer first</span>
            <span className="mt-1 block text-base text-ink-2">If any answer might not be &ldquo;no,&rdquo; get free legal help before you file.</span>
          </span>
          <ArrowRight className="w-5 h-5 shrink-0 mt-1 text-ink-2 rtl:rotate-180" aria-hidden="true" />
        </span>
      </Link>

      <p className="text-center text-[15px] text-ink-2">We never save your answers to the N-400.</p>
    </div>
  );
}
