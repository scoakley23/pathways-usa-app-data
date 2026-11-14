import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { NavyTop } from '@/components/pathways/ui';
import useTutorProfile from '@/components/persona/useTutorProfile';

// The navy top of a split page (The Road): an optional Back link, a small
// label (`tag`), the title (h1), a subtitle, and `guide` = one line from the
// tutor signed "— {name}". `children` (actions, switches) go under it.
// `back`: true = browser back (Today when there is no history), or a function.
export default function PageTop({ tag, title, subtitle, guide, back = false, className = '', children }) {
  const navigate = useNavigate();
  const { profile } = useTutorProfile();
  const goBack = () => {
    if (typeof back === 'function') { back(); return; }
    if (window.history.state && window.history.state.idx > 0) navigate(-1);
    else navigate('/');
  };
  return (
    <NavyTop className={`pb-12 ${className}`}>
      <div className="mx-auto max-w-5xl space-y-3">
        {back && (
          <button
            type="button"
            onClick={goBack}
            className="-ms-2 inline-flex items-center gap-1.5 min-h-11 rounded-full px-2 text-base font-semibold text-on-navy hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" /> Back
          </button>
        )}
        {tag && <p className="text-label uppercase text-on-navy">{tag}</p>}
        <h1 className="font-display text-[28px] sm:text-[34px] leading-[1.1]">{title}</h1>
        {subtitle && <p className="text-lg text-on-navy max-w-2xl">{subtitle}</p>}
        {guide && (
          <p className="text-lg font-medium leading-snug max-w-2xl">
            {guide} <span className="whitespace-nowrap text-on-navy">— {profile.name}</span>
          </p>
        )}
        {children && <div className="pt-1">{children}</div>}
      </div>
    </NavyTop>
  );
}
