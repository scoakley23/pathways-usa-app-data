import React from 'react';
import { Check, X } from 'lucide-react';

// The bottom banners after an answer (frames R33Teach, R30TryAgain).
// Success: the correct colors with a check icon. Not yet: the not-yet
// colors with words, never color alone. Each has one button.
const BTN = 'shrink-0 min-h-tap rounded-button px-4 font-bold text-[15px] text-white inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-navy';

function Banner({ tone, icon: Icon, title, children, actionLabel, onAction, className }) {
  const ok = tone === 'success';
  return (
    <div
      role="status"
      className={`border-t-[3px] px-5 pt-3.5 pb-6 flex items-center justify-between gap-3 ${ok ? 'bg-correct-bg border-correct' : 'bg-not-yet-bg border-not-yet'} ${className}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <span className={`mt-0.5 w-6 h-6 shrink-0 rounded-full grid place-items-center text-white ${ok ? 'bg-correct' : 'bg-not-yet'}`} aria-hidden="true">
          <Icon className="w-4 h-4" strokeWidth={3} />
        </span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className={`text-[17px] font-bold leading-tight ${ok ? 'text-correct-title' : 'text-not-yet'}`}>{title}</p>
          {children && <div className="text-small text-navy break-words">{children}</div>}
        </div>
      </div>
      {actionLabel && (
        <button type="button" onClick={onAction} className={`${BTN} ${ok ? 'bg-correct hover:bg-correct-title' : 'bg-denim hover:bg-denim-deep'}`}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function SuccessBanner({ title = 'Correct', actionLabel = 'Next', onAction, className = '', children }) {
  return <Banner tone="success" icon={Check} title={title} actionLabel={actionLabel} onAction={onAction} className={className}>{children}</Banner>;
}

export function NotYetBanner({ title = 'Not quite yet', actionLabel = 'Try again', onAction, className = '', children }) {
  return <Banner tone="notYet" icon={X} title={title} actionLabel={actionLabel} onAction={onAction} className={className}>{children}</Banner>;
}
