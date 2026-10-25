import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eyebrow } from '@/components/pathways/ui';

// Match each word to its definition: white index cards on the Slate desk.
// A matched pair gets a navy MATCHED stamp; when all pairs are matched the
// run ends on the summary poster (`onComplete(pairs)`, nothing is saved).
export default function MatchingGame({ words, onComplete }) {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Initialize game board
    // Take max 6 pairs to fit screen
    const gameWords = words.slice(0, 6);
    const cards = [];
    
    gameWords.forEach((w) => {
      // Add word card
      cards.push({
        id: `word-${w.id}`,
        content: w.word,
        type: 'word',
        pairId: w.id
      });
      // Add definition card
      cards.push({
        id: `def-${w.id}`,
        content: w.definition,
        type: 'def',
        pairId: w.id
      });
    });

    // Shuffle
    setItems(cards.sort(() => Math.random() - 0.5));
  }, [words]);

  useEffect(() => {
    if (matchedIds.length > 0 && matchedIds.length === items.length) {
      const timer = setTimeout(() => onComplete(items.length / 2), 1200);
      return () => clearTimeout(timer);
    }
  }, [matchedIds, items]);

  const handleCardClick = (item) => {
    if (isChecking || matchedIds.includes(item.id) || selectedIds.includes(item.id)) return;

    const newSelected = [...selectedIds, item.id];
    setSelectedIds(newSelected);

    if (newSelected.length === 2) {
      setIsChecking(true);
      const [firstId, secondId] = newSelected;
      const firstItem = items.find(i => i.id === firstId);
      const secondItem = items.find(i => i.id === secondId);

      if (firstItem.pairId === secondItem.pairId) {
        // Match!
        setTimeout(() => {
          setMatchedIds(prev => [...prev, firstId, secondId]);
          setSelectedIds([]);
          setIsChecking(false);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setSelectedIds([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  const pairs = items.length / 2;
  const matchedPairs = matchedIds.length / 2;
  const missed = isChecking && selectedIds.length === 2
    && items.find(i => i.id === selectedIds[0])?.pairId !== items.find(i => i.id === selectedIds[1])?.pairId;

  return (
    <div className="max-w-4xl mx-auto text-pw-navy">
      <div className="px-1">
        <Eyebrow>Matching · Words and meanings</Eyebrow>
        <h2 className="mt-1 font-display text-3xl leading-tight">Match each word to what it means.</h2>
      </div>
      <p className="mt-2 px-1 text-base text-pw-muted" aria-live="polite">
        <span className="font-display text-2xl text-pw-navy">{matchedPairs}</span> of{' '}
        <span className="font-display text-2xl text-pw-navy">{pairs}</span> matched
        {missed && <span className="ms-2 font-semibold text-pw-red-ink">Not a pair. Try again.</span>}
      </p>

      <div className="mt-4 -mx-4 bg-pw-slate px-3 py-4 sm:mx-0 sm:rounded-[14px] sm:p-5">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isMatched = matchedIds.includes(item.id);
            const isError = isSelected && missed;

            return (
              <motion.button
                type="button"
                key={item.id}
                layout
                initial={{ scale: 0.95, opacity: 0 }}
                animate={isError ? { x: [0, -6, 6, -4, 4, 0], opacity: 1, scale: 1 } : { scale: 1, opacity: 1, x: 0 }}
                transition={{ duration: isError ? 0.4 : 0.2 }}
                whileTap={!isMatched && !isChecking ? { scale: 0.97 } : {}}
                onClick={() => handleCardClick(item)}
                disabled={isMatched}
                aria-pressed={isSelected}
                aria-label={isMatched ? `${item.content} (matched)` : item.content}
                className={`relative min-h-[128px] overflow-hidden rounded-[14px] border bg-white p-3 text-center flex items-center justify-center transition-[box-shadow,border-color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2 focus-visible:ring-offset-pw-slate
                  ${isMatched
                    ? 'border-pw-line bg-pw-page pt-9 shadow-none cursor-default'
                    : isError
                      ? 'border-pw-red-ink ring-2 ring-pw-red-ink shadow-raised'
                      : isSelected
                        ? 'border-pw-navy ring-2 ring-pw-navy shadow-lift'
                        : 'border-pw-line shadow-raised hover:border-pw-navy'}`}
              >
                {isMatched && (
                  <span className="pointer-events-none absolute end-2 top-2 -rotate-[8deg] rounded-md border-2 border-pw-navy px-1.5 text-xs font-bold uppercase tracking-[0.12em] text-pw-navy" aria-hidden="true">
                    Matched
                  </span>
                )}
                <span className={`leading-snug ${item.type === 'word' ? 'font-display text-2xl' : 'text-base font-medium'} ${isMatched ? 'text-pw-muted' : 'text-pw-navy'}`}>
                  {item.content}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
