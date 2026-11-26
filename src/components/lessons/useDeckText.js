import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { DECK_LINES } from './learnStrings';

// The lesson deck's words in the app language (pack first; English when
// missing). `t(key, vars)` fills {placeholders}.
export default function useDeckText() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(DECK_LINES, language, { cacheKey: 'lesson_deck_v1' });
  const t = (key, vars = {}) => Object.entries(vars).reduce((out, [k, v]) => out.split(`{${k}}`).join(String(v)), (language !== 'en' && tr(key)) || DECK_LINES[key] || key);
  return { t, language, rtl: RTL_LANGUAGES.includes(language) };
}
