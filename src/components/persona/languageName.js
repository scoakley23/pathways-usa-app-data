import { LANGUAGES } from '@/hooks/useLessonTranslation';

// English name of an app language code, e.g. "es" -> "Spanish" (from the
// label "Español (Spanish)"). Used in AI instructions.
export function languageNameFor(code) {
  const label = LANGUAGES.find((l) => l.value === code)?.label || 'English';
  return label.match(/\(([^)]+)\)/)?.[1] || label;
}
