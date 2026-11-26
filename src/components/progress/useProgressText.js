import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { PROGRESS_LINES } from './progressStrings';

// Progress's wording in the learner's language (pack first; English when
// missing). `t(key, vars)` fills {placeholders}; `locale` is for dates.
export default function useProgressText() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(PROGRESS_LINES, language, { cacheKey: 'progress_v1' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || PROGRESS_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  const locale = language === 'en' ? 'en-US' : language;
  const date = (d, opts) => {
    try { return new Date(d).toLocaleDateString(locale, opts); } catch (e) { return new Date(d).toLocaleDateString('en-US', opts); }
  };
  const time = (d) => {
    try { return new Date(d).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; }
  };
  return { t, language, locale, date, time, rtl: RTL_LANGUAGES.includes(language) };
}
