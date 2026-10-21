import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Lightbulb, BookOpen, ChevronRight } from 'lucide-react';

export default function QuizExplanationPanel({ loadingExplanation, explanation, relatedLessons, onNavigate, onContinue }) {
  return (
    <div className="space-y-4 text-pw-navy">
      <div className="p-4 rounded-2xl bg-pw-blue-soft">
        <div className="flex items-center gap-2 mb-2 text-pw-blue-ink">
          <Lightbulb className="w-5 h-5" aria-hidden="true" />
          <span className="font-extrabold">Concept Explanation</span>
        </div>
        {loadingExplanation ? (
          <div className="flex items-center gap-2 text-pw-blue-ink" aria-live="polite">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span className="text-base">Generating explanation...</span>
          </div>
        ) : (
          <p className="text-pw-navy text-base leading-relaxed">{explanation || 'Review the lesson content above for more details on this topic.'}</p>
        )}
      </div>

      {relatedLessons.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-pw-muted flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            Related lessons to review:
          </p>
          <div className="space-y-2">
            {relatedLessons.map(rl => (
              <button key={rl.id} type="button" onClick={() => onNavigate(rl)} className="flex items-center justify-between gap-2 w-full min-h-[44px] text-left px-4 py-3 rounded-2xl bg-white border border-pw-line hover:border-pw-navy hover:bg-pw-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red">
                <span className="text-pw-navy text-base font-bold">{rl.title}</span>
                <ChevronRight className="w-5 h-5 shrink-0 text-pw-muted" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <Button onClick={onContinue} size="lg" className="w-full">
          Continue
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}