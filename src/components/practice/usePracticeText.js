import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { PRACTICE_LINES } from './practiceStrings';

// Practice's wording in the learner's language (pack first; English when
// missing). `t(key, vars)` fills {placeholders}.
export default function usePracticeText() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(PRACTICE_LINES, language, { cacheKey: 'practice_v2' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || PRACTICE_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  return { t, language, rtl: RTL_LANGUAGES.includes(language) };
}
