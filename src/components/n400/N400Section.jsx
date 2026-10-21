import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Hourglass } from 'lucide-react';
import { RaisedCard, Tag, PrimaryButton } from '@/components/pathways/ui';
import N400QuestionCard from './N400QuestionCard';

// One section of the N-400 guide. Learners only see approved question cards;
// admins also see draft cards. Completion is saved at the section level only.
export default function N400Section({ section, isAdmin, language, completed, onComplete }) {
  const [open, setOpen] = useState(false);
  const visibleCards = isAdmin
    ? section.questions
    : section.questions.filter((q) => q.status === 'approved');

  return (
    <RaisedCard padding="p-4 sm:p-6" className={`space-y-4 ${completed ? 'border-pw-green-ink/30' : ''}`}>
      <div>
        <div className="min-w-0 space-y-1">
          {(completed || (isAdmin && section.status === 'draft')) && (
            <div className="flex flex-wrap gap-2 mb-2">
              {completed && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold bg-pw-green-soft text-pw-green-ink">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Completed
                </span>
              )}
              {isAdmin && section.status === 'draft' && <Tag tone="red">Draft</Tag>}
            </div>
          )}
          <h2 className="text-[22px] leading-snug font-extrabold text-pw-navy px-1">{section.title}</h2>
          <p className="text-sm text-pw-muted px-1">{section.partLabel}</p>
        </div>
      </div>

      {visibleCards.length === 0 ? (
        <p className="text-base flex items-center gap-2 rounded-2xl bg-pw-soft px-4 py-3 text-pw-muted">
          <Hourglass className="w-4 h-4 shrink-0" /> Coming soon — this section is still being prepared.
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="w-full min-h-[48px] rounded-2xl bg-pw-soft hover:bg-[#E2E8F2] text-pw-navy font-bold text-base px-4 inline-flex items-center justify-between gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
          >
            {open
              ? 'Hide questions'
              : `Show ${visibleCards.length} question card${visibleCards.length > 1 ? 's' : ''}`}
            {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {open && (
            <div className="space-y-4">
              {visibleCards.map((q) => (
                <N400QuestionCard key={q.id} sectionId={section.id} question={q} isAdmin={isAdmin} language={language} />
              ))}
              {completed ? (
                <div
                  className="w-full min-h-[52px] rounded-2xl bg-pw-green-soft text-pw-green-ink font-bold text-base inline-flex items-center justify-center gap-2 px-4"
                  role="status"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Section completed
                </div>
              ) : (
                <PrimaryButton large className="w-full" onClick={() => onComplete(section.id)}>
                  <CheckCircle2 className="w-5 h-5" />
                  {`Mark "${section.title}" as complete`}
                </PrimaryButton>
              )}
            </div>
          )}
        </>
      )}
    </RaisedCard>
  );
}
