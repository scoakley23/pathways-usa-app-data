import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { LANGUAGES } from '@/hooks/useLessonTranslation';

const CACHE_PREFIX = 'pathways_n400_tr_';

// Translates one N-400 question card (static, pre-written content) into the
// learner's language. Cached per language + card in localStorage. The learner
// never provides text here — only static app content is sent to the AI.
export default function useN400Translation(sectionId, question, language) {
  const [translation, setTranslation] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!language || language === 'en' || !question) {
      setTranslation(null);
      setIsTranslating(false);
      return;
    }
    const cacheKey = `${CACHE_PREFIX}${language}_${sectionId}_${question.id}`;
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
        const content = {
          official: question.official,
          meaning: question.meaning,
          words: question.words,
          officerPhrasings: question.officerPhrasings,
        };
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a professional translator for US citizenship education materials. Translate the following JSON into ${langName}. Translate every value exactly as written — do not add advice, interpretation, or any content that is not in the original. Return the same JSON structure, translated.

JSON:
${JSON.stringify(content, null, 2)}`,
          response_json_schema: {
            type: 'object',
            properties: {
              official: { type: 'string' },
              meaning: { type: 'string' },
              words: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { word: { type: 'string' }, definition: { type: 'string' } },
                  required: ['word', 'definition'],
                },
              },
              officerPhrasings: { type: 'array', items: { type: 'string' } },
            },
            required: ['official', 'meaning', 'words', 'officerPhrasings'],
          },
        });
        if (!cancelled && result) {
          setTranslation(result);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(result));
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        console.error('N-400 card translation failed:', e);
      } finally {
        if (!cancelled) setIsTranslating(false);
      }
    };
    translate();
    return () => {
      cancelled = true;
    };
  }, [sectionId, question?.id, language]);

  return { translation, isTranslating };
}