import React from 'react';
import { Card, Eyebrow } from '@/components/pathways/ui';

// "What we save" on Settings (frame R30Settings): the short version, then the
// full list in plain words. Keep it in step with CLAUDE.md "Where learner
// data is saved today" and docs/AI-Policy-updated.md when data handling
// changes. `t` translates a key (falls back to the English below).
export const WHAT_WE_SAVE_LINES = {
  title: 'What we save',
  short_saved: 'Your lesson progress, badges and practice scores.',
  short_never_lead: 'Never',
  short_never: 'your voice, your interview date, your address, or anything about your case.',
  full_list: 'See the full list',
  account_title: 'With your account',
  account_1: 'Your name, email, points and badges.',
  account_2: 'How Amio talks to you (tone and how much English), and your quick check levels.',
  account_3: 'Your practice: which questions, sentences and lessons you got right, and your scores. Mock interview scores only, never what you said.',
  account_4: 'Your lesson notes, and which N-400 guide sections you read (never your answers).',
  account_5: 'Your questions to Amio and Amio’s answers, so you can see them in History. Only you can see them.',
  account_6: 'Your state and congressional district, if you used “Who Represents Me?” (never your address).',
  account_7: 'Places you saved in Free help near you.',
  account_8: 'If you picked a program: which one, the name you gave them, and whether you share your progress. Your program sees only that and counts, never your answers or your questions to Amio.',
  account_9: 'If you answer them: your “Help us improve Pathways” answers (fixed choices only), the days you opened the app, and which reminder emails we sent.',
  device_title: 'Only on this phone',
  device_1: 'Your interview month, your plan and checkmarks, your language, text size, sound and voice settings, and saved translations.',
  never_title: 'Never saved',
  never_1: 'Your voice (speech becomes text in your browser; only scores are kept), your interview date, your address, your A-number, your immigration status, or your answers to the N-400.',
};

function Group({ title, items }) {
  return (
    <div className="space-y-1">
      <h3 className="text-base font-bold text-navy">{title}</h3>
      <ul className="list-disc ps-5 space-y-1 text-base text-navy">
        {items.map((x) => <li key={x}>{x}</li>)}
      </ul>
    </div>
  );
}

export default function WhatWeSave({ t = (k) => WHAT_WE_SAVE_LINES[k] }) {
  const list = (prefix, n) => Array.from({ length: n }, (_, i) => t(`${prefix}_${i + 1}`));
  return (
    <Card id="what-we-save" className="scroll-mt-20">
      <Eyebrow>{t('title')}</Eyebrow>
      <p className="mt-2 text-base text-navy leading-relaxed">
        {t('short_saved')} <strong>{t('short_never_lead')}</strong> {t('short_never')}
      </p>
      <details className="mt-2">
        <summary className="min-h-tap flex items-center cursor-pointer text-base font-semibold text-denim underline underline-offset-4 decoration-denim/40">
          {t('full_list')}
        </summary>
        <div className="mt-2 space-y-4">
          <Group title={t('account_title')} items={list('account', 9)} />
          <Group title={t('device_title')} items={list('device', 1)} />
          <Group title={t('never_title')} items={list('never', 1)} />
        </div>
      </details>
    </Card>
  );
}
