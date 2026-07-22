import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'zh', label: '中文' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'tl', label: 'Tagalog' },
  { value: 'ko', label: '한국어' },
  { value: 'ar', label: 'العربية' },
  { value: 'fr', label: 'Français' },
  { value: 'ru', label: 'Русский' },
  { value: 'pt', label: 'Português' },
  { value: 'ht', label: 'Kreyòl Ayisyen' },
];

export function useLessonTranslation({ lesson, flashcards, quizzes }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('pathways_language') || 'en';
    } catch {
      return 'en';
    }
  });
  const [translations, setTranslations] = useState(null);
  const [translating, setTranslating] = useState(false);
  const cacheRef = useRef({});

  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('pathways_language', lang);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (language === 'en' || !lesson?.id) {
      setTranslations(null);
      setTranslating(false);
      return;
    }

    // Return cached translation if available
    const cacheKey = `${language}_${lesson.id}_${flashcards.length}_${quizzes.length}`;
    if (cacheRef.current[cacheKey]) {
      setTranslations(cacheRef.current[cacheKey]);
      return;
    }

    let cancelled = false;

    const translate = async () => {
      setTranslating(true);
      try {
        const langName = LANGUAGES.find((l) => l.value === language)?.label || language;

        const flashcardData = flashcards.map((f) => ({
          term: f.term,
          definition: f.definition,
          example: f.example || '',
        }));

        const quizData = quizzes.map((q) => ({
          question: q.question,
          answer: q.answer,
        }));

        const prompt = `You are a professional translator for US Citizenship test preparation materials. Translate the following lesson content into ${langName}. Preserve all markdown formatting in the content field. Translate naturally and accurately — this is educational content for immigrants preparing for naturalization.

Return a JSON object with these exact fields:
{
  "title": "translated lesson title",
  "description": "translated lesson description",
  "content": "translated lesson content (preserve markdown)",
  "key_points": [{"text": "...", "definition": "...", "image_url": "keep original"}],
  "flashcards": [{"term": "...", "definition": "...", "example": "..."}],
  "quizzes": [{"question": "...", "answer": "..."}]
}

Source data:

Lesson title: ${lesson.title || ''}
Lesson description: ${lesson.description || ''}

Lesson content:
${lesson.content || ''}

Key points:
${JSON.stringify(lesson.key_points || [])}

Flashcards:
${JSON.stringify(flashcardData)}

Quiz questions and answers:
${JSON.stringify(quizData)}`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              content: { type: 'string' },
              key_points: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    definition: { type: 'string' },
                    image_url: { type: 'string' },
                  },
                },
              },
              flashcards: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    term: { type: 'string' },
                    definition: { type: 'string' },
                    example: { type: 'string' },
                  },
                },
              },
              quizzes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    answer: { type: 'string' },
                  },
                },
              },
            },
            required: ['title', 'content', 'key_points', 'flashcards', 'quizzes'],
          },
        });

        if (!cancelled) {
          cacheRef.current[cacheKey] = result;
          setTranslations(result);
        }
      } catch (err) {
        console.error('Translation failed:', err);
        if (!cancelled) {
          toast.error('Translation failed. Showing original content.');
        }
      } finally {
        if (!cancelled) setTranslating(false);
      }
    };

    translate();
    return () => {
      cancelled = true;
    };
  }, [language, lesson?.id, flashcards.length, quizzes.length]);

  // Reset cache when switching lessons
  useEffect(() => {
    cacheRef.current = {};
    setTranslations(null);
  }, [lesson?.id]);

  const displayLesson = translations
    ? {
        ...lesson,
        title: translations.title || lesson.title,
        description: translations.description || lesson.description,
        content: translations.content || lesson.content,
        key_points: translations.key_points?.length ? translations.key_points : lesson.key_points,
      }
    : lesson;

  const displayFlashcards = translations?.flashcards?.length
    ? flashcards.map((f, i) => ({ ...f, ...(translations.flashcards[i] || {}) }))
    : flashcards;

  const displayQuizzes = translations?.quizzes?.length
    ? quizzes.map((q, i) => ({ ...q, ...(translations.quizzes[i] || {}) }))
    : quizzes;

  return {
    language,
    setLanguage,
    translating,
    displayLesson,
    displayFlashcards,
    displayQuizzes,
  };
}