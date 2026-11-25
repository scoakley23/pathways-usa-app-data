import React from 'react';
import { X, PhoneOff } from 'lucide-react';
import Officer from '@/components/interview/Officer';

// The practice call's frame (frame R30Call, Amio v2): the close button and
// where you are ("Practice interview · Part 2: …"), one dash per step, and
// the drawn officer in a light room, always labeled "AI practice officer ·
// not a real person", with a short status line ("The officer is speaking…").
// The mock interview and the whole-day rehearsal (Interview Day) both use it;
// what goes under it (question, captions, mic, results) is `children`.
// No timer: no clocks anywhere.
export default function CallFrame({
  title,
  dashes = { total: 0, current: 0, currentDone: false },
  dashLabel,
  speaking = false,
  small = false,
  status,
  officerLabel = 'AI practice officer · not a real person',
  closeLabel = 'Close practice',
  onClose = null,
  fullScreen = true,
  children,
}) {
  return (
    <div className={`text-navy ${fullScreen ? 'min-h-screen bg-paper' : 'w-full'}`}>
      <div className={`mx-auto max-w-lg space-y-4 ${fullScreen ? 'px-4 pt-5 pb-10' : ''}`}>
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="w-11 h-11 -ms-2 shrink-0 rounded-full grid place-items-center text-navy hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
            >
              <X className="w-6 h-6" aria-hidden="true" />
            </button>
          )}
          <h1 className="flex-1 min-w-0 font-sans text-base font-semibold text-muted" dir="auto">{title}</h1>
        </div>
        {dashes.total > 0 && (
          <div className="flex gap-1.5" role="img" aria-label={dashLabel}>
            {Array.from({ length: dashes.total }).map((_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < dashes.current || (i === dashes.current && dashes.currentDone) ? 'bg-gold' : i === dashes.current ? 'bg-denim' : 'bg-mid'}`} />
            ))}
          </div>
        )}

        {/* The officer, in a light room */}
        <div className="rounded-card bg-tint px-4 py-6 flex flex-col items-center text-center gap-3">
          <div className={`rounded-full ${speaking ? 'ring-4 ring-denim/40' : ''}`}>
            <Officer size={small ? 96 : 144} />
          </div>
          <p className="text-small font-semibold text-muted">{officerLabel}</p>
          {status && <p className="text-base font-semibold text-navy" aria-live="polite" dir="auto">{status}</p>}
        </div>

        {children}
      </div>
    </div>
  );
}

/** End call: white with a navy border and the words (never red). */
export function EndCallButton({ onClick, label = 'End call' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-tap shrink-0 inline-flex items-center gap-1.5 rounded-button border-2 border-navy bg-white px-3 text-base font-bold text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-navy"
    >
      <PhoneOff className="w-5 h-5" aria-hidden="true" />{label}
    </button>
  );
}
