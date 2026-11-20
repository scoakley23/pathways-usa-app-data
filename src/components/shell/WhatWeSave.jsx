import React from 'react';
import { Card, Eyebrow } from '@/components/pathways/ui';

// "What we save" on Settings (frame R30Settings): the short version, then the
// full list in plain words. Keep it in step with CLAUDE.md "Where learner
// data is saved today" and docs/AI-Policy-updated.md when data handling
// changes. `t` translates a key (falls back to the English below).
import { WHAT_WE_SAVE_LINES } from './shellStrings';

export { WHAT_WE_SAVE_LINES };

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
          <Group title={t('account_title')} items={list('account', 11)} />
          <Group title={t('device_title')} items={list('device', 2)} />
          <Group title={t('never_title')} items={list('never', 1)} />
        </div>
      </details>
    </Card>
  );
}
