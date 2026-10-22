import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Tag } from '@/components/pathways/ui';

export default function FlashcardView({ flashcards }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center py-8 text-base text-pw-muted">
        No flashcards available for this lesson.
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="space-y-4 text-pw-navy">
      <div className="flex justify-between items-center gap-2">
        <Tag tone="blue">Card {currentIndex + 1} of {flashcards.length}</Tag>
        <span className="text-sm font-bold text-pw-muted">Click card to flip</span>
      </div>

      <div
        onClick={handleFlip}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlip(); } }}
        role="button"
        tabIndex={0}
        aria-pressed={isFlipped}
        style={{ perspective: '1000px' }}
        className="cursor-pointer w-full h-80 rounded-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2"
      >
        <div
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Front of card */}
          <div
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            className="absolute inset-0 rounded-[14px] border border-pw-line bg-white shadow-raised flex items-center justify-center p-6"
          >
            <div className="text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-pw-muted">Term</span>
              <h3 className="text-3xl font-extrabold text-pw-navy break-words">{currentCard.term}</h3>
            </div>
          </div>

          {/* Back of card */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className="absolute inset-0 rounded-[14px] bg-pw-blue-soft shadow-raised flex items-center justify-center p-6 overflow-y-auto"
          >
            <div className="text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-pw-blue-ink">Definition</span>
              <p className="text-xl font-bold text-pw-navy leading-relaxed">{currentCard.definition}</p>
              {currentCard.example && (
                <div className="mt-4 pt-4 border-t border-pw-line">
                  <span className="text-xs font-bold uppercase tracking-widest text-pw-blue-ink">Example</span>
                  <p className="text-base text-pw-muted mt-2 italic">{currentCard.example}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={handlePrevious}
          variant="outline"
          disabled={flashcards.length <= 1}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={() => {
            setCurrentIndex(0);
            setIsFlipped(false);
          }}
          variant="ghost"
          size="sm"
          className="col-span-2 order-last"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Restart
        </Button>

        <Button
          onClick={handleNext}
          variant="outline"
          disabled={flashcards.length <= 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}