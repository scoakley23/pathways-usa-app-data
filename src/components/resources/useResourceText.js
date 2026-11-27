import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { RESOURCE_LINES } from './resourceStrings';

// "Find help near you" in the learner's language (pack first; English when
// missing). `t(key, vars)` fills {placeholders}; `category(id)` and
// `distance(miles)` are the translated category name and distance.
export default function useResourceText() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(RESOURCE_LINES, language, { cacheKey: 'resource_finder_v1' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || RESOURCE_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  const category = (id) => t(RESOURCE_LINES[`cat_${id}`] ? `cat_${id}` : 'cat_other');
  const cost = (id) => (RESOURCE_LINES[`cost_${id}`] ? t(`cost_${id}`) : '');
  // Same rule as formatDistance() in resourceHub.js, with translated words.
  const distance = (miles) => {
    if (miles == null || !Number.isFinite(miles)) return '';
    if (miles < 0.1) return t('less_than_tenth');
    return t('distance_mi', { miles: miles < 10 ? miles.toFixed(1) : Math.round(miles) });
  };
  return { t, category, cost, distance, language, rtl: RTL_LANGUAGES.includes(language) };
}
