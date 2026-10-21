import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TopicArt from '@/components/art/TopicArt';
import { Tag } from '@/components/pathways/ui';

// Page header (style A): back button, optional tag, big title, subtitle, and
// an optional line drawing. `children` (actions) sit under the title on
// phones and on the right on wider screens.
export default function PageHeader({ title, subtitle, children, tag, tagTone = 'navy', art }) {
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
      <div className={`rounded-3xl ${art ? 'bg-pw-blue-soft px-4 pt-4 pb-5 sm:px-6' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="w-11 h-11 shrink-0 rounded-xl bg-white border border-pw-line text-pw-navy hover:bg-pw-soft transition-colors grid place-items-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {art && <TopicArt name={art} className="h-20 w-auto max-w-[60%]" />}
        </div>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="min-w-0 flex-1">
            {tag && <Tag tone={tagTone} className="mb-3">{tag}</Tag>}
            <h1 className="text-[32px] sm:text-[38px] leading-tight font-extrabold tracking-[-0.5px]">{title}</h1>
            {subtitle && <p className="text-pw-muted text-lg mt-1">{subtitle}</p>}
          </div>
          {children && <div className="sm:shrink-0">{children}</div>}
        </div>
      </div>
    </header>
  );
}
