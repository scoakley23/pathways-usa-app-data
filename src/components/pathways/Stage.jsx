import React from 'react';
import { useKeyText } from '@/components/pathways/keyStrings';

// The stage (desktop vision C): on desktop (lg, 1024px+) a speaking screen
// puts the question and its helpers on the left and the answer controls (the
// mic) on the right, centred. On phones it is one column, as designed:
// `children`, then `side` (pushed to the bottom of the screen when the
// stage fills it, as the mic always was). When there is no `side` (after an answer) the
// question keeps its place on the left.
export default function Stage({ side, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-x-16 lg:items-center ${className}`}>
      <div className="flex flex-col gap-5 min-w-0">{children}</div>
      {side && <div className="flex-1 flex flex-col justify-end gap-4 min-w-0 lg:flex-none lg:justify-center lg:py-6">{side}</div>}
    </div>
  );
}

const KEY_LABELS = { space: ['Space', 'key_answer'], r: ['R', 'key_hear'], h: ['H', 'key_hint'], escape: ['Esc', 'key_close'] };

/**
 * The keys a speaking screen answers to, as one small line (desktop only).
 * `keys`: any of 'space', 'r', 'h', 'escape'. `onNavy` for navy screens.
 */
export function KeyHints({ keys = [], onNavy = true, className = '' }) {
  const t = useKeyText();
  const shown = keys.filter((k) => KEY_LABELS[k]);
  if (!shown.length) return null;
  return (
    <p className={`hidden lg:block text-small ${onNavy ? 'text-on-navy' : 'text-muted'} ${className}`} dir="auto">
      {t('keys')}{' '}
      {shown.map((k, i) => (
        <React.Fragment key={k}>
          {i > 0 && ' · '}
          <kbd className={`font-sans font-bold ${onNavy ? 'text-white' : 'text-navy'}`} dir="ltr">{KEY_LABELS[k][0]}</kbd> {t(KEY_LABELS[k][1])}
        </React.Fragment>
      ))}
    </p>
  );
}
