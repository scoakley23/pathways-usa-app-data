import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { INTERVIEW_DAY_LINES } from './interviewDayStrings';

// Interview Day's wording in the learner's language (pack first; English
// when missing). `t(key, vars)` fills {placeholders}.
export default function useDayText() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(INTERVIEW_DAY_LINES, language, { cacheKey: 'interview_day_v2' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || INTERVIEW_DAY_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  return { t, language, rtl: RTL_LANGUAGES.includes(language) };
}
