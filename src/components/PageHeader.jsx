import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({ title, subtitle, children }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="w-11 h-11 shrink-0 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-colors flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-[34px] leading-tight font-extrabold tracking-[-1px] text-white">
            {title}
          </h1>
          {subtitle && <p className="text-indigo-200 text-base">{subtitle}</p>}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </div>
  );
}