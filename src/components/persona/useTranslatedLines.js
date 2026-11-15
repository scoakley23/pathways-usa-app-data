import { useEffect, useState } from 'react';
import { LANGUAGES } from '@/lib/languages';
import { getCachedTranslation, translateStrings } from '@/lib/translateStrings';
import { PACK_ONLY, fromPack, getLoadedPack, hasPack } from '@/lib/translationPack';

// Translates a small object of fixed English strings into the learner's
// language. Hand-written translations win; then the translation pack
// (src/lib/translationPack.js); otherwise AI translates once (switch off
// only) and the result is cached on the device. Bump `cacheKey` when the
// English changes.
// Components asking for the same lines at the same time share one request.
export default function useTranslatedLines(lines, language, { cacheKey, handWritten = {} }) {
  const [translated, setTranslated] = useState(null);
  const linesKey = JSON.stringify(lines);

  useEffect(() => {
    if (!language || language === 'en') {
      setTranslated(null);
      return;
    }
    if (handWritten[language]) {
      setTranslated(handWritten[language]);
      return;
    }
    // The pack, if it is already loaded and covers these lines.
    const pack = getLoadedPack(language);
    if (pack) {
      const { found, missing } = fromPack(pack, lines);
      if (!missing.length || PACK_ONLY) {
        setTranslated(found);
        return;
      }
    }
    const storageKey = `pathways_${cacheKey}_${language}`;
    const cached = hasPack(language) ? null : getCachedTranslation(storageKey);
    if (cached) {
      setTranslated(cached);
      return;
    }

    setTranslated(null);
    let cancelled = false;
    const langName = LANGUAGES.find((l) => l.value === language)?.label || language;
    translateStrings({
      language,
      storageKey,
      strings: lines,
      buildPrompt: (part) => `Translate every value in this JSON into ${langName}, for adults studying for the U.S. citizenship test. Keep the keys. Keep {name} exactly as written. Keep the tone of each line (some are warm, some short, some formal). Return a JSON object with the same keys.\n\n${JSON.stringify(part, null, 2)}`,
      onPartial: (sofar) => {
        if (!cancelled) setTranslated(sofar);
      },
    })
      .then((done) => {
        if (!cancelled) setTranslated(done);
      })
      .catch(() => {
        // keep English
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, cacheKey, linesKey]);

  return (key) => (translated && translated[key]) || null;
}
