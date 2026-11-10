import React from 'react';
import { X } from 'lucide-react';
import RoadProgress from './RoadProgress';

// The top of a practice run on navy (The Road): a 44px outlined close button,
// the road progress bar and "4/10". `answered` moves the star one step.
export default function RunTopBar({ onClose, index = 0, total = 0, answered = false }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close practice"
        className="w-11 h-11 shrink-0 rounded-full border-2 border-navy-line text-white grid place-items-center hover:bg-navy-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X className="w-5 h-5" aria-hidden="true" />
      </button>
      {total > 0 && (
        <>
          <RoadProgress index={index} total={total} answered={answered} className="flex-1" />
          <span className="shrink-0 text-base font-semibold tabular-nums text-on-navy-2" aria-hidden="true">
            {Math.min(index + 1, total)}/{total}
          </span>
        </>
      )}
    </div>
  );
}
