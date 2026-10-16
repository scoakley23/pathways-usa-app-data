import React from 'react';

// Shared building blocks that make the practice copy look like the official
// paper Form N-400: black rules, typewriter-style typed answers, part bars,
// item boxes, and letter-size form sheets.

const BARCODE_STYLE = {
  background:
    'repeating-linear-gradient(90deg, #1a1a1a 0 2px, transparent 2px 4px, #1a1a1a 4px 5px, transparent 5px 8px, #1a1a1a 8px 9px, transparent 9px 11px)',
};

export function CheckBox({ checked, label, className }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className || ''}`}>
      <span className="inline-flex w-3.5 h-3.5 shrink-0 items-center justify-center border border-black bg-white font-typewriter text-[10px] font-bold leading-none text-black">
        {checked ? 'X' : ''}
      </span>
      {label && <span className="text-[11px] font-semibold text-black">{label}</span>}
    </span>
  );
}

export function YesNo({ yes, na }) {
  if (na) return <p className="font-typewriter text-xs text-black">N/A</p>;
  return (
    <div className="flex items-center gap-4">
      <CheckBox checked={yes === true} label="Yes" />
      <CheckBox checked={yes === false} label="No" />
    </div>
  );
}

export function PartBar({ title, note }) {
  return (
    <div className="bg-black text-white px-3 py-1.5">
      <p className="font-bold text-sm tracking-wide">{title}</p>
      {note && <p className="text-[9px] opacity-90 mt-0.5 leading-snug">{note}</p>}
    </div>
  );
}

// An item row: the item number sits in its own bordered cell on the left,
// the way the real form does it.
export function Item({ number, children, className }) {
  return (
    <div className={`flex border border-black bg-white ${className || ''}`}>
      <div className="w-11 shrink-0 border-r border-black px-1 py-1 text-[10px] font-bold text-black">
        {number}
      </div>
      <div className="flex-1 px-2 py-1 min-w-0 space-y-1.5">{children}</div>
    </div>
  );
}

// A labeled response box with the typed answer inside, in typewriter type
// the way a real applicant fills in the paper form.
export function Field({ label, value, className }) {
  return (
    <div className={`border border-black bg-white min-w-0 ${className || ''}`}>
      {label && (
        <p className="text-[9px] font-bold text-black leading-tight px-1.5 pt-1 uppercase tracking-wide">
          {label}
        </p>
      )}
      <p className="font-typewriter text-xs text-black leading-snug px-1.5 pb-1 min-h-[20px] break-words">
        {value || ' '}
      </p>
    </div>
  );
}

// A group header between items, like the real form's "Have you EVER:"
// lead-in questions.
export function GroupIntro({ text }) {
  return (
    <div className="bg-slate-100 border border-black px-2 py-1">
      <p className="text-[10px] font-bold text-black leading-snug">{text}</p>
    </div>
  );
}

// Small italic fine print, like the notes under real form questions.
export function Note({ children }) {
  return <p className="text-[9px] italic text-slate-600 leading-snug">{children}</p>;
}

// One sheet of the form: A-Number strip at the top, edition footer with
// barcode and page number at the bottom, like the official paper version.
export function FormPage({ page, first, children }) {
  return (
    <div className="relative rounded-sm border border-black bg-white p-3 md:p-5 overflow-hidden space-y-1.5 ring-1 ring-black/5">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-5xl font-black text-slate-200/40 -rotate-12 tracking-widest">
          PRACTICE
        </span>
      </div>
      {!first && (
        <div className="relative flex justify-end items-center gap-1.5">
          <p className="text-[10px] font-bold text-black">A-</p>
          <div className="border border-black w-44 h-5 bg-white" />
        </div>
      )}
      <div className="relative space-y-1.5">{children}</div>
      <div className="relative pt-2 border-t border-black">
        <div className="flex items-end justify-between gap-3">
          <p className="text-[9px] font-semibold text-black">
            Form N-400 Edition 01/20/25 — practice copy, not a real application
          </p>
          <div className="flex items-center gap-3">
            <div className="h-6 w-28 shrink-0" style={BARCODE_STYLE} aria-hidden="true" />
            <p className="text-[9px] font-bold text-black">Page {page} of 14</p>
          </div>
        </div>
      </div>
    </div>
  );
}