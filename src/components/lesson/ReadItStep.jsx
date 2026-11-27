import React, { useState } from 'react';
import { AmioSays } from '@/components/pathways/Amio';
import MicButton from '@/components/pathways/MicButton';
import Stage, { KeyHints } from '@/components/pathways/Stage';
import { RightPanel } from '@/components/pathways/ResultBanner';
import { Button } from '@/components/pathways/ui';
import useSpeechCapture from '@/components/persona/useSpeechCapture';
import { readingWords } from '@/lib/lessonPlayer';
import { readingTipParts } from '@/lib/readingTips';
import useReadingTip from '@/components/practice/useReadingTip';
import { wordDiff } from '@/components/utils/wordDiff';
import { TryAgain } from '@/components/lesson/lessonParts';

// Step 3 · Read it (frame R32Read): the learner reads the sentence out loud;
// words turn green as they are read clearly (the existing word matching on
// the browser's live transcript; pass at the existing 70%). The tip after a
// miss is chosen on the device (readingTipParts) and shown in the learner's
// language from the translation pack (useReadingTip). Nothing is recorded or saved.

export default function ReadItStep({ lesson, t, onDone }) {
  const sentence = lesson.steps.readIt.sentence;
  const words = lesson.steps.readIt.words;
  const [mode, setMode] = useState('ask'); // ask | right | wrong
  const [heard, setHeard] = useState('');
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');

  const finish = (transcript) => {
    setHeard(transcript || '');
    setMode(readingWords(sentence, transcript).passed ? 'right' : 'wrong');
  };
  const speech = useSpeechCapture(finish);
  const live = readingWords(sentence, mode === 'ask' ? speech.transcript : heard);
  // The tip after a miss, in the learner's language when the pack has it.
  const tip = useReadingTip(mode === 'wrong' && heard ? readingTipParts(wordDiff(sentence, heard)) : null);

  if (mode === 'wrong') {
    return (
      <TryAgain
        t={t}
        askedLabel={t('read_it_aloud')}
        asked={sentence}
        saidLabel={t('you_read')}
        said={heard}
        accepted={[sentence]}
        amioLine={heard ? (tip.mine || tip.en) : t('amio_kind_read')}
        sayLabel={t('the_sentence')}
        sayText={sentence}
        savesReview={false}
        onTryAgain={() => { setMode('ask'); setHeard(''); setTyped(''); speech.reset(); }}
        onSkip={() => onDone('skipped')}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 px-4 lg:px-10 py-5 lg:py-10 flex flex-col max-w-lg lg:max-w-6xl w-full mx-auto">
      {/* Desktop (vision C): the sentence on the left, the mic on the right. */}
      <Stage className="flex-1" side={mode === 'ask' && (
        <div className="mt-auto lg:mt-0 flex flex-col items-center gap-3 pt-4 lg:pt-0">
          {!typing && (
            <MicButton
              listening={speech.listening}
              onStart={speech.start}
              onStop={speech.stop}
              label={t('read_it_aloud')}
              listeningLabel={t('listening')}
              onTypeInstead={() => setTyping(true)}
              typeInsteadLabel={t('type_instead')}
              disabled={!speech.supported}
            />
          )}
          {typing && (
            <form className="w-full flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); finish(typed); }}>
              <label htmlFor="lesson-read-typed" className="text-base font-semibold text-navy">{t('type_answer')}</label>
              <input id="lesson-read-typed" lang="en" dir="ltr" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} className="min-h-[52px] rounded-2xl border border-line bg-white px-4 text-lg text-navy focus:outline-none focus:ring-2 focus:ring-denim" />
              <Button variant="main" type="submit" className="w-full" disabled={!typed.trim()}>{t('check')}</Button>
            </form>
          )}
        </div>
      )}>
        <AmioSays mood="listen" size={56}>{t('read_this')}</AmioSays>
        <section className="rounded-card bg-white border border-line px-5 py-6 lg:px-10 lg:py-12 text-center">
          <p className="text-[1.875rem] lg:text-[3rem] leading-snug font-bold" lang="en" dir="ltr">
            {words.map((w, i) => {
              const ok = live.words[i]?.status === 'correct';
              return (
                <React.Fragment key={i}>
                  <span className={ok ? 'text-correct' : 'text-navy'}>{w}</span>{i < words.length - 1 ? ' ' : ''}
                </React.Fragment>
              );
            })}
            {sentence.trim().endsWith('?') ? <span className="text-navy">?</span> : null}
          </p>
          <p className="mt-3 text-small text-muted">{t('read_key')}</p>
        </section>
        <section>
          <h2 className="text-small font-semibold text-muted">{t('reading_words')}</h2>
          <ul className="mt-2 flex flex-wrap gap-2 list-none m-0 p-0" lang="en" dir="ltr">
            {[...new Set(words)].map((w) => <li key={w} className="rounded-button border border-line bg-white px-4 py-2 text-base font-semibold text-navy">{w}</li>)}
          </ul>
        </section>
        {mode === 'ask' && <KeyHints keys={['space', 'escape']} onNavy={false} />}
      </Stage>
      </div>
      {mode === 'right' && (
        <RightPanel title={t('well_read')} actionLabel={t('next')} onAction={() => onDone('right')} className="sticky bottom-0" />
      )}
    </div>
  );
}
