import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { LAWYER_LINES } from './lawyerStrings';

// The lawyer and help screens' wording in the learner's language (pack first;
// English when missing). `t(key, vars)` fills {placeholders}.
export default function useLawyerText() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(LAWYER_LINES, language, { cacheKey: 'lawyer_v1' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || LAWYER_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  return { t, language, rtl: RTL_LANGUAGES.includes(language) };
}
