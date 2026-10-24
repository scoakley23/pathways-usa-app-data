import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TutorLine from '@/components/persona/TutorLine';

// The one page header (brand kit, "X2 everywhere"): a quiet back link, a
// small caps label (`tag`), the Instrument Serif title, an optional
// subtitle, and `guide`: one line from the learner's tutor, in serif italic
// and signed in text. No banner and no drawing, so the page's own content
// starts right away. `children` (actions) sit under the title on phones and
// on the right on wider screens. `tagTone` and `art` are accepted for older
// callers and no longer change anything.
export default function PageHeader({ title, subtitle, children, tag, guide }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="text-pw-navy">
      <button
        type="button"
        onClick={handleBack}
        className="-ml-2 inline-flex items-center gap-1.5 min-h-11 rounded-full px-2 text-base font-semibold text-pw-muted hover:text-pw-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" /> Back
      </button>
      <div className="mt-2 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="min-w-0 flex-1">
          {tag && <p className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.14em] text-pw-muted">{tag}</p>}
          <h1 className="font-display text-[40px] sm:text-[52px] leading-[1.02]">{title}</h1>
          {subtitle && <p className="text-pw-muted text-lg mt-2 max-w-2xl">{subtitle}</p>}
        </div>
        {children && <div className="sm:shrink-0">{children}</div>}
      </div>
      {guide && <TutorLine className="mt-3 max-w-2xl">{guide}</TutorLine>}
    </header>
  );
}
