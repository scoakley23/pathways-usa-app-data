import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { LANGUAGES } from './useLessonTranslation';
import { HOME_STRINGS } from '@/components/home/homeStrings';
import { getCachedTranslation, translateStrings } from '@/lib/translateStrings';

const CACHE_PREFIX = 'pathways_home_tr_v11_'; // bump when HOME_STRINGS changes

// Translates the home screen's static strings via AI, cached per language in
// localStorage so each language is translated only once. Screens using this
// at the same time share one request (src/lib/translateStrings.js).
export default function useHomeTranslation(language) {
  const [translations, setTranslations] = useState(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (!language || language === 'en') {
      setTranslations(null);
      setTranslating(false);
      return;
    }

    const storageKey = CACHE_PREFIX + language;
    const cached = getCachedTranslation(storageKey);
    if (cached) {
      setTranslations(cached);
      setTranslating(false);
      return;
    }

    let cancelled = false;
    setTranslations(null);
    setTranslating(true);
    const langName = LANGUAGES.find((l) => l.value === language)?.label || language;
    translateStrings({
      storageKey,
      strings: HOME_STRINGS,
      buildPrompt: (part) => `You are a professional translator for US citizenship test preparation materials. Translate every value in the JSON object below into ${langName}. Keep the keys exactly as they are. Keep placeholders like {n} exactly as written. Keep proper nouns (USCIS, USCIS.gov, Pathways) unchanged. Translate naturally — this is educational content for immigrants preparing for naturalization.

Return a JSON object with the same keys and the translated values.

JSON to translate:
${JSON.stringify(part, null, 2)}`,
      onPartial: (sofar) => {
        if (!cancelled) setTranslations(sofar);
      },
    })
      .then((done) => {
        if (!cancelled) setTranslations(done);
      })
      .catch((err) => {
        console.error('Home translation failed:', err);
        // One toast however many screens asked.
        if (!cancelled) toast.error('Translation failed. Showing English text.', { id: 'home-translation-failed' });
      })
      .finally(() => {
        if (!cancelled) setTranslating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  const t = (key) => (translations && translations[key]) || HOME_STRINGS[key];
  return { t, translating };
}
