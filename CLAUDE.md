# CLAUDE.md — Pathways USA

Pathways USA is a free U.S. citizenship test prep app (civics, reading, writing, speaking, N-400 guide). It was built in Base44 and exported to this repo.

## Rules (always follow)

### Legal and content
- Pathways USA is a free education app, **not a legal service**. Nothing may tell a learner how THEY should answer an N-400 question about their own history, or whether THEY are eligible. Point legal questions to the "Talk to a lawyer first" page (`src/pages/LawyerPage.jsx`).
- Official civics questions and answers come from the app's USCIS question lists (`CivicsQuestion` records, versions `2008` and `2025`). AI may **explain** them but must never change, add, or invent official answers.

### Privacy
- Never store a learner's immigration status, A-number, case details, filing date, field office, address, or N-400 answers.
- No audio or speech transcripts are stored; only scores.
- The learner's target date lives **only** in browser storage on their device (wrap every `localStorage` read/write in try/catch).
- Learner text (typed or spoken-as-text) goes to the AI only in the features the AI Policy describes: Ask Vía, civics answer grading, interview/lesson answer scoring, and the representative lookup (zip, plus a street address only when the zip spans several districts). Never with personal identifiers (email, name), never saved, and emails/phone numbers are stripped first where learners type freely. Check answers on the device first when that's enough.

