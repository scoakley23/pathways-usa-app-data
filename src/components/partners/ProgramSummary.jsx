import React from 'react';
import { RaisedCard, SkillDot, SKILL_LABEL } from '@/components/pathways/ui';
import { LEVELS as LEVEL_TEXT } from '@/lib/pretest';
import { SKILLS, LEVELS } from '../../../base44/shared/partners.js';

// /Partner: a program's totals over its confirmed learners (exact numbers),
// and the learners who chose to share their own progress.

function Stat({ value, label, note }) {
  return (
    <RaisedCard padding="p-4">
      <p className="font-display text-[44px] leading-none">{value}</p>
      <p className="mt-1 text-base font-bold">{label}</p>
      {note && <p className="text-sm text-pw-muted">{note}</p>}
    </RaisedCard>
  );
}

const learnersText = (n) => `${n} ${n === 1 ? 'learner' : 'learners'}`;

export function ProgramTotals({ totals }) {
  return (
    <section aria-labelledby="partner-totals" className="space-y-3">
      <h2 id="partner-totals" className="font-display text-[28px] leading-tight">Your learners</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat value={totals.learners} label="Confirmed learners" />
        <Stat value={totals.activeWeek} label="Studied this week" note="Opened Pathways in the last 7 days" />
        <Stat value={totals.activeMonth} label="Studied this month" note="In the last 30 days" />
        <Stat value={totals.quickCheckDone} label="Finished the quick check" />
        <Stat value={totals.lessonsCompleted} label="Lessons finished" note={`By ${learnersText(totals.learnersWithLesson)}`} />
        <Stat value={totals.n400SectionsRead} label="N-400 sections read" note={`By ${learnersText(totals.learnersWithN400)}`} />
      </div>

      <RaisedCard padding="p-4 sm:p-5">
        <h3 className="text-lg font-bold">Quick check levels</h3>
        <p className="text-sm text-pw-muted mb-3">How many learners are at each level, by part of the interview.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="text-left text-sm text-pw-muted">
                <th scope="col" className="py-2 pr-3 font-semibold">Part</th>
                {LEVELS.map((l) => <th key={l} scope="col" className="py-2 px-2 font-semibold text-right">{LEVEL_TEXT[l].label}</th>)}
              </tr>
            </thead>
            <tbody>
              {SKILLS.map((s) => (
                <tr key={s} className="border-t border-pw-line">
                  <th scope="row" className="py-2 pr-3 text-left font-semibold"><span className="inline-flex items-center gap-2"><SkillDot skill={s} /> {SKILL_LABEL[s]}</span></th>
                  {LEVELS.map((l) => <td key={l} className="py-2 px-2 text-right font-display text-xl">{totals.levels[s][l]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RaisedCard>
    </section>
  );
}

export function SharedLearners({ learners }) {
  return (
    <section aria-labelledby="partner-shared" className="space-y-3">
      <h2 id="partner-shared" className="font-display text-[28px] leading-tight">
        Learners who share their progress <span className="text-pw-muted">{learners.length}</span>
      </h2>
      <p className="text-base text-pw-muted">Each learner chooses this on their Profile and can turn it off.</p>
      <RaisedCard padding="px-5 py-2">
        {learners.length === 0
          ? <p className="py-3 text-base text-pw-muted">No one shares their progress yet.</p>
          : (
            <ul>
              {learners.map((l) => (
                <li key={l.id} className="py-3 border-b border-pw-line last:border-0 space-y-1.5">
                  <p className="text-base font-bold break-words">{l.name}</p>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {SKILLS.map((s) => (
                      <li key={s} className="inline-flex items-center gap-1.5">
                        <SkillDot skill={s} /> {SKILL_LABEL[s]}: <span className="font-semibold">{l.levels[s] ? LEVEL_TEXT[l.levels[s]].label : 'Not checked'}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-pw-muted">{l.lessonsCompleted} {l.lessonsCompleted === 1 ? 'lesson' : 'lessons'} finished · {l.n400SectionsRead} N-400 {l.n400SectionsRead === 1 ? 'section' : 'sections'} read</p>
                </li>
              ))}
            </ul>
          )}
      </RaisedCard>
    </section>
  );
}
