import React, { useEffect, useState } from 'react';
import { Check, RotateCcw, RefreshCw, Volume2 } from 'lucide-react';
import { Button } from '@/components/pathways/ui';
import RunTopBar from './RunTopBar';
import RunScreen, { NavyChip } from './RunScreen';
import usePracticeText from './usePracticeText';
import { speakText } from "@/components/utils/textToSpeech";

// A vocabulary flashcard (Amio v2): the word on navy with Hear it (and the
// run's top bar when `onClose` is given) and "Show the definition"; then a
// bottom panel with the definition and "I knew it" / "I missed it".
// `index`/`total` come from the run (Practice.jsx), which advances to the
// next card and records the result.
export default function FlashcardGame({ words, index = 0, total, onComplete, onClose = null }) {
  const { t } = usePracticeText();
  const [isFlipped, setIsFlipped] = useState(false);
  const currentWord = words[index];
  const count = total ?? words.length;

  useEffect(() => { setIsFlipped(false); }, [index]);

  if (!currentWord) return null;

  const panel = isFlipped && (
    <section className="rounded-t-sheet bg-paper text-navy px-5 pt-5 pb-7" aria-live="polite">
      <div className="mx-auto max-w-lg flex flex-col gap-4">
        <div className="rounded-card bg-white border border-line p-5 flex flex-col gap-3">
          <p className="text-small font-semibold text-muted">{t('definition')}</p>
          <p className="font-medium text-2xl leading-snug" lang="en" dir="ltr">{currentWord.definition}</p>
          {currentWord.category && (
            <span className="self-start rounded-button bg-line-soft px-3 py-1.5 text-base font-semibold" lang="en">{currentWord.category}</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="main" className="px-3" onClick={() => onComplete?.(true)}>
            <Check className="w-5 h-5 shrink-0" aria-hidden="true" /> {t('knew_it')}
          </Button>
          <Button variant="second" onClick={() => onComplete?.(false)}>
            <RotateCcw className="w-5 h-5 shrink-0" aria-hidden="true" /> {t('missed_it')}
          </Button>
        </div>
        <Button variant="link" className="self-start px-0" onClick={() => setIsFlipped(false)}>
          <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" /> {t('flip_back')}
        </Button>
      </div>
    </section>
  );

  return (
    <RunScreen
      topBar={onClose && <RunTopBar onClose={onClose} index={index} total={count} answered={isFlipped} />}
      label={t('flash_label')}
      panel={panel}
    >
      <h2 className="font-display text-[2.75rem] leading-[1.05] break-words" lang="en" dir="ltr">{currentWord.word}</h2>
      <div>
        <NavyChip onClick={() => speakText(currentWord.word)}>
          <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> {t('hear_it')}
        </NavyChip>
      </div>
      {!isFlipped && (
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-base text-on-navy" dir="auto">{t('flash_prompt')}</p>
          <Button variant="main" onNavy className="w-full" onClick={() => setIsFlipped(true)}>{t('show_definition')}</Button>
        </div>
      )}
    </RunScreen>
  );
}
