import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { PrimaryButton, RaisedCard, SkillDot, SKILL_LABEL } from '@/components/pathways/ui';

// Part 6: one row per skill. Shown once and kept only in page memory.
export default function RehearsalResults({ rows, onAgain }) {
  return (
    <div className="space-y-4 text-pw-navy">
      <RaisedCard className="space-y-1">
        <h2 className="text-[22px] leading-snug font-extrabold">Your rehearsal results</h2>
        <p className="text-base text-pw-muted">Practice results only. They are not saved, and they don&apos;t predict your real interview.</p>
      </RaisedCard>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.skill} className="rounded-2xl bg-white border border-pw-line shadow-raised p-4 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-3 min-w-0 flex-1">
              <SkillDot skill={r.skill} />
              <span className="text-lg font-extrabold">{SKILL_LABEL[r.skill]}</span>
            </span>
            {r.passed ? (
              <span className="inline-flex items-center gap-2 text-base font-bold text-pw-green-ink">
                <Check className="w-5 h-5" aria-hidden="true" /> Passed
              </span>
            ) : (
              <Link
                to={r.practicePath}
                className="min-h-[44px] rounded-2xl bg-pw-soft hover:bg-pw-soft-hover px-4 text-base font-bold inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
              >
                Practice more <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
          </li>
        ))}
      </ul>

      <PrimaryButton large className="w-full" onClick={onAgain}>Rehearse again</PrimaryButton>
    </div>
  );
}
