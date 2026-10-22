import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { PrimaryButton, SecondaryButton } from '@/components/pathways/ui';
import { ArrowRight, RotateCcw, Volume2 } from 'lucide-react';
import { speakText } from "@/components/utils/textToSpeech";

export default function FlashcardGame({ words, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);

  const currentWord = words[currentIndex];
  const isLast = currentIndex === words.length - 1;

  const handleNext = (known) => {
    if (known) setMasteredCount(prev => prev + 1);
    
    // Report performance to parent (for SRS tracking)
    if (onComplete) {
      onComplete(known);
    }
    
    if (isLast) {
      // Session complete
    } else {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    }
  };

  const speak = (text, e) => {
    e.stopPropagation();
    speakText(text);
  };

  return (
    <div className="max-w-md mx-auto h-[500px] flex flex-col text-pw-navy">
      <div className="text-center mb-4 text-sm font-semibold text-pw-muted">
        Card {currentIndex + 1} of {words.length}
      </div>

      <div className="flex-1 relative perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div
          className="w-full h-full relative transition-all duration-500"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <Card 
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 bg-white border border-pw-line shadow-raised rounded-[14px] backface-hidden"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
          >
            <span className="text-xs font-bold text-pw-muted uppercase tracking-widest mb-4">Word</span>
            <h2 className="text-[44px] font-display font-normal text-pw-navy text-center break-words">{currentWord.word}</h2>
            <button
              type="button"
              aria-label="Listen"
              className="mt-6 w-12 h-12 grid place-items-center rounded-full bg-pw-soft text-pw-navy hover:bg-pw-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
              onClick={(e) => speak(currentWord.word, e)}
            >
              <Volume2 className="w-6 h-6" aria-hidden="true" />
            </button>
            <p className="absolute bottom-6 text-pw-muted text-sm">Click to flip</p>
          </Card>

          {/* Back */}
          <Card 
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 bg-pw-navy border-pw-navy text-white shadow-lift rounded-[14px]"
            style={{ 
              transform: 'rotateY(180deg)', 
              backfaceVisibility: 'hidden', 
              WebkitBackfaceVisibility: 'hidden' 
            }}
          >
            <span className="text-xs font-bold text-white/70 uppercase tracking-widest mb-4">Definition</span>
            <p className="text-2xl font-medium text-center leading-relaxed">{currentWord.definition}</p>
            {currentWord.category && (
               <span className="mt-6 px-3 py-1.5 bg-white/15 rounded-full text-sm font-bold">{currentWord.category}</span>
            )}
          </Card>
        </motion.div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <SecondaryButton
          onClick={() => handleNext(false)}
          className="min-h-[52px] border-pw-line"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" /> Study Again
        </SecondaryButton>
        <PrimaryButton
          large
          onClick={() => handleNext(true)}
        >
          I Know It <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </PrimaryButton>
      </div>
    </div>
  );
}