import React from 'react';
import useTextSize from './useTextSize';
import { TEXT_SIZES } from '@/lib/textSize';

// Normal / Large / Extra large, each shown at its own size. Saved on this
// device. Offered when learners first meet their tutor and in Profile.
export default function TextSizePicker({ className = '' }) {
  const textSize = useTextSize();
  return (
    <div role="group" aria-labelledby="text-size-label" className={`space-y-2 text-pw-navy ${className}`}>
      <p id="text-size-label" className="font-bold text-base">Text size in lessons</p>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(TEXT_SIZES).map(([id, t]) => (
          <button
            key={id}
            type="button"
            aria-pressed={textSize.size === id}
            onClick={() => textSize.changeSize(id)}
            className={`min-h-[44px] rounded-2xl border-2 px-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2 ${
              textSize.size === id ? 'border-pw-navy bg-pw-soft' : 'border-pw-line bg-white hover:border-pw-muted'
            }`}
            style={{ fontSize: t.px }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-pw-muted">Saved on this device. Takes effect right away.</p>
    </div>
  );
}
