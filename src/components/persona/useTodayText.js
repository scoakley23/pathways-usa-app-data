import useTranslatedLines from './useTranslatedLines';
import { TODAY_CACHE_KEY, TODAY_EN, TODAY_ES, makeT, en } from './todayStrings';

// { t, en, mine } — t() gives the learner's language (English fallback),
// en() the English line, mine(key, vars) the learner's line or null for
// English learners (for TutorMessage's two-language bubble).
export default function useTodayText(language) {
  const translate = useTranslatedLines(TODAY_EN, language, { cacheKey: TODAY_CACHE_KEY, handWritten: { es: TODAY_ES } });
  const t = makeT((k) => (language === 'en' ? null : translate(k)));
  const mine = (key, vars) => (language === 'en' || !translate(key) ? null : t(key, vars));
  return { t, en, mine };
}
