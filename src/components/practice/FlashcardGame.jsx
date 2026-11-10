import React, { useEffect, useState } from 'react';
import { Check, RotateCcw, RefreshCw, Volume2 } from 'lucide-react';
import { Button, Chip, CreamSheet, NavyTop } from '@/components/pathways/ui';
import RunTopBar from './RunTopBar';
import { speakText } from "@/components/utils/textToSpeech";

// A vocabulary flashcard (The Road): the word on navy with Listen (and the
// run's top bar when `onClose` is given); on the cream sheet "Show the
// definition" (the one star-red action), then the definition and "I knew
// it" / "I missed it". `index`/`total` come from the run (Practice.jsx),
// which advances to the next card and records the result.
export default function FlashcardGame({ words, index = 0, total, onComplete, onClose = null }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const currentWord = words[index];
  const count = total ?? words.length;

  useEffect(() => { setIsFlipped(false); }, [index]);

  if (!currentWord) return null;

  return (
    <div>
      <NavyTop className="pb-12">
        <div className="mx-auto max-w-2xl space-y-4">
          {onClose && <RunTopBar onClose={onClose} index={index} total={count} answered={isFlipped} />}
          <p className="text-label uppercase text-on-navy-label">Writing · Flashcards</p>
          <h2 className="font-display text-[40px] sm:text-[48px] leading-[1.05] break-words">{currentWord.word}</h2>
          <Chip onNavy onClick={() => speakText(currentWord.word)}>
            <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> Hear it
          </Chip>
        </div>
      </NavyTop>

      <CreamSheet className="min-h-[50vh]">
        <div className="mx-auto max-w-2xl space-y-5 pb-6 text-ink" aria-live="polite">
          {isFlipped ? (
            <>
              <div className="rounded-card bg-white border border-card-line p-5 space-y-3">
                <p className="text-label uppercase text-ink-label">Definition</p>
                <p className="font-medium text-2xl leading-snug">{currentWord.definition}</p>
                {currentWord.category && (
                  <span className="inline-block rounded-full bg-sand px-3 py-1.5 text-sm font-semibold">{currentWord.category}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="next" className="min-h-[52px]" onClick={() => onComplete?.(true)}>
                  <Check className="w-5 h-5 shrink-0" aria-hidden="true" /> I knew it
                </Button>
                <Button variant="second" className="min-h-[52px]" onClick={() => onComplete?.(false)}>
                  <RotateCcw className="w-5 h-5 shrink-0" aria-hidden="true" /> I missed it
                </Button>
              </div>
              <Button variant="link" className="px-0" onClick={() => setIsFlipped(false)}>
                <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" /> Flip back
              </Button>
            </>
          ) : (
            <>
              <p className="text-base text-ink-2">Do you know what it means? Say it to yourself, then check.</p>
              <Button variant="main" className="w-full min-h-[60px]" onClick={() => setIsFlipped(true)}>
                Show the definition
              </Button>
            </>
          )}
        </div>
      </CreamSheet>
    </div>
  );
}
