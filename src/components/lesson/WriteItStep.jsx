import React, { useEffect, useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { AmioSays } from '@/components/pathways/Amio';
import { RightPanel } from '@/components/pathways/ResultBanner';
import { Button } from '@/components/pathways/ui';
import { speakText } from '@/components/utils/textToSpeech';
import { checkWriting, wordBank } from '@/lib/lessonPlayer';
import { TryAgain } from '@/components/lesson/lessonParts';

// Step 4 · Write it (frame R32Write): Play / Slow, then level 1 = tap the
// words from a word bank (the sentence's words plus its extra words), level
// 2 = type it. Checked with the existing dictation check, plus gentle tips
// for a capital letter and a period. `level` comes from the learner's
// profile; each level-1 pass counts toward level 2 (onWritten).

export default function WriteItStep({ lesson, level = 1, t, onWritten, onDone }) {
  const sentence = lesson.steps.writeIt.sentence;
  const bank = useMemo(() => wordBank(sentence, lesson.steps.writeIt.distractorWords), [sentence, lesson]);
  const [picked, setPicked] = useState([]); // tile ids in order
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState(null); // checkWriting result
  const written = level === 1 ? picked.map((id) => bank.find((b) => b.id === id).word).join(' ') : typed;

  useEffect(() => { speakText(sentence, 'en'); }, [sentence]);

  const check = () => {
    const r = checkWriting(sentence, written);
    setResult(r);
    onWritten?.(r.isCorrect);
  };
  const reset = () => { setResult(null); setPicked([]); setTyped(''); };

  if (result && !result.isCorrect) {
    return (
      <TryAgain
        t={t}
        askedLabel={t('step_writeIt')}
        asked={sentence}
        saidLabel={t('you_wrote')}
        said={written}
        accepted={[sentence]}
        amioLine={t('amio_kind_write')}
        sayLabel={t('the_sentence')}
        sayText={sentence}
        savesReview={false}
        onTryAgain={reset}
        onSkip={() => onDone('skipped')}
      />
    );
  }

  const tile = 'min-h-tap rounded-2xl border border-line bg-white px-4 text-lg font-semibold text-navy shadow-[0_3px_0_theme(colors.line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim';

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 px-4 py-5 flex flex-col gap-5 max-w-lg w-full mx-auto">
        <AmioSays mood="happy" size={56}>{level === 1 ? t('write_this') : t('write_this_typed')}</AmioSays>
        <div className="flex justify-center gap-4">
          <button type="button" onClick={() => speakText(sentence, 'en')} aria-label={t('play')} className="w-16 h-16 grid place-items-center rounded-full bg-denim text-white shadow-lip hover:bg-denim-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-denim/40">
            <Volume2 className="w-7 h-7" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => speakText(sentence, 'en', { rate: 0.6 })} className="w-16 h-16 grid place-items-center rounded-full bg-white border border-line text-base font-semibold text-navy hover:border-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
            {t('slow')}
          </button>
        </div>

        {level === 1 ? (
          <>
            <section aria-label={t('tap_words')} className="min-h-[120px] rounded-card bg-white border border-line p-4 flex flex-wrap gap-2 content-start" lang="en" dir="ltr">
              {picked.length === 0 && <span className="text-base text-muted self-center">{t('tap_words')}</span>}
              {picked.map((id) => {
                const w = bank.find((b) => b.id === id).word;
                return (
                  <button key={id} type="button" className={tile} aria-label={t('remove_word', { word: w })} onClick={() => setPicked((p) => p.filter((x) => x !== id))}>{w}</button>
                );
              })}
            </section>
            <div className="flex flex-wrap justify-center gap-2" lang="en" dir="ltr">
              {bank.map((b) => {
                const used = picked.includes(b.id);
                return (
                  <button key={b.id} type="button" disabled={used} onClick={() => setPicked((p) => [...p, b.id])} className={`${tile} ${used ? 'opacity-40 shadow-none' : ''}`}>{b.word}</button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <label htmlFor="lesson-write" className="text-base font-semibold text-navy">{t('level_2')}</label>
            <textarea id="lesson-write" lang="en" dir="ltr" rows={3} autoComplete="off" autoCapitalize="none" spellCheck={false} value={typed} onChange={(e) => setTyped(e.target.value)} className="rounded-2xl border border-line bg-white px-4 py-3 text-lg text-navy focus:outline-none focus:ring-2 focus:ring-denim" />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 text-small">
          <span className={`rounded-button px-3 py-1.5 font-semibold ${level === 1 ? 'bg-denim text-white' : 'text-muted'}`}>{t('level_1')}</span>
          <span className={`rounded-button px-3 py-1.5 font-semibold ${level === 2 ? 'bg-denim text-white' : 'text-muted'}`}>{t('level_2')}</span>
        </div>
      </div>
      {result?.isCorrect ? (
        <RightPanel
          title={t('well_written')}
          actionLabel={t('next')}
          onAction={() => onDone('right')}
          className="sticky bottom-0"
          note={result.fixes.includes('capital') || result.fixes.includes('period') ? (
            <>
              {result.fixes.includes('capital') && <span className="block">{t('fix_capital')}</span>}
              {result.fixes.includes('period') && <span className="block">{t('fix_period')}</span>}
            </>
          ) : null}
        />
      ) : (
        <div className="sticky bottom-0 bg-paper px-4 pt-2 pb-6 max-w-lg w-full mx-auto">
          <Button variant="main" className="w-full" disabled={!written.trim()} onClick={check}>{t('check')}</Button>
        </div>
      )}
    </div>
  );
}
