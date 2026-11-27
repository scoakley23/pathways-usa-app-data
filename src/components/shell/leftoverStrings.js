import { ENGLISH_MIX, TUTOR_TONES } from '@/lib/tutorPersona';
// Lines for the smaller learner pages restyled in amio-v2/leftovers,
// translated through the pack.

// Lesson progress (/Dashboard, opened from Progress's "Mastered" card).
// Pack set "lesson-status".
export const LESSON_STATUS_LINES = {
  title: 'Lesson progress',
  subtitle: 'Where you are in each civics topic.',
  back: 'Back',
  completed: 'Finished',
  in_progress: 'Started',
  not_started: 'Not started',
  none: 'No lessons yet.',
  unit_title: 'Unit {n} · {title}',
  practice_note: 'Practice only: nothing is saved yet.',
};

// The 404 page and "not registered". Pack set "error-pages".
export const ERROR_PAGE_LINES = {
  not_found: 'Page not found',
  not_found_body: 'We couldn’t find “{page}”.',
  go_home: 'Go to Today',
  admin_note: 'Admin note',
  admin_note_body: 'This page may not be built yet.',
  restricted: 'Access restricted',
  restricted_body: 'You are not registered to use this app. Please contact the app’s team to ask for access.',
  restricted_try: 'If you think this is a mistake, you can:',
  restricted_1: 'Check that you signed in with the right account',
  restricted_2: 'Contact the app’s team for access',
  restricted_3: 'Sign out and sign in again',
};

// "How Amio talks" (TutorSetup.jsx) and the voice picker (VoiceSettings.jsx)
// in Settings and Practice. Pack set "settings-pieces". The tone and
// English-mix names come from src/lib/tutorPersona.js.

export const SETTINGS_PIECE_LINES = {
  listen: 'Listen',
  listen_english: 'Listen in English',
  english: 'English',
  how_talk: 'How should Amio talk?',
  how_much_english: 'How much English?',
  mix_note: 'Amio explains in your app language. You can change this any time.',
  skip: 'Skip for now',
  save: 'Save',
  voice: 'Voice',
  voice_limited: 'Your browser has few voices. For the most natural voices, try Microsoft Edge or Google Chrome, or add voices in your phone’s speech settings.',
  voice_best: 'Best available (recommended)',
  voice_natural: 'Natural',
  speed: 'Speed',
  speed_tip: 'Tip: practice slower first, then at 1.0× like the real interview.',
  play_sample: 'Play sample',
  playing: 'Playing…',
  ...Object.fromEntries(Object.entries(TUTOR_TONES).flatMap(([id, x]) => [[`tone_${id}`, x.label], [`tone_${id}_sub`, x.description]])),
  ...Object.fromEntries(Object.entries(ENGLISH_MIX).map(([id, x]) => [`mix_${id}`, x.label])),
};
