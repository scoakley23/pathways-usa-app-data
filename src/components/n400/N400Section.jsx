import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, CheckCircle2, Hourglass } from 'lucide-react';
import N400QuestionCard from './N400QuestionCard';

// One section of the N-400 guide. Learners only see approved question cards;
// admins also see draft cards. Completion is saved at the section level only.
export default function N400Section({ section, isAdmin, language, completed, onComplete }) {
  const [open, setOpen] = useState(false);
  const visibleCards = isAdmin
    ? section.questions
    : section.questions.filter((q) => q.status === 'approved');

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-5 md:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{section.title}</h2>
            <p className="text-sm" style={{ color: '#4A5A78' }}>
              {section.partLabel}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isAdmin && (
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                Draft
              </Badge>
            )}
            {completed && (
              <Badge className="bg-green-100 text-green-700 border border-green-200">Completed</Badge>
            )}
          </div>
        </div>

        {visibleCards.length === 0 ? (
          <p className="text-sm flex items-center gap-2" style={{ color: '#4A5A78' }}>
            <Hourglass className="w-4 h-4" /> Coming soon — this section is still being prepared.
          </p>
        ) : (
          <>
            <Button variant="outline" onClick={() => setOpen(!open)} className="w-full justify-between">
              {open
                ? 'Hide questions'
                : `Show ${visibleCards.length} question card${visibleCards.length > 1 ? 's' : ''}`}
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            {open && (
              <div className="space-y-4">
                {visibleCards.map((q) => (
                  <N400QuestionCard key={q.id} sectionId={section.id} question={q} isAdmin={isAdmin} language={language} />
                ))}
                <Button className="w-full h-11" disabled={completed} onClick={() => onComplete(section.id)}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {completed ? 'Section completed' : `Mark "${section.title}" as complete`}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}