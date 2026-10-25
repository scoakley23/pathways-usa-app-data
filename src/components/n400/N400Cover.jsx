import React from 'react';
import { Link } from 'react-router-dom';
import { tabFor, SECTION_BORDER, SECTION_SOLID } from './N400Folder';

// The N-400 guide opens on a simple folder cover, not a page of text: one
// short paragraph, the sections read (one chip per section in its color),
// "We never save your answers", Vía's handwritten pointer to a lawyer, then
// "Open the folder". The full wording is one step further in.
export default function N400Cover({ sections, completedIds = [], onOpen, tutorName }) {
  const read = sections.filter((s) => completedIds.includes(s.id)).length;
  return (
    <div className="space-y-6 text-pw-navy">
      <div className="relative max-w-xl -rotate-[1deg]">
        <span className="inline-block rounded-t-[10px] bg-pw-manila px-5 pt-2 pb-1.5 text-sm font-bold uppercase tracking-[0.14em]">Form N-400</span>
        <svg viewBox="0 0 24 60" className="absolute right-7 top-1 w-[18px] h-[46px]" aria-hidden="true">
          <path d="M8 54V12a4 4 0 0 1 8 0v36a6 6 0 0 1-12 0V16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="text-pw-muted" />
        </svg>
        <div className="rounded-[14px] rounded-tl-none bg-pw-manila px-4 pt-5 pb-5 sm:px-6 shadow-[0_10px_24px_rgba(20,38,74,0.16)] space-y-4">
          <p className="rotate-[0.6deg] bg-white px-4 py-4 text-lg leading-relaxed shadow-[0_2px_6px_rgba(20,38,74,0.10)]">
            Your interview officer will go over your N-400 with you. Here you learn what each question means, in plain words.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex gap-1" aria-hidden="true">
              {sections.map((s) => {
                const tone = tabFor(s).tone;
                const done = completedIds.includes(s.id);
                return <span key={s.id} className={`block w-4 h-[22px] rounded-[4px] border-[2.5px] ${SECTION_BORDER[tone]} ${done ? SECTION_SOLID[tone] : 'bg-transparent'}`} />;
              })}
            </span>
            <span className="text-base font-bold">{read} of {sections.length} sections read</span>
          </div>
          <p className="text-[15px] text-pw-muted">We never save your answers to the N-400.</p>
        </div>
      </div>

      <Link
        to="/lawyer-first"
        className="ms-auto block w-fit -rotate-2 font-hand text-[25px] font-bold leading-tight text-pw-red-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy rounded"
      >
        how it applies to you → a lawyer <span className="sr-only">(Talk to a lawyer first){tutorName ? `, from ${tutorName}` : ''}</span>
      </Link>

      <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
        <button
          type="button"
          onClick={onOpen}
          className="min-h-[56px] flex-1 rounded-full bg-pw-navy text-white text-lg font-semibold hover:bg-pw-navy-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2"
        >
          Open the folder
        </button>
        <Link
          to="/n400-coach"
          className="min-h-[56px] flex-1 rounded-full border-2 border-pw-navy bg-white text-pw-navy text-lg font-semibold inline-flex items-center justify-center hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2"
        >
          Practice with {tutorName || 'your tutor'}
        </Link>
      </div>
    </div>
  );
}
