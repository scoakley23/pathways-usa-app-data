import React from 'react';
import { BookOpen, Landmark, MessageCircle, Pencil } from 'lucide-react';
import { Amio } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';
import { PRETEST_COUNTS, PRETEST_PARTS } from '@/lib/pretest';

// Quick check · start (Prompt 9, frame R30QuickCheck): what each part asks
// (the real counts from src/lib/pretest.js), "Start quick check" and "Skip for
// now". No minutes. `parts` = the parts this check asks (a re-check asks one).

const PART_LOOK = {
  reading: { Icon: BookOpen, title: 'qc_reading', body: 'qc_reading_body' },
  writing: { Icon: Pencil, title: 'qc_writing', body: 'qc_writing_body' },
  speaking: { Icon: MessageCircle, title: 'qc_speaking', body: 'qc_speaking_body' },
  civics: { Icon: Landmark, title: 'qc_civics', body: 'qc_civics_body' },
};
const ORDER = ['reading', 'writing', 'speaking', 'civics'];

export default function QuickCheckIntro({ t, parts = PRETEST_PARTS, ready = true, onStart, onSkip }) {
  const shown = ORDER.filter((p) => parts.includes(p));
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="flex-1 max-w-lg w-full mx-auto px-4 pt-8 pb-4 flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Amio mood="curious" size={72} className="shrink-0" />
          <div className="min-w-0">
            <h1 className="text-[1.625rem] font-bold text-navy leading-tight">{t('qc_title')}</h1>
            <p className="mt-1 text-base text-muted">{t('qc_sub')}</p>
          </div>
        </div>
        <ul className="flex flex-col gap-3 list-none m-0 p-0">
          {shown.map((p) => {
            const { Icon, title, body } = PART_LOOK[p];
            return (
              <li key={p} className="flex items-center gap-4 rounded-card bg-white border border-line px-4 py-4">
                <span className="grid place-items-center w-12 h-12 shrink-0 rounded-2xl bg-tint text-denim"><Icon className="w-6 h-6" strokeWidth={2} aria-hidden="true" /></span>
                <span className="min-w-0">
                  <span className="block text-lg font-bold text-navy">{t(title)}</span>
                  <span className="block text-base text-muted">{t(body, { n: PRETEST_COUNTS[p] })}</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="text-small text-muted">{t('qc_saved')}</p>
        {!ready && <p className="text-base text-muted">{t('qc_not_ready')}</p>}
      </div>
      <div className="sticky bottom-0 bg-paper px-4 pt-2 pb-6 max-w-lg w-full mx-auto flex flex-col items-center gap-2">
        <Button variant="main" className="w-full" disabled={!ready} onClick={onStart}>{t('qc_start')}</Button>
        <Button variant="link" onClick={onSkip}>{t('qc_skip')}</Button>
      </div>
    </div>
  );
}
