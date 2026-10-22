import React from 'react';
import { CheckCircle2, Hourglass } from 'lucide-react';
import { PrimaryButton, Tag } from '@/components/pathways/ui';
import N400QuestionCard from './N400QuestionCard';

// The open section inside the N-400 folder. Learners only see approved
// question cards; admins also see draft cards. Completion is saved at the
// section level only.
export default function N400Section({ section, isAdmin, language, completed, onComplete }) {
  const visibleCards = isAdmin
    ? section.questions
    : section.questions.filter((q) => q.status === 'approved');

  return (
    <div className="space-y-4">
      {isAdmin && section.status === 'draft' && <Tag tone="red">Draft</Tag>}

      {visibleCards.length === 0 ? (
        <p className="text-base flex items-center gap-2 rounded-[10px] bg-white px-4 py-3">
          <Hourglass className="w-4 h-4 shrink-0" aria-hidden="true" /> Coming soon — this section is still being prepared.
        </p>
      ) : (
        <>
          {visibleCards.map((q) => (
            <N400QuestionCard key={q.id} sectionId={section.id} question={q} isAdmin={isAdmin} language={language} />
          ))}
          {completed ? (
            <p className="w-full min-h-[52px] rounded-xl bg-white text-pw-writing font-semibold text-base inline-flex items-center justify-center gap-2 px-4" role="status">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> You read this section
            </p>
          ) : (
            <PrimaryButton large className="w-full" onClick={() => onComplete(section.id)}>
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> I read this section
            </PrimaryButton>
          )}
        </>
      )}
    </div>
  );
}
