import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { LANGUAGES } from '@/hooks/useLessonTranslation';

// Translates a small object of fixed English strings into the learner's
// language. Hand-written translations win; otherwise AI translates once and
// the result is cached on the device. Bump `cacheKey` when the English changes.
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
    const storageKey = `pathways_${cacheKey}_${language}`;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setTranslated(JSON.parse(raw));
        return;
      }
    } catch (e) {
      // ignore
    }

    setTranslated(null);
    let cancelled = false;
    const keys = Object.keys(lines);
    const langName = LANGUAGES.find((l) => l.value === language)?.label || language;
    base44.integrations.Core.InvokeLLM({
      prompt: `Translate every value in this JSON into ${langName}, for adults studying for the U.S. citizenship test. Keep the keys. Keep {name} exactly as written. Keep the tone of each line (some are warm, some short, some formal). Return a JSON object with the same keys.\n\n${JSON.stringify(lines, null, 2)}`,
      response_json_schema: {
        type: 'object',
        properties: Object.fromEntries(keys.map((k) => [k, { type: 'string' }])),
        required: keys,
      },
    }).then((res) => {
      if (cancelled || !res || typeof res !== 'object') return;
      setTranslated(res);
      try {
        localStorage.setItem(storageKey, JSON.stringify(res));
      } catch (e) {
        // ignore
      }
    }).catch(() => {
      // keep English
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, cacheKey, linesKey]);

  return (key) => (translated && translated[key]) || null;
}
