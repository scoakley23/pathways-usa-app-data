// Every English text the app translates, for the translation pack (Step 4).
// Not used by the app at runtime: scripts/translations/ writes these to
// content/translations/_sources.json, and build-pack.mjs translates them.
//
// - STRING_SETS: each screen's fixed lines. `usedIn` names where a screen
//   passes the list to useTranslatedLines() / useHomeTranslation();
//   translationSources.test.js fails if a screen translates a list that
//   isn't here, so new text can't be forgotten.
// - contentTexts(): the content the app translates (civics questions and
//   answers, sentences, words, lessons and key words, the N-400 guide, the
//   lawyer checklist, Ask Amio's privacy note), with the same strings the
//   screens look up in the pack.
import { HOME_STRINGS } from '@/components/home/homeStrings';
import { TODAY_EN } from '@/components/persona/todayStrings';
import { PILOT_EN } from '@/components/pilot/pilotStrings';
import { SIGN_IN_STRINGS } from '@/components/auth/signInStrings';
import { ASK_LINES, ASK_SCREEN_LINES } from '@/lib/askTutor';
import { fixedTutorLines } from '@/lib/tutorPersona';
import { REPLY_TIME } from '@/config/support';
import { TABS } from '@/components/pathways/BottomTabs';
import { ME_LINES, SETTINGS_LINES, INTERVIEW_LINES } from '@/components/shell/shellStrings';
import { TALK_LINES } from '@/components/ai/talkStrings';
import { COURSE_LINES } from '@/components/course/courseStrings';
import { LESSON_LINES } from '@/components/lesson/lessonStrings';
import { TODAY_LINES } from '@/components/today/todayLines';
import { UNITS } from '@/lib/course';
import coursePictures from '../../content/course/pictures.json';
import { GETTING_STARTED_LINES } from '@/components/persona/gettingStartedStrings';
import { PRIVACY_NOTE, PRIVACY_SHORT } from '@/components/ai/privacyStrings';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import { LAWYER_CHECKLIST_ITEMS } from '@/components/lawyer/lawyerChecklist';
import { LANGUAGES } from '@/lib/languages';
import civics2025 from '../../content/base44-export/civics-questions-2025.json';
import civics2008 from '../../content/base44-export/civics-questions-2008.json';
import readingSentences from '../../content/base44-export/reading-sentences.json';
import writingSentences from '../../content/base44-export/writing-sentences.json';
import vocabularyWords from '../../content/base44-export/vocabulary-words.json';
import lessons from '../../content/base44-export/lessons.json';
import lessonFlashcards from '../../content/base44-export/lesson-flashcards.json';

const TUTOR_LINES = fixedTutorLines();

// [id, strings, usedIn: [file, identifier passed to the hook]]
export const STRING_SETS = [
  { id: 'home', strings: HOME_STRINGS, usedIn: [['src/hooks/useHomeTranslation.js', 'HOME_STRINGS']] },
  { id: 'today', strings: TODAY_EN, usedIn: [['src/components/persona/useTodayText.js', 'TODAY_EN']] },
  { id: 'pilot', strings: PILOT_EN, usedIn: [['src/components/pilot/pilotStrings.js', 'PILOT_EN']] },
  {
    id: 'sign-in',
    strings: SIGN_IN_STRINGS,
    usedIn: [['src/components/auth/SignInScreen.jsx', 'SIGN_IN_STRINGS'], ['src/components/auth/SessionNotice.jsx', 'SIGN_IN_STRINGS']],
  },
  { id: 'ask', strings: ASK_LINES, usedIn: [['src/components/ai/StudyBuddy.jsx', 'ASK_LINES']] },
  { id: 'ask-screen', strings: ASK_SCREEN_LINES, usedIn: [['src/components/ai/StudyBuddy.jsx', 'ASK_SCREEN_LINES']] },
  {
    id: 'tutor',
    strings: TUTOR_LINES,
    usedIn: [['src/components/persona/TutorSetup.jsx', 'LINES'], ['src/components/persona/useTutorLines.js', 'LINES']],
  },
  { id: 'tabs', strings: Object.fromEntries(TABS.map((tab) => [tab.id, tab.label])), usedIn: [['src/Layout.jsx', 'TAB_LINES']] },
  { id: 'me', strings: ME_LINES, usedIn: [['src/components/shell/MePage.jsx', 'LINES']] },
  { id: 'settings', strings: SETTINGS_LINES, usedIn: [['src/components/shell/SettingsPage.jsx', 'LINES']] },
  { id: 'interview-tab', strings: INTERVIEW_LINES, usedIn: [['src/components/shell/InterviewPage.jsx', 'LINES']] },
  { id: 'course', strings: COURSE_LINES, usedIn: [['src/components/course/courseShared.jsx', 'COURSE_LINES']] },
  { id: 'lesson-player', strings: LESSON_LINES, usedIn: [['src/components/lesson/LessonPlayer.jsx', 'LESSON_LINES']] },
  { id: 'today-plan', strings: TODAY_LINES, usedIn: [['src/components/today/useToday.js', 'TODAY_LINES']] },
  { id: 'talk', strings: TALK_LINES, usedIn: [['src/components/ai/TalkToPerson.jsx', 'LINES']] },
  { id: 'talk-reply', strings: { reply: `We reply within ${REPLY_TIME}.` }, usedIn: [['src/components/ai/TalkToPerson.jsx', 'replyLine']] },
  { id: 'getting-started', strings: GETTING_STARTED_LINES, usedIn: [['src/components/persona/GettingStarted.jsx', 'LINES']] },
];

const texts = (list) => list.filter((t) => typeof t === 'string' && t.trim());
const sectionTitle = (id) => N400_SECTIONS.find((s) => s.id === id)?.title || '';

// [id, [English texts]] for the content screens translate.
export function contentTexts() {
  const questions = [...civics2025, ...civics2008];
  return [
    ['civics-questions', texts(questions.flatMap((q) => [q.question, q.answer]))],
    ['sentences', texts([...readingSentences, ...writingSentences].map((s) => s.text))],
    ['words', texts(vocabularyWords.map((w) => w.word))],
    ['lessons', texts(lessons.flatMap((l) => [
      l.title, l.description, l.content,
      ...(l.key_points || []).flatMap((k) => (typeof k === 'string' ? [k] : [k.text, k.definition])),
    ]))],
    ['key-words', texts(lessonFlashcards.flatMap((f) => [f.term, f.definition, f.example]))],
    ['n400', texts(N400_SECTIONS.flatMap((section) => (section.questions || []).flatMap((q) => [
      q.official, q.meaning,
      ...(q.words || []).flatMap((w) => [w.word, w.definition]),
      ...(q.officerPhrasings || []),
    ])))],
    ['lawyer-checklist', texts(LAWYER_CHECKLIST_ITEMS.flatMap((i) => [i.text, i.explanation, sectionTitle(i.guideSectionId)]))],
    ['privacy-note', texts([PRIVACY_NOTE.en, PRIVACY_SHORT.en])],
    // The course (Prompt 6): what the lesson player translates. Official
    // questions, answers and the Read it / Write it sentences stay English.
    ['course-lessons', texts(UNITS.flatMap((u) => u.sections.flatMap((sec) => (sec.lessons || []).flatMap((l) => [
      ...l.steps.listen.facts,
      ...l.steps.listen.newWords.map((w) => w.meaning),
    ]))))],
    ['course-pictures', texts(Object.values(coursePictures.lessons).flat().map((p) => p.caption))],
  ];
}

// Everything, as written to content/translations/_sources.json:
// { languages: [{ value, label }], texts: [{ text, from: [ids] }] } (sorted).
export function collectSources() {
  const from = new Map();
  const add = (text, id) => {
    if (typeof text !== 'string' || !text.trim()) return;
    if (!from.has(text)) from.set(text, new Set());
    from.get(text).add(id);
  };
  for (const set of STRING_SETS) for (const text of Object.values(set.strings)) add(text, set.id);
  for (const [id, list] of contentTexts()) for (const text of list) add(text, id);
  return {
    languages: LANGUAGES.filter((l) => l.value !== 'en').map(({ value, label }) => ({ value, label })),
    texts: [...from.entries()]
      .map(([text, ids]) => ({ text, from: [...ids].sort() }))
      .sort((a, b) => (a.text < b.text ? -1 : a.text > b.text ? 1 : 0)),
  };
}