### Design ("Calm and confident")
- Manrope font, navy `#14264A`, accent red `#D9483F`, page `#F3F5F9`, cards white with `#DEE4EE` border, 16px corners.
- Visual style "A — Calm with color": colored step/section tags, segmented progress, raised white cards (`shadow-raised`), big round action buttons, and simple navy line drawings with one red dot (`src/components/art/TopicArt.jsx`). Use the Tailwind tokens `pw.*` (e.g. `bg-pw-navy`, `text-pw-muted`, `bg-pw-red-soft`) and the building blocks in `src/components/pathways/ui.jsx` (Tag, SegmentedProgress, PrimaryButton, SecondaryButton, QuietButton, PillButton, RaisedCard, Eyebrow) instead of one-off hex colors. Note: `shadow-card` is not usable (it collides with the `card` color); use `shadow-raised` / `shadow-lift`. The shadcn components in `src/components/ui/` are already restyled to match; `PageHeader` takes `tag`, `tagTone`, and `art`. The whole app uses this style; the official N-400 form replica (`src/components/n400/N400PaperForm.jsx`, `form/`) intentionally keeps its own look. `npm run lint` is clean; keep it that way.
- **The tutor front and center**: the AI tutor (default "Vía") is the learner's teacher and is shown front and center: introduces themself to new learners on Home (`TutorIntro.jsx`), stands at the "You're here" stop on the Home path (`RoadmapPath.jsx`), sits in the middle of the phone tab bar and in the desktop "Ask Vía" button (both open `StudyBuddy`; other code can call `openTutorChat()`), and says what each page is for via `PageHeader`'s `guide` prop (`TutorLine.jsx`). `useTutorProfile()` is loaded once and shared, so using it in many places is cheap. **Tutor portraits** are illustrated images (the one intentional exception to the line-drawing style): six tutors `a1`–`a6` (`a1` = Vía) × four expressions in `src/assets/tutors/{id}-{expression}-{160|384}.webp`, shown by `TutorAvatar`; avatar `custom` = the learner's own photo, kept only on the device (`src/lib/tutorPhoto.js`, picker in `TutorChoices.jsx`), one expression, falls back to Vía elsewhere (`expression`: `greeting` for hellos, `listening` while waiting for the learner or thinking, `proud` for a correct answer or finished day, else `default`; `decorative` when the name is next to it). `TutorMessage` passes `expression` through. **Read aloud**: on focus routes (onboarding, quick check, lessons) every `TutorMessage` reads itself aloud when it appears (learner's language, then English; skips a language the device has no voice for), shows Stop while speaking, and keeps Listen for replay. Logic in `src/lib/autoRead.js` + `src/components/persona/useAutoRead.js` (`AutoReadContext` set in `Layout.jsx`); the first message waits for the learner's first tap (browser rule). Microphones call `stopReading()` before listening. Learners turn it off in Getting started or Profile (`pathways_auto_read`, device only).
- **Landing**: signed-out visitors see `StartHereCard` ("Start here" → sign in → Getting started + quick check); new learners see `TutorIntro` with a "Start here" tag.
- **Navigation**: phones get a bottom tab bar (`src/components/pathways/TabBar.jsx`): Today · Learn · tutor · Practice · N-400; Progress, My Classroom, Profile are in Menu. Lesson screens (`FOCUS_ROUTES` in `Layout.jsx`) hide the tab bar and chat button.
- **Skill colors**: one color per interview skill, `SKILL_TONE` / `SKILL_BG` / `SkillTag` / `SkillDot` in `ui.jsx` (civics blue, reading teal, writing green, speaking red, N-400 navy). Use them for anything tied to a skill.
- **Contrast**: `pw-red` (#D9483F) is for dots, icons, rings, and large art only; red text and red buttons with text use `pw-red-ink` (hover `pw-red-deep`). Hover shades are tokens too (`pw-navy-deep`, `pw-soft-hover`).
- Mobile-first at 360px wide. Buttons at least 44px tall. Body text at least 16px.

### Tutor tone
- Respectful and adult. No cartoon mascots, leaderboards, hearts/lives, or punishing streaks.

### How to work
- Change only what a prompt asks. Show a plan before changing code.
- Test with fake information only.

## Stack

- **React 18 + Vite**, JavaScript (JSX), Tailwind CSS, shadcn/ui (`src/components/ui/`), lucide icons, TanStack Query, react-router.
- **Base44** is the backend: `@base44/sdk` client in `src/api/base44Client.js`, plus `@base44/vite-plugin`.
  - **Data**: Base44 entities, defined in `base44/entities/*.jsonc`, used as `base44.entities.<Name>.list/filter/create/update`. Records (including the civics question bank, interview questions, reading/writing sentences) live in the Base44 database, not in repo files.
  - **Auth/user**: `base44.auth.me()` / `base44.auth.updateMe()` (the `User` entity holds extra fields).
  - **AI**: `base44.integrations.Core.InvokeLLM({ prompt, response_json_schema?, file_urls?, add_context_from_internet? })`. Also `SendEmail`, `UploadFile`.
- **AI tutor persona** (default name "Vía"; not the human tutor in My Classroom): config and `buildTutorInstructions()` in `src/lib/tutorPersona.js`; UI in `src/components/persona/`.
- **Tutor lessons**: `TutorLesson` (`src/components/persona/`) renders a lesson = `{ id, title, steps }`; step types and rules in `src/lib/tutorLesson.js`. Practice checks are shared: `checkCivicsAnswer()` (`src/components/civics/`, AI, spoken answers) and `checkDictation()` / `matchOfficialAnswer()` (`src/lib/practiceChecks.js`, on-device, for typed answers). Feedback always shows official accepted answers from the question bank, never AI-written ones. Admin-only demo at `/tutor-demo`. Step types also include `part-intro` (skippable parts), `practice-reading`, `practice-interview`, and `mode: 'check'` (record the answer, no teaching).
- **Quick check (pretest)**: `/quick-check` (`src/pages/QuickCheck.jsx`); lesson building and level cutoffs in `src/lib/pretest.js`. Only the four levels are saved (`User.skill_levels`). `?part=<skill>` re-checks one skill and keeps the others. The first time on a device, **Getting started** comes first (`GettingStarted.jsx`, logic in `src/lib/onboarding.js`): a Start tap (lets the browser speak), language, tutor picture (or their own photo, device only), tutor name (suggestions in `SUGGESTED_TUTOR_NAMES`, `tutorPersona.js`), where they are in the process, which civics test (only if applied; stores the test version, never a date), interview month (only if scheduled; reuses `PlanSetup`), then sound and text size. Answers are device-only except the tutor picture and name. New students go here right after picking the student role.
- **Study plan + Today (Prompts 5, 6, 8)**: pure plan logic in `src/lib/studyPlan.js`, device-only settings in `src/lib/planSettings.js` (target date, plan mode, checkmarks, visits), check-ins in `src/lib/checkIns.js`; UI `TodayCard.jsx` / `PlanSetup.jsx` in `src/components/persona/`, text in `todayStrings.js`. Task links: `/learn`, `/review`, `/Practice?mode=reading|dictation|civics|interview`, `/n400-coach?section=…`.
- **Teach then practice (Prompt 7)**: `/learn` and `/review` (`src/pages/LearnCivics.jsx`, `ReviewCivics.jsx`). Explanations are content in `content/explanations/{lang}.json`; only `"reviewed"` entries are shown (`src/lib/explanations.js`). Workflow: Admin → export questions → draft → human review (`content/explanations/REVIEW.md`); `npm test` fails if an explanation's answers differ from `content/civics/questions-2025.json`. Explanations may use line breaks (intro + one `• answer: …` line per answer for list questions) and an optional `link` to an official site (shown as a Listen button). "Answers change" questions show the admin-confirmed names in `content/civics/current-officials.json` (Admin → Current officials: AI checks uscis.gov, the admin confirms and commits the file); "Answers vary" questions show the learner's own Find My Representative result. Logic in `src/lib/currentAnswers.js`.
- **N-400 coaching (Prompt 9)**: `/n400-coach` (`src/pages/N400Coach.jsx`, `src/lib/n400Lesson.js`, steps in `src/components/persona/n400Steps.jsx`); practice-person scoring via `personaScoringBlock()` in `PracticePersonaPanel.jsx`. Saves only section completion.
- **Ask Vía + Talk to a person (Prompt 10)**: `src/components/ai/StudyBuddy.jsx`, `TalkToPerson.jsx`, logic in `src/lib/askTutor.js`. Support email and reply time live in `src/config/support.js` (form disabled until both are set).
- **Privacy audit**: `docs/privacy-audit.md` (Prompt 11).
- **Pages** are auto-registered from `src/pages/` (`src/pages.config.js` is auto-generated; only `mainPage` is editable). `src/Layout.jsx` wraps all pages. Feature components live in `src/components/<area>/`.
- **Speech**: browser Web Speech API (`SpeechRecognition`, `lang = 'en-US'`) produces a transcript; scoring is word matching (`src/components/utils/wordDiff.js`) plus an `InvokeLLM` evaluation. Text-to-speech: `src/components/utils/textToSpeech.jsx` (`speakText(text, lang)`).
- **Languages/i18n**: no i18n library. The chosen language is `localStorage['pathways_language']` (`src/hooks/useAppLanguage.js`; list in `LANGUAGES` in `src/hooks/useLessonTranslation.js`). UI strings are written in English and translated on demand with `InvokeLLM`, cached per language in localStorage (`useHomeTranslation`, `useN400Translation`, `useLawyerChecklistTranslation`). RTL languages: `ar`, `fa`, `ur`, `he`.
- **Build/deploy**: `npm run dev`, `npm run build`, `npm run lint`, `npm test` (Vitest; tests are `src/**/*.test.js`, config in `vitest.config.js`). The live app runs on Base44: this repo is two-way synced with Base44 on `main`, so **merging to `main` updates the live app**. Work on branches and merge via pull request. Running locally needs the Base44 env vars (`VITE_BASE44_APP_ID`, `VITE_BASE44_BACKEND_URL`).

## Where learner data is saved today

| Where | What | Notes |
| --- | --- | --- |
| `User` (account) | display name, points, badges, max streak, `tutor_profile` (AI tutor name/avatar (`a1`–`a6` or `custom`)/tone/English mix), `skill_levels` (quick check: civics/reading/writing/speaking level + date only) | reset by `DeleteMyData` (the sign-in account itself can't be deleted from the app) |
| `PublicProfile` | display name, points, badge count, role, tutor invite code, cached representative names | address/zip used only for lookup |
| `UserProgress` | per sentence/word/civics question: status, SRS fields, scores, attempts | |
| `LessonProgress` | per lesson: completed, quiz scores, needs_review | |
| `LessonNotes` | learner's free-text notes per lesson | |
| `N400SectionProgress` | section completed + date only | |
| `InterviewSession` | per-question scores only | transcripts stay in memory for the end-of-interview report |
| `AIStudyLog` | Ask Vía question + answer + email (declined case questions are not saved) | shown to the learner in Study History; not emailed |
| `Message`, `Notification` | tutor/student messages and in-app notifications | |
| `TutorRelationship`, `Assignment` | tutor links, assigned items, tutor feedback | |
| `localStorage` | target date (`pathways_target_date`), plan (`pathways_plan`), Today checkmarks/visits/check-ins (`pathways_done_*`, `pathways_last_visit`, `pathways_missed_today`, `pathways_checkins_dismissed`), explanation drafts on the admin's device, learner's own tutor photo (`pathways_tutor_photo`), text size (`pathways_text_size`), read aloud (`pathways_auto_read`), Getting started (`pathways_onboarded`, `pathways_stage`, `civicsVersion`), language, civics version, voice settings, cached translations, daily reminder flag, role cache, pending tutor invite | device only; cleared by `DeleteMyData` |

Reading practice scores from the browser transcript and word matching; no audio is recorded or uploaded (Base44 can't delete uploaded files).

Known conflicts with the rules above: none open. Leaderboards and streak displays were removed in Prompt 6; points and badges remain. Keep `docs/AI-Policy-updated.md` in sync when data handling changes.
