import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export default function FlashcardView({ flashcards }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
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
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm text-slate-600">
        <span>Card {currentIndex + 1} of {flashcards.length}</span>
        <span>Click card to flip</span>
      </div>

      <div 
        className="perspective-1000 cursor-pointer"
        onClick={handleFlip}
      >
        <div 
          className={`relative w-full h-80 transition-transform duration-500 transform-style-preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front of card */}
          <Card 
            className={`absolute w-full h-full backface-hidden ${
              isFlipped ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-8">
              <div className="text-center space-y-4">
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                  Term
                </span>
                <h3 className="text-3xl font-bold text-slate-900">
                  {currentCard.term}
                </h3>
              </div>
            </CardContent>
          </Card>

          {/* Back of card */}
          <Card 
            className={`absolute w-full h-full backface-hidden bg-blue-50 border-blue-200 ${
              isFlipped ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-8">
              <div className="text-center space-y-4">
                <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                  Definition
                </span>
                <p className="text-xl text-slate-800 leading-relaxed">
                  {currentCard.definition}
                </p>
                {currentCard.example && (
                  <div className="mt-4 pt-4 border-t border-blue-300">
                    <span className="text-xs font-semibold text-blue-600 uppercase">Example</span>
                    <p className="text-sm text-slate-700 mt-2 italic">
                      {currentCard.example}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
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