import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AmioSays } from '@/components/pathways/Amio';

// A page's top on paper (Amio v2, amio-v2/staff-screens; used by the staff
// and admin pages): an optional Back button, a small label (`tag`), the title
// (h1, Bricolage), a subtitle, `guide` = Amio's one line, and `children`
// (actions) under it. `back`: true = browser back (Today when there is no
// history), or a function. English only on staff screens.
export default function PageTop({ tag, title, subtitle, guide, back = false, className = '', children }) {
  const navigate = useNavigate();
  const goBack = () => {
    if (typeof back === 'function') { back(); return; }
    if (window.history.state && window.history.state.idx > 0) navigate(-1);
    else navigate('/');
  };
  return (
    <div className={`px-4 pt-4 pb-2 text-navy ${className}`}>
      <div className="mx-auto max-w-5xl flex flex-col gap-2">
        {back && (
          <button
            type="button"
            onClick={goBack}
            className="self-start -ms-2 inline-flex items-center gap-1.5 min-h-11 rounded-button px-2 text-base font-semibold text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
          >
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" aria-hidden="true" /> Back
          </button>
        )}
        {tag && <p className="text-base font-semibold text-muted">{tag}</p>}
        <h1 className="font-display text-[1.75rem] sm:text-[2.125rem] leading-[1.1]">{title}</h1>
        {subtitle && <p className="text-base text-muted max-w-2xl">{subtitle}</p>}
        {guide && <AmioSays mood="hello" size={48}>{guide}</AmioSays>}
        {children && <div className="pt-1">{children}</div>}
      </div>
    </div>
  );
}
