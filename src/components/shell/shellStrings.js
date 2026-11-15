// The Me, Settings and Interview tabs' fixed English lines (translated through
// useTranslatedLines and the translation pack). Plain data, no imports, so
// src/lib/translationSources.js can read them without loading the screens.
import { ME_LINKS, ME_MORE_LINKS, INTERVIEW_LINKS } from '@/lib/shellRoutes';
import { LEVELS } from '@/lib/pretest';

// WhatWeSave.jsx
export const WHAT_WE_SAVE_LINES = {
  title: 'What we save',
  short_saved: 'Your lesson progress, badges and practice scores.',
  short_never_lead: 'Never',
  short_never: 'your voice, your interview date, your address, or anything about your case.',
  full_list: 'See the full list',
  account_title: 'With your account',
  account_1: 'Your name, email, points and badges.',
  account_2: 'How Amio talks to you (tone and how much English), and your quick check levels.',
  account_3: 'Your practice: which questions, sentences and lessons you got right, and your scores. Mock interview scores only, never what you said.',
  account_4: 'Your lesson notes, and which N-400 guide sections you read (never your answers).',
  account_5: 'Your questions to Amio and Amio’s answers, so you can see them in History. Only you can see them.',
  account_6: 'Your state and congressional district, if you used “Who Represents Me?” (never your address).',
  account_7: 'Places you saved in Free help near you.',
  account_8: 'If you picked a program: which one, the name you gave them, and whether you share your progress. Your program sees only that and counts, never your answers or your questions to Amio.',
  account_9: 'If you answer them: your “Help us improve Pathways” answers (fixed choices only), the days you opened the app, and which reminder emails we sent.',
  device_title: 'Only on this phone',
  device_1: 'Your interview month, your plan and checkmarks, your language, text size, sound and voice settings, and saved translations.',
  never_title: 'Never saved',
  never_1: 'Your voice (speech becomes text in your browser; only scores are kept), your interview date, your address, your A-number, your immigration status, or your answers to the N-400.',
};

// MePage.jsx
export const ME_LINES = {
  welcome: 'Welcome',
  studying_in: 'Studying in {language}',
  interview_month: 'Interview month: {month}',
  days_week: 'days practiced this week',
  civics_ready: 'civics answers ready',
  best_interview: 'best practice interview',
  none_yet: 'none yet',
  badges: 'Your badges',
  more: 'More',
  sign_out: 'Sign out',
  sign_in: 'Sign in',
  sign_in_body: 'Sign in to see your progress, badges and settings.',
  ...Object.fromEntries([...ME_LINKS, ...ME_MORE_LINKS].map((l) => [`link_${l.id}`, l.label])),
};

// SettingsPage.jsx
export const SETTINGS_LINES = {
  title: 'Settings and privacy',
  language: 'Language',
  speed: 'Amio’s speaking speed',
  read_aloud: 'Read everything out loud',
  read_aloud_help: 'Amio reads each message aloud in the quick check and lessons. Saved on this phone.',
  how_amio_talks: 'How Amio talks',
  your_name: 'Your name',
  your_name_help: 'Shown on your Me page.',
  save: 'Save',
  ...Object.fromEntries(Object.entries(WHAT_WE_SAVE_LINES).map(([k, v]) => [`wws_${k}`, v])),
};

// InterviewPage.jsx
export const INTERVIEW_LINES = {
  title: 'Are you ready?',
  ready_in: 'Ready in {n} of 4 parts',
  interview_month: 'Interview month: {month}',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
  civics: 'Civics',
  ready: 'Ready',
  not_checked: 'Not checked yet',
  no_interview_yet: 'No practice yet',
  of: '{n} of {total}',
  practice_title: 'Practice interview',
  practice_body: '{n} questions · AI officer, not a real person. Amio waits at the door.',
  last: 'Last {n}:',
  start: 'Start practice interview',
  ...Object.fromEntries(INTERVIEW_LINKS.filter((l) => l.id !== 'mock').map((l) => [`link_${l.id}`, l.label])),
  ...Object.fromEntries(Object.entries(LEVELS).map(([k, v]) => [`level_${k}`, v.label])),
};
