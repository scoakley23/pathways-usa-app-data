import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { LANGUAGES } from './useLessonTranslation';
import { LAWYER_CHECKLIST_ITEMS } from '@/components/lawyer/lawyerChecklist';

const CACHE_PREFIX = 'pathways_lawyer_tr_';

// Translates the static "Talk to a lawyer first" checklist into the learner's
// chosen language. One call for the whole list, cached per language. Only
// static app content is sent to the AI — the learner never types anything on
// this page.
export default function useLawyerChecklistTranslation(language) {
  const [translation, setTranslation] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!language || language === 'en') {
      setTranslation(null);
      setIsTranslating(false);
      return;
    }
    const cacheKey = `${CACHE_PREFIX}${language}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        setTranslation(JSON.parse(raw));
        return;
      }
    } catch (e) {
      // ignore bad cache
    }

    let cancelled = false;
    const translate = async () => {
      setIsTranslating(true);
      try {
        const langName = LANGUAGES.find((l) => l.value === language)?.label || language;
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a professional translator for US citizenship education materials. Translate the following JSON into ${langName}. Translate every value exactly as written — do not add advice, interpretation, or any content that is not in the original. Keep the same order and structure.
${'\n'}JSON:
${JSON.stringify({ items: LAWYER_CHECKLIST_ITEMS.map((i) => ({ text: i.text, explanation: i.explanation })) }, null, 2)}`,
          response_json_schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { text: { type: 'string' }, explanation: { type: 'string' } },
                  required: ['text', 'explanation'],
                },
              },
            },
            required: ['items'],
          },
        });
        if (!cancelled && result?.items?.length) {
          setTranslation(result.items);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(result.items));
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        console.error('Lawyer checklist translation failed:', e);
      } finally {
        if (!cancelled) setIsTranslating(false);
      }
    };
    translate();
    return () => {
      cancelled = true;
    };
  }, [language]);

  return { translation, isTranslating };
}