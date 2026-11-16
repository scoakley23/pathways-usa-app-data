import { useEffect, useMemo, useState } from 'react';
import { getLoadedPack, loadPack } from '@/lib/translationPack';

// A lookup into the translation pack for one language (Prompt 13): tx(english)
// returns the pack's line, or the English when there is none (and in
// English). Pack only, never live AI. Re-renders once the pack has loaded.
export default function usePackLookup(language) {
  const [pack, setPack] = useState(() => (language && language !== 'en' ? getLoadedPack(language) || null : null));
  useEffect(() => {
    let active = true;
    if (!language || language === 'en') { setPack(null); return undefined; }
    loadPack(language).then((p) => { if (active) setPack(p || null); }).catch(() => {});
    return () => { active = false; };
  }, [language]);
  return useMemo(() => (pack ? (english) => (english && pack.get(english)) || english : null), [pack]);
}
