import React, { useEffect, useState } from 'react';
import { MessageCircle, Volume2 } from 'lucide-react';
import { AmioSays } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { speakText } from '@/components/utils/textToSpeech';
import { HELP_KINDS } from '@/lib/story';

// "I don't understand" in the story player: a bottom sheet where the learner
// taps one of three questions about the line and Amio answers with one short,
// pre-written, reviewed line (the scene's `help`, src/lib/story.js; never AI
// live), in the learner's language with "In English". Then the lesson's new
// words in this line, and "Talk to a person" for more help. Nothing is saved.
//
// help: { simpler, example, why } in English; mine(kind) = the translation or
// null. words: [{ word, meaning, mine }].
export default function StoryHelpSheet({ open, onOpenChange, line, help = {}, mine, language, words = [], t, onTalk }) {
  const kinds = HELP_KINDS.filter((k) => help[k]);
  const [kind, setKind] = useState(kinds[0] || null);
  const [english, setEnglish] = useState(false);
  const first = kinds[0] || null;
  useEffect(() => { if (open) { setKind(first); setEnglish(false); } }, [open, line, first]);

  const translated = kind && language !== 'en' ? mine(kind) : null;
  const answer = kind ? ((!english && translated) || help[kind]) : null;
  const answerLang = translated && !english ? language : 'en';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-sheet bg-paper text-navy px-4 pt-6 pb-8 max-h-[88vh] overflow-y-auto">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          <SheetTitle className="pe-10 font-display text-[1.5rem] leading-tight text-navy" dir="auto">{t('story_help_title')}</SheetTitle>
          <p className="rounded-card bg-sky-soft px-4 py-3 text-base font-semibold text-navy" dir="auto">{line}</p>

          {kinds.length > 0 && (
            <div className="flex flex-col gap-2" role="group" aria-label={t('story_help_pick')}>
              {kinds.map((k) => {
                const on = k === kind;
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => { setKind(k); setEnglish(false); }}
                    className={`min-h-tap w-full rounded-button px-4 py-3 text-start text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${on ? 'bg-navy text-white border-2 border-navy' : 'bg-white text-navy border-2 border-line hover:border-denim'}`}
                  >
                    {t(`story_help_${k}`)}
                  </button>
                );
              })}
            </div>
          )}

          {answer && (
            <section className="flex flex-col gap-2" aria-live="polite">
              <AmioSays mood="speaking" size={56}>
                <span className="block text-base font-semibold leading-snug" dir="auto" lang={answerLang}>{answer}</span>
              </AmioSays>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => speakText(answer, answerLang)} className="min-h-tap inline-flex items-center gap-2 rounded-button border-2 border-line bg-white px-4 text-base font-semibold text-navy hover:border-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
                  <Volume2 className="w-5 h-5 text-denim" aria-hidden="true" />{t('story_help_hear')}
                </button>
                {translated && (
                  <button type="button" onClick={() => setEnglish((v) => !v)} aria-pressed={english} className="min-h-tap px-2 text-base font-semibold text-denim underline underline-offset-4">
                    {english ? t('in_my_language') : t('in_english')}
                  </button>
                )}
              </div>
            </section>
          )}

          {words.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-small font-semibold text-muted">{t('story_help_words')}</h3>
              {words.map((w) => (
                <button
                  key={w.word}
                  type="button"
                  onClick={() => speakText(w.word, 'en')}
                  aria-label={t('hear_word', { word: w.word })}
                  className="flex items-center justify-between gap-3 rounded-card bg-gold-soft border-2 border-gold px-4 py-3 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
                >
                  <span className="min-w-0">
                    <span className="block text-lg font-bold text-navy" lang="en" dir="ltr">{w.word}</span>
                    <span className="block text-base text-navy" dir="auto">{(language !== 'en' && w.mine) || w.meaning}</span>
                  </span>
                  <Volume2 className="w-6 h-6 shrink-0 text-navy" aria-hidden="true" />
                </button>
              ))}
            </section>
          )}

          {onTalk && (
            <section className="flex flex-col gap-2 border-t border-line pt-4">
              <h3 className="text-base font-semibold text-navy">{t('story_help_more')}</h3>
              <Button variant="second" className="w-full" onClick={onTalk}>
                <MessageCircle className="w-5 h-5" aria-hidden="true" />{t('story_help_person')}
              </Button>
            </section>
          )}

          <Button variant="main" className="w-full" onClick={() => onOpenChange(false)}>{t('story_help_close')}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
