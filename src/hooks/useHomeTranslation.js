import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { LANGUAGES } from './useLessonTranslation';
import { HOME_STRINGS } from '@/components/home/homeStrings';

const CACHE_PREFIX = 'pathways_home_tr_v2_'; // bump when HOME_STRINGS changes

// Translates the home screen's static strings via AI, cached per language in
// localStorage so each language is translated only once.
export default function useHomeTranslation(language) {
  const [translations, setTranslations] = useState(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (!language || language === 'en') {
      setTranslations(null);
      setTranslating(false);
      return;
    }

    let cached = null;
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + language);
      if (raw) cached = JSON.parse(raw);
    } catch (e) {
      cached = null;
    }
    if (cached && typeof cached === 'object') {
      setTranslations(cached);
      setTranslating(false);
      return;
    }

    let cancelled = false;

    const translate = async () => {
      setTranslating(true);
      try {
        const langName = LANGUAGES.find((l) => l.value === language)?.label || language;
        const keys = Object.keys(HOME_STRINGS);
        const properties = {};
        keys.forEach((k) => {
          properties[k] = { type: 'string' };
        });

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a professional translator for US citizenship test preparation materials. Translate every value in the JSON object below into ${langName}. Keep the keys exactly as they are. Keep placeholders like {n} exactly as written. Keep proper nouns (USCIS, USCIS.gov, Pathways) unchanged. Translate naturally — this is educational content for immigrants preparing for naturalization.

Return a JSON object with the same keys and the translated values.

JSON to translate:
${JSON.stringify(HOME_STRINGS, null, 2)}`,
          response_json_schema: {
            type: 'object',
            properties,
            required: keys,
          },
        });

        if (!cancelled && result && typeof result === 'object') {
          const clean = {};
          keys.forEach((k) => {
            if (typeof result[k] === 'string' && result[k].trim()) clean[k] = result[k];
          });
          if (Object.keys(clean).length) {
            setTranslations(clean);
            try {
              localStorage.setItem(CACHE_PREFIX + language, JSON.stringify(clean));
            } catch (e) {
              // ignore
            }
          }
        }
      } catch (err) {
        console.error('Home translation failed:', err);
        if (!cancelled) toast.error('Translation failed. Showing English text.');
      } finally {
        if (!cancelled) setTranslating(false);
      }
    };

    translate();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const t = (key) => (translations && translations[key]) || HOME_STRINGS[key];
  return { t, translating };
}