import { useState, useCallback } from 'react';

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

// Shared language preference for the app (stored in pathways_language).
export default function useAppLanguage() {
  const [language, setLanguage] = useState(getSavedLanguage);
  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    try {
      localStorage.setItem('pathways_language', lang);
    } catch (e) {
      // ignore
    }
  }, []);
  return [language, changeLanguage];
}