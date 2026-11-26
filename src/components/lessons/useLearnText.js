import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { LEARN_AMIO_LINES, LEARN_AMIO_LINES_ES, LEARN_SCREEN_LINES } from './learnStrings';

const fill = (s, vars) => Object.entries(vars).reduce((out, [k, v]) => out.split(`{${k}}`).join(String(v)), s);

// /learn and /review wording. `t(key, vars)` = the screens' words (pack,
// English when missing). `amio(key, vars)` = Amio's line as { en, mine } for
// TutorMessage: Spanish by hand, other languages from the pack.
export default function useLearnText() {
  const [language] = useAppLanguage();
  const screen = useTranslatedLines(LEARN_SCREEN_LINES, language, { cacheKey: 'learn_screens_v1' });
  const amioTr = useTranslatedLines(LEARN_AMIO_LINES, language, { cacheKey: 'learn_amio_v1', handWritten: { es: LEARN_AMIO_LINES_ES } });
  const t = (key, vars = {}) => fill((language !== 'en' && screen(key)) || LEARN_SCREEN_LINES[key] || key, vars);
  const amio = (key, vars = {}) => {
    const mine = language !== 'en' ? amioTr(key) : null;
    return { en: fill(LEARN_AMIO_LINES[key], vars), mine: mine ? fill(mine, vars) : null };
  };
  return { t, amio, language, rtl: RTL_LANGUAGES.includes(language) };
}
