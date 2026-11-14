import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Hourglass } from 'lucide-react';
import { Button, Tag } from '@/components/pathways/ui';
import N400QuestionCard from './N400QuestionCard';

// The open section (frame R30N400Card): one question card per screen, with
// Back / Next, and "I read this section" after the last card. Learners only
// see approved cards; admins also see draft cards. Completion is saved at the
// section level only (N400Guide).
export function visibleCards(section, isAdmin) {
  return isAdmin ? section.questions : section.questions.filter((q) => q.status === 'approved');
}

export default function N400Section({ section, isAdmin, language, completed, onComplete, cardIndex = 0, onCard }) {
  const cards = visibleCards(section, isAdmin);
  const index = Math.min(Math.max(0, cardIndex), Math.max(0, cards.length - 1));
  const card = cards[index];
  const last = index === cards.length - 1;

  if (!card) {
    return (
      <p className="text-base flex items-center gap-2 rounded-card bg-white border border-line px-4 py-3">
        <Hourglass className="w-4 h-4 shrink-0" aria-hidden="true" /> Coming soon — this section is still being prepared.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {isAdmin && section.status === 'draft' && <Tag tone="red">Draft</Tag>}

      <N400QuestionCard key={card.id} sectionId={section.id} question={card} isAdmin={isAdmin} language={language} />

      <div className="flex gap-2">
        {index > 0 && (
          <Button variant="second" className="flex-1" onClick={() => onCard(index - 1)}>
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" aria-hidden="true" /> Back
          </Button>
        )}
        {!last && (
          <Button variant="main" className="flex-1" onClick={() => onCard(index + 1)}>
            Next card <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
          </Button>
        )}
      </div>

      {last && (completed ? (
        <p className="w-full min-h-[52px] rounded-button bg-white border border-line text-correct font-semibold text-base inline-flex items-center justify-center gap-2 px-4" role="status">
          <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> You read this section
        </p>
      ) : (
        <Button variant="main" className="w-full" onClick={() => onComplete(section.id)}>
          <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> I read this section
        </Button>
      ))}
    </div>
  );
}
