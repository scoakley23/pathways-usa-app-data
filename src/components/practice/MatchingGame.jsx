import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import RunTopBar from './RunTopBar';
import RunScreen from './RunScreen';
import usePracticeText from './usePracticeText';

// Match each word to its definition (Amio v2): a navy screen with the task,
// "n of m matched" (and the run's close button when `onClose` is given) and
// white cards; a matched pair turns navy-2 with a check and "Matched";
// when all pairs are matched the run ends on Round complete
// (`onComplete(pairs)`, nothing is saved).
export default function MatchingGame({ words, onComplete, onClose = null }) {
  const { t } = usePracticeText();
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
    <RunScreen topBar={onClose && <RunTopBar onClose={onClose} />} label={t('match_label')}>
      <h2 className="font-display text-[1.875rem] leading-[1.1]" dir="auto">{t('match_task')}</h2>
      <p className="text-base text-on-navy" aria-live="polite" dir="auto">{t('matched_count', { n: matchedPairs, total: pairs })}</p>
      <p className="min-h-[1.75rem] text-base font-semibold text-white" aria-live="polite" dir="auto">
        {missed && <><X className="inline w-4 h-4 -mt-0.5 me-1" strokeWidth={3} aria-hidden="true" />{t('not_a_pair')}</>}
      </p>
      <div className="grid grid-cols-2 gap-3">
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
              aria-label={isMatched ? `${item.content} (${t('matched')})` : item.content}
              className={`relative min-h-[8rem] overflow-hidden rounded-card border-[2.5px] p-3 text-center flex items-center justify-center text-navy transition-[border-color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy
                ${isMatched
                  ? 'bg-navy-2 border-navy-2 text-white pt-9 cursor-default'
                  : isError
                    ? 'bg-white border-not-yet'
                    : isSelected
                      ? 'bg-sky border-white'
                      : 'bg-white border-white hover:border-gold'}`}
            >
              {isMatched && (
                <span className="pointer-events-none absolute start-2 top-2 inline-flex items-center gap-1 text-small font-bold text-gold" aria-hidden="true">
                  <Check className="w-4 h-4" strokeWidth={3} /> {t('matched')}
                </span>
              )}
              <span className={`leading-snug ${item.type === 'word' ? 'font-display text-2xl' : 'text-base font-medium'}`} lang="en" dir="ltr">
                {item.content}
              </span>
            </motion.button>
          );
        })}
      </div>
    </RunScreen>
  );
}
