import { useEffect, useState } from 'react';
import useAppLanguage from '@/hooks/useAppLanguage';
import { packText } from '@/lib/translationPack';
import { fillTip } from '@/lib/readingTips';

// A reading tip (readingTipParts()) in the learner's language, from the
// translation pack only: never live AI, so reading practice sends nothing.
// The line is translated with its {word} placeholders, then the missed
// English words are filled in. → { en, mine } (mine = null when English or
// not translated yet). Also translates single fixed lines: pass { line }.
export default function useReadingTip(parts) {
  const [language] = useAppLanguage();
  const line = parts?.line || '';
  const values = parts?.values;
  const valuesKey = JSON.stringify(values || {});
  const [mine, setMine] = useState(null);

  useEffect(() => {
    let active = true;
    setMine(null);
    if (!line || !language || language === 'en') return undefined;
    packText(language, line)
      .then((t) => { if (active && t) setMine(fillTip(t, JSON.parse(valuesKey))); })
      .catch(() => {});
    return () => { active = false; };
  }, [line, valuesKey, language]);

  return { en: line ? fillTip(line, values) : '', mine };
}
