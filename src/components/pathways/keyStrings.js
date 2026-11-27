import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage from '@/hooks/useAppLanguage';

// The keyboard lines on speaking screens (desktop vision C). Desktop only:
// phones never show them. The key names (Space, R, H, Esc) stay as they are
// printed on the keyboard.
export const KEY_LINES = {
  or_press_space: 'or press Space',
  keys: 'Keys:',
  key_answer: 'answer',
  key_hear: 'hear it again',
  key_hint: 'hint',
  key_close: 'close',
};

export function useKeyText() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(KEY_LINES, language, { cacheKey: 'keys_v1' });
  return (key) => (language !== 'en' && tr(key)) || KEY_LINES[key] || key;
}
