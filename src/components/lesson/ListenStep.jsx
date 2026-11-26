import React, { useEffect, useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { Amio } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';
import LessonPictures from '@/components/course/LessonPictures';
import { speakText } from '@/components/utils/textToSpeech';
import { translateStrings } from '@/lib/translateStrings';
import { LANGUAGES } from '@/lib/languages';
import { picturesFor } from '@/lib/lessonPictures';
import { storyFor } from '@/lib/story';
import StoryListen from '@/components/lesson/StoryListen';
import LessonVideo from '@/components/lesson/LessonVideo';
import { videoFor, shownWords } from '@/lib/lessonVideo';

// Step 1 · Listen (frame R33Listen): Amio's facts in the learner's language
// ("Said in your language", "In English" to switch), the lesson's pictures,
// and the new words: tap a card to hear the word in English.
// The facts are reviewed course content: translated from the translation
// pack, or (switch off, no pack) by the existing on-demand translation.

export function useLessonTranslation(lesson, language) {
  const strings = useMemo(() => {
    const s = {};
    lesson.steps.listen.facts.forEach((f, i) => { s[`f${i}`] = f; });
    lesson.steps.listen.newWords.forEach((w, i) => { s[`m${i}`] = w.meaning; });
    picturesFor(lesson.id).forEach((p, i) => { if (p.caption) s[`c${i}`] = p.caption; });
    (lesson.steps.listen.story || []).forEach((item, i) => {
      if (item.say) s[`s${i}`] = item.say;
      if (item.check) {
        s[`k${i}`] = item.check.statement || item.check.prompt;
        (item.check.choices || []).forEach((c, j) => { s[`k${i}_${j}`] = c; });
      }
    });
    return s;
  }, [lesson]);
  const [mine, setMine] = useState(null);
  useEffect(() => {
    setMine(null);
    if (!language || language === 'en') return undefined;
    let active = true;
    const langName = LANGUAGES.find((l) => l.value === language)?.label || language;
    translateStrings({
      language,
      storageKey: `pathways_course_v2_${lesson.id}_${language}`,
      strings,
      buildPrompt: (part) => `Translate every value in this JSON into ${langName}, in short, plain sentences for adults studying for the U.S. citizenship test. Keep names, numbers and dates exactly. Keep the keys. Return a JSON object with the same keys.\n\n${JSON.stringify(part, null, 2)}`,
      onPartial: (sofar) => { if (active) setMine(sofar); },
    }).then((done) => { if (active) setMine(done); }).catch(() => {});
    return () => { active = false; };
  }, [lesson.id, language, strings]);
  return mine;
}

export default function ListenStep({ lesson, language, t, onDone, showDrafts = false }) {
  const mine = useLessonTranslation(lesson, language);
  const story = storyFor(lesson, { showDrafts });
  const [storyDone, setStoryDone] = useState(false);
  const [english, setEnglish] = useState(false);
  const { facts } = lesson.steps.listen;
  const newWords = shownWords(lesson.steps.listen, { showDrafts });
  const video = videoFor(lesson, { showDrafts });
  const translated = language !== 'en' && mine && facts.every((_, i) => mine[`f${i}`]);
  const showMine = translated && !english;
  const fact = (f, i) => (showMine ? mine[`f${i}`] : f);
  const meaning = (w) => (language !== 'en' && !english && mine?.[`m${w.index}`]) || w.meaning;

  // A reviewed story (or a draft, for admins) replaces the facts list; the
  // new words follow it.
  if (story && !storyDone) return <StoryListen story={story} language={language} mine={mine} t={t} onEnd={() => setStoryDone(true)} />;

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 px-4 py-5 flex flex-col gap-4 max-w-lg w-full mx-auto">
        {story ? (
          <button type="button" onClick={() => setStoryDone(false)} className="self-start min-h-tap text-base font-semibold text-denim underline underline-offset-4">{t('story_watch_again')}</button>
        ) : (
        <section className="rounded-card bg-white border border-line p-5 flex gap-4">
          <Amio mood="happy" size={56} className="shrink-0" />
          <div className="min-w-0 flex flex-col gap-3">
            {showMine && <span className="self-start rounded-button bg-tint px-3 py-1 text-small font-semibold text-navy">{t('said_in_language')}</span>}
            <ul className="flex flex-col gap-3 list-none m-0 p-0" lang={showMine ? language : 'en'} dir="auto">
              {facts.map((f, i) => <li key={i} className="text-base text-navy leading-relaxed">{fact(f, i)}</li>)}
            </ul>
            {translated && (
              <button type="button" onClick={() => setEnglish((v) => !v)} aria-pressed={english} className="self-start min-h-tap text-base font-semibold text-denim underline underline-offset-4">
                {english ? t('in_my_language') : t('in_english')}
              </button>
            )}
          </div>
        </section>
        )}

        {!story && <LessonPictures lessonId={lesson.id} caption={(p, i) => (language !== 'en' && !english && mine?.[`c${i}`]) || p.caption} />}

        {video && <LessonVideo video={video} t={t} />}

        {newWords.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-small font-semibold text-muted">{t('new_words')}</h2>
            {newWords.map((w) => (
              <button
                key={w.word}
                type="button"
                onClick={() => speakText(w.word, 'en')}
                aria-label={t('hear_word', { word: w.word })}
                className="flex items-center justify-between gap-3 rounded-card bg-white border border-line px-5 py-4 text-start hover:border-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
              >
                <span className="min-w-0">
                  <span className="block text-lg font-bold text-navy" lang="en" dir="ltr">{w.word}</span>
                  <span className="block text-base text-muted" dir="auto">{meaning(w)}</span>
                  {w.draft && <span className="mt-1 inline-block rounded-button bg-tint px-2 py-0.5 text-small font-semibold text-navy">{t('word_draft')}</span>}
                </span>
                <Volume2 className="w-6 h-6 shrink-0 text-denim" aria-hidden="true" />
              </button>
            ))}
          </section>
        )}
      </div>
      <div className="sticky bottom-0 bg-paper px-4 pt-2 pb-6 max-w-lg w-full mx-auto">
        <Button variant="main" className="w-full" onClick={() => onDone('right')}>{t('continue')}</Button>
      </div>
    </div>
  );
}
