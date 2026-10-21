import useTranslatedLines from './useTranslatedLines';
import { FIXED_LINES_ES, fixedTutorLines } from '@/lib/tutorPersona';

const LINES = fixedTutorLines();

// The tutor's fixed lines for its tone, in English and the learner's language.
// line('wellDone') -> { en, mine } (mine is null for English or while translating).
export default function useTutorLines(profile, language) {
  const translate = useTranslatedLines(LINES, language, {
    cacheKey: 'tutor_lines_v1',
    handWritten: { es: FIXED_LINES_ES },
  });
  return (key) => {
    const id = key === 'intro' ? 'intro' : `${profile.tone}_${key}`;
    const fill = (t) => (t ? t.replace('{name}', profile.name) : t);
    return { en: fill(LINES[id]), mine: language === 'en' ? null : fill(translate(id)) };
  };
}
