import { useState, useCallback } from 'react';

export const RTL_LANGUAGES = ['ar', 'fa', 'ur', 'he'];

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