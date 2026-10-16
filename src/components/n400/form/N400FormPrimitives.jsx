import React from 'react';

// Shared building blocks that make the practice copy look like the official
// paper Form N-400: item boxes, checkboxes, part bars, and form sheets.

const BARCODE_STYLE = {
  background:
    'repeating-linear-gradient(90deg, #1a1a1a 0 2px, transparent 2px 4px, #1a1a1a 4px 5px, transparent 5px 8px, #1a1a1a 8px 9px, transparent 9px 11px)',
};

export function CheckBox({ checked, label, className }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className || ''}`}>
      <span className="inline-flex w-3.5 h-3.5 shrink-0 items-center justify-center border border-slate-600 bg-white text-[9px] font-bold leading-none text-slate-900">
        {checked ? 'X' : ''}
      </span>
      {label && <span className="text-[11px] font-semibold text-slate-800">{label}</span>}
    </span>
  );
}

export function YesNo({ yes, na }) {
  if (na) return <p className="font-mono text-xs text-slate-900">N/A</p>;
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
      <p className="font-bold text-sm">{title}</p>
      {note && <p className="text-[9px] opacity-80 mt-0.5">{note}</p>}
    </div>
  );
}

// An item row: the item number sits in its own bordered cell on the left,
// the way the real form does it.
export function Item({ number, children, className }) {
  return (
    <div className={`flex border border-slate-500 bg-white ${className || ''}`}>
      <div className="w-11 shrink-0 border-r border-slate-500 px-1 py-1 text-[10px] font-bold text-slate-800">
        {number}
      </div>
      <div className="flex-1 px-2 py-1 min-w-0 space-y-1.5">{children}</div>
    </div>
  );
}

// A labeled response box with the typed answer inside.
export function Field({ label, value, className }) {
  return (
    <div className={`border border-slate-500 bg-white min-w-0 ${className || ''}`}>
      {label && (
        <p className="text-[9px] font-bold text-slate-800 leading-tight px-1.5 pt-1">{label}</p>
      )}
      <p className="font-mono text-xs text-slate-900 leading-snug px-1.5 pb-1 min-h-[19px] break-words">
        {value || ' '}
      </p>
    </div>
  );
}

// A gray instruction strip between items, like the real form's
// "Have you EVER:" group headers.
export function GroupIntro({ text }) {
  return (
    <div className="bg-slate-100 border border-slate-400 px-2 py-1">
      <p className="text-[10px] font-bold text-slate-800 leading-snug">{text}</p>
    </div>
  );
}

// Small italic fine print, like the notes under real form questions.
export function Note({ children }) {
  return <p className="text-[9px] italic text-slate-600 leading-snug">{children}</p>;
}

// One sheet of the form: A-Number strip at the top, edition footer with
// barcode at the bottom.
export function FormPage({ page, first, children }) {
  return (
    <div className="relative rounded-sm border-2 border-slate-400 bg-white p-3 md:p-5 overflow-hidden space-y-1.5">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-5xl font-black text-slate-200/50 -rotate-12 tracking-widest">
          PRACTICE
        </span>
      </div>
      {!first && (
        <div className="relative flex justify-end items-center gap-1.5">
          <p className="text-[10px] font-bold text-slate-800">A-</p>
          <div className="border border-slate-500 w-44 h-5 bg-white" />
        </div>
      )}
      <div className="relative space-y-1.5">{children}</div>
      <div className="relative pt-2 border-t border-slate-300">
        <div className="flex items-end justify-between gap-3">
          <p className="text-[9px] font-semibold text-slate-700">
            Form N-400 Edition 01/20/25 — practice copy, not a real application
          </p>
          <div className="flex items-center gap-3">
            <div className="h-6 w-28 shrink-0" style={BARCODE_STYLE} aria-hidden="true" />
            <p className="text-[9px] font-bold text-slate-800">Page {page} of 14</p>
          </div>
        </div>
      </div>
    </div>
  );
}