import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { N400_GUIDE_LINES } from './n400GuideStrings';

// The N-400 guide's wording in the learner's language (pack first; English
// when missing). `t(key, vars)` fills {placeholders}.
export default function useN400GuideText() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(N400_GUIDE_LINES, language, { cacheKey: 'n400_guide_v2' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || N400_GUIDE_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  return { t, language, rtl: RTL_LANGUAGES.includes(language) };
}
