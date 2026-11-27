import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';

// The Class screen's words (desktop vision D). The questions and official
// answers stay in English, word for word.
export const CLASS_LINES = {
  title: 'Class screen',
  back: 'Back',
  intro: 'Show official civics questions on a big screen for your class. Read each one together, then show the official answer.',
  saves_nothing: 'Nothing is saved.',
  pick_topic: 'Choose a topic',
  all_topics: 'All topics',
  questions_n: '{n} questions',
  start: 'Start',
  left_out: 'Questions that depend on where you live (senators, representative, governor, state capital) are left out.',
  status: '{topic} · question {n} of {total} · nothing is saved',
  officer_asks: 'The officer asks',
  read_aloud: 'Read it aloud',
  show_answer: 'Show answer',
  hide_answer: 'Hide answer',
  official_answer: 'Official answer',
  official_answers: 'Official answers (any one is right)',
  checked_on: 'Checked on official government websites on {date}',
  may_change: 'This may change soon. At the interview, name the person serving that day.',
  next: 'Next question',
  finish: 'Finish',
  done_title: 'That’s the round.',
  done_body: '{n} questions. Nothing was saved.',
  again: 'Another round',
  other_topic: 'Choose another topic',
  close: 'Close',
  footer: 'Free practice · Not affiliated with USCIS · Not legal advice',
  keys: 'Keys: R read aloud · A show or hide the answer · N next · Esc topics',
};

export function useClassText() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(CLASS_LINES, language, { cacheKey: 'class_v1' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || CLASS_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  return { t, language, rtl: RTL_LANGUAGES.includes(language) };
}
