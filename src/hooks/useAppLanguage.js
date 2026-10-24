import { useState, useCallback, useEffect } from 'react';

export const RTL_LANGUAGES = ['ar', 'fa', 'ur', 'he', 'prs', 'ps'];

// True when the language reads right-to-left. Accepts either a full code
// ('prs') or a two-letter prefix ('fa-af' behaves like Persian).
export const isRTL = (lang) => {
  const code = (lang || '').toLowerCase();
  return RTL_LANGUAGES.includes(code) || RTL_LANGUAGES.includes(code.slice(0, 2));
};

export function getSavedLanguage() {
  try {
    return localStorage.getItem('pathways_language') || 'en';
  } catch (e) {
    return 'en';
  }
}

// Fired when any screen changes the language (the header menu, the Home
// card), so every mounted useAppLanguage() follows along.
const LANGUAGE_EVENT = 'pathways-language';

// Shared language preference for the app (stored in pathways_language).
export default function useAppLanguage() {
  const [language, setLanguage] = useState(getSavedLanguage);
  useEffect(() => {
    const follow = (e) => setLanguage(e.detail);
    window.addEventListener(LANGUAGE_EVENT, follow);
    return () => window.removeEventListener(LANGUAGE_EVENT, follow);
  }, []);
  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    try {
      localStorage.setItem('pathways_language', lang);
    } catch (e) {
      // ignore
    }
    window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: lang }));
  }, []);
  return [language, changeLanguage];
}
