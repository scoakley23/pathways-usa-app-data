import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, RotateCcw, RefreshCw, Volume2 } from 'lucide-react';
import { Poster, posterOutline, posterSolid, posterTone, posterTool } from '@/components/pathways/ui';
import { speakText } from "@/components/utils/textToSpeech";

// A vocabulary flashcard as a red/blue poster in the run's colors. The word
// is the front; "Show the definition" flips it, then the learner says whether
// they knew it. `index`/`total`/`results` come from the run (Practice.jsx),
// which advances to the next card and records the result for the stars.
export default function FlashcardGame({ words, index = 0, total, results = [], onComplete }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const currentWord = words[index];
  const count = total ?? words.length;

  useEffect(() => { setIsFlipped(false); }, [index]);

  if (!currentWord) return null;

  return (
    <div className="w-full max-w-2xl mx-auto text-pw-navy">
      <Poster
        tone={posterTone(index)}
        className="-mx-4 sm:mx-0 sm:rounded-[14px] min-h-[420px]"
        label={`Flashcards · Card ${index + 1} of ${count}`}
        progress={{ index, total: count, results }}
      >
        <motion.div
          key={`${index}-${isFlipped}`}
          initial={{ rotateY: 90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
          aria-live="polite"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.14em]">{isFlipped ? 'Definition' : 'Word'}</p>
          <h2 className="font-display text-5xl leading-tight break-words sm:text-6xl">{currentWord.word}</h2>
          {isFlipped && (
            <>
              <p className="font-display italic text-2xl leading-snug sm:text-3xl">{currentWord.definition}</p>
              {currentWord.category && (
                <span className="inline-block rounded-full bg-white/15 px-3 py-1.5 text-base font-semibold">{currentWord.category}</span>
              )}
            </>
          )}
        </motion.div>

        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => speakText(currentWord.word)} className={posterTool}>
              <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> Listen
            </button>
            {isFlipped && (
              <button type="button" onClick={() => setIsFlipped(false)} className={posterTool}>
                <RefreshCw className="w-5 h-5 shrink-0" aria-hidden="true" /> Flip back
              </button>
            )}
          </div>

          {isFlipped ? (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onComplete?.(false)} className={posterOutline}>
                <RotateCcw className="w-5 h-5 shrink-0" aria-hidden="true" /> I missed it
              </button>
              <button type="button" onClick={() => onComplete?.(true)} className={posterSolid}>
                <Check className="w-5 h-5 shrink-0" aria-hidden="true" /> I knew it
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setIsFlipped(true)} className={`${posterSolid} w-full sm:w-auto`}>
              Show the definition
            </button>
          )}
        </div>
      </Poster>
    </div>
  );
}
