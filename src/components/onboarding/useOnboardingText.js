import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { ONBOARDING_LINES, ONBOARDING_LINES_ES } from '@/components/onboarding/onboardingStrings';

// Getting started's new wording (Prompt 9), translated like every screen;
// Spanish written by hand.
export default function useOnboardingText(languageOverride) {
  const [appLanguage] = useAppLanguage();
  const language = languageOverride || appLanguage;
  const tr = useTranslatedLines(ONBOARDING_LINES, language, { cacheKey: 'onboarding_screens_v2', handWritten: { es: ONBOARDING_LINES_ES } });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || ONBOARDING_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  return { t, language, rtl: RTL_LANGUAGES.includes(language) };
}
