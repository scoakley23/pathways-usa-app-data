# Standalone audit: what the app uses from Base44

Written Nov 13, 2026, for Standalone Step 0 (`Standalone App Plan.md`). This
covers the code on `main` as of `b957ffa`, plus `standalone`'s final-check
commit. It's the map for Steps 1–5: everything that has to move from Base44
to Supabase, Cloudflare, Resend, Geocodio and our own AI key.

At a glance:

- **66 files** import the Base44 client.
- **23 entities** (database tables) plus the built-in `User`.
- **14 places** call the AI (`InvokeLLM`): 13 in the browser and 1 in a backend function.
- **2 email senders**: the Talk to a person form and the pilot reminders.
- **3 backend functions**: `partner`, `pilot-report`, `pilot-reminders`.
- **Nothing runs on a schedule today.**
- **No file uploads.** No learner data is stored in Base44 files.

Words used below:

- **Learner**: the signed-in owner of a row.
- **Partner staff**: the staff emails on a `Partner` (the plan's "tutor"; there are no tutor accounts).
- **Admin**: Base44 `role: admin`.

---

## a. Every use of the Base44 SDK

The client is made in `src/api/base44Client.js`, from `appId` and `serverUrl`.
Those come from `src/lib/app-params.js`: URL parameters first (`app_id`,
`server_url`, `access_token`, `functions_version`, all copied to
`localStorage` as `base44_*`), then `VITE_BASE44_APP_ID` and
`VITE_BASE44_BACKEND_URL`.

`src/api/entities.js` and `src/api/integrations.js` re-export SDK pieces, but
**nothing imports them**. The screens call `base44.*` directly, so Step 3
creates `src/api` for real.

### Login (`base44.auth`)

| Call | Files | What it does |
|---|---|---|
| `auth.me()` | `lib/AuthContext.jsx`, `Layout.jsx`, and 30 screens and hooks (Today, Practice, Lessons, LessonDetail, LearnCivics, ReviewCivics, QuickCheck, Progress, Profile, StudyHistory, Dashboard, Admin, InterviewDay, InterviewPractice, InterviewHistory, N400Coach, TutorDemo, StudyBuddy, useTutorProfile, useLearnerLocation, QuickCheckCard, ThisWeekCard, DailyPracticeReminder, PilotDashboard, checkInData, awardBadges, PageNotFound) | Who is signed in: email (the key for every learner row), `role`, and the extra `User` fields |
| `auth.updateMe()` | `useTutorProfile`, `QuickCheck`, `Practice`, `Profile`, `Home`, `HelpUsImprove`, `PilotSettingsCard` (×3), `PilotAdminTool`, `awardBadges`, `DeleteMyData` | Writes the extra `User` fields: tutor profile, skill levels, points and badges, pilot fields, the reset in Delete my data |
| `auth.redirectToLogin()` | `Layout.jsx` (×2), `lib/AuthContext.jsx`, `StartHereCard`, `LessonDetail`, `InterviewDay` | Sends the visitor to Base44's hosted sign-in |
| `auth.logout()` | `Layout.jsx`, `lib/AuthContext.jsx` (×2), `DeleteMyData` | Sign out |
| `auth.isAuthenticated()` | `pages/OAuthConsent.jsx` | Base44 MCP consent page (see "Anything else") |

**Roles in use:**
- **Admin:** `user.role === 'admin'`, used in `Layout.jsx`, Admin, `/admin/pilot`, `/tutor-demo` and the backend functions.
- **Partner staff:** decided by the `partner` function, by matching the signed-in email to `Partner.staff_emails`.
- **Everyone else** is a learner.

### Entities (database)

Called as `base44.entities.<Name>.<op>`. Admin content tabs (civics questions, sentences, vocabulary, places) also go through
`src/hooks/useContentManager.js` (`entities[name]`), and Delete my data uses
`entities[name].deleteMany` (`components/profile/DeleteMyData.jsx`, list in
`lib/deleteMyData.js`).

| Entity | Files (operations) | Feature |
|---|---|---|
| `CivicsQuestion` | Practice, Progress, ReviewCivics (`list`); LessonDetail, LearnCivics, QuickCheck, TutorDemo, RehearsalRunner, ThisWeekCard, ExplanationTools (`filter`); admin `CivicsQuestionsTab` via useContentManager | Civics bank, both versions |
| `ReadingSentence` | QuickCheck, RehearsalRunner (`list`); Practice (`bulkCreate`, a one-time seed) | Reading practice |
| `Sentence` | Practice, Progress, QuickCheck, RehearsalRunner; admin `SentencesTab` | Writing (dictation) sentences |
| `VocabularyWord` | Practice, Progress; admin `VocabularyWordsTab` | Vocabulary games |
| `Lesson` | Lessons (`filter`), Dashboard (`list`) | Lessons |
| `LessonFlashcard` | LessonDetail (`filter`) | Lesson key words |
| `LessonQuiz` | none (defined, unused) | none |
| `InterviewQuestion` | InterviewPractice (`list`) | Mock interview |
| `CommunityResource` | `resources/listAllResources.js` (`list`); admin `ResourcesTab` (`update`, `bulkCreate`, `bulkUpdate`) | Resource Hub |
| `UserProgress` | Practice (`filter`/`create`/`update`), LearnCivics, ReviewCivics, PracticePathProgress, awardBadges | Per item progress and spaced review |
| `LessonProgress` | LessonDetail (`create`/`update`), Dashboard, DailyPracticeReminder | Lesson completion and scores |
| `LessonNotes` | LessonNotesTab (`filter`/`create`/`update`), ProgressChart | Learner's notes |
| `N400SectionProgress` | N400Guide, N400Coach (`filter`/`create`/`update`) | N-400 sections read |
| `InterviewSession` | InterviewPractice (`create`), InterviewHistory, TodayCard (`filter`), useRoadmapProgress (`count`) | Mock interview scores |
| `AIStudyLog` | StudyBuddy (`create`), StudyHistory (`filter`) | Ask Vía history |
| `PublicProfile` | `lib/profileService.js`, Profile, useLearnerLocation (`filter`/`create`/`update`) | Profile; "Who Represents Me?" state and district |
| `Notification` | NotificationCenter (`filter`/`update`/`delete`), DailyPracticeReminder (`create`) | In-app daily reminder |
| `ActivityDay` | `lib/activityDay.js` (`filter`/`create`) | Days the app was opened (pilot, partner counts) |
| `OutcomeCheckIn` | `components/pilot/checkInData.js` (`filter`/`create`) | Pilot answers |
| `SavedPlace` | `resources/useSavedPlaces.js` (`filter`/`create`/`delete`) | Saved Resource Hub places |
| `ProgramMembership` | `lib/partners.js` (`filter`/`delete`); written only by the `partner` function | Partner program the learner picked |
| `Partner` | admin `PartnersTab` (`list`/`create`/`update`); read by the `partner` function | Partner programs |
| `CheckInReminder` | `pilot-reminders` function only | Which reminder emails were sent |

### Integrations

| Call | Files | Feature |
|---|---|---|
| `InvokeLLM` | 13 browser files plus `pilot-reminders` | All AI (section c) |
| `SendEmail` | `components/ai/TalkToPerson.jsx`; `pilot-reminders` | Emails (section d) |
| `UploadFile`, `GenerateImage`, `SendSMS`, `ExtractDataFromUploadedFile` | exported in `src/api/integrations.js`, **never called** | none |

### Backend functions (`base44/functions/<name>/entry.js`, shared code in `base44/shared/`)

| Function | Called from | What it does |
|---|---|---|
| `partner` | `src/lib/partners.js` | Actions: `list` active programs, `join` (writes a pending `ProgramMembership`), `staff`, `members`, `setStatus`, `summary` (totals; the only code that reads other learners' `ActivityDay`, to count) |
| `pilot-report` | `components/pilot-admin/PilotDashboard.jsx` | Admins only: one summary per learner keyed by `pilot_id`, using the service role |
| `pilot-reminders` | `components/admin/PilotAdminTool.jsx`; `DeleteMyData` (`forget`) | `send` due reminder emails (an admin presses a button); `forget` deletes the learner's `CheckInReminder` rows |

Step 4 in the plan lists only the AI functions. **These three also need
Edge Functions** (or Postgres views with row-level security, for the counts).
I'd fold them into Step 3, by feature area.

### Anything else

| What | File | Notes |
|---|---|---|
| `base44.appLogs.logUserInApp(pageName)` | `src/lib/NavigationTracker.jsx` (mounted in `App.jsx`) | Sends every page a signed-in user opens to Base44's analytics. **Not in the AI Policy.** Drop it; don't port it. |
| Visual editor bridge | `src/lib/VisualEditAgent.jsx` (mounted in `App.jsx`) | Base44 editor support (`postMessage` to the parent window). Remove. |
| MCP OAuth consent page | `src/pages/OAuthConsent.jsx` (calls `/api/apps/{appId}/mcp/...`) | Base44 platform page. The repo has no MCP config. Remove. |
| `@base44/vite-plugin` | `vite.config.js` | Build plugin (legacy import aliases). Remove with the SDK. |
| `src/pages.config.js` | auto-generated by Base44 | Pages are registered here. After cutover it becomes ordinary code (or explicit routes in `App.jsx`). |
| `base44/config.jsonc` | repo root | Base44's own build settings (`npm run build` → `./dist`). |
| `src/lib/AuthContext.jsx`, `lib/app-params.js`, `UserNotRegisteredError.jsx` | | Base44 login states (`auth_required`, `user_not_registered`). Replace in Step 2. |
| Google Fonts `@import` | `src/index.css` | Not Base44, but a third-party request on every page. The design README says to self-host Lexend (the woff2 files are in `docs/design/fonts/`), so Redesign Prompt 1 drops it. |
| OpenFreeMap / USGS map tiles | `components/resources/ResourceMap.jsx` | Not Base44. The browser fetches map tiles, but no location is sent. Unchanged. |

---

## b. Every entity: fields, learner data, who may read and write

"Learner data" = rows tied to one person. The "should" columns are the rules
for Supabase (Step 1). **Bold** marks where that differs from Base44 today.

| Entity | Fields | Learner data? | Learner | Partner staff | Admin |
|---|---|---|---|---|---|
| `User` (built-in) | email, role, `display_name`, `points`, `badges`, `max_streak`, `tutor_profile`, `skill_levels`, `state`, `checkin_email_reminders`, `reminder_language`, `checkins_stopped`, `app_language`, `pilot_id`, `pilot_intro_seen`, `pilot_test_months_ago` | Yes | Read/write own row (not `role`) | None | Read `role`; the pilot report only through a function |
| `PublicProfile` | user_email, display_name, points, badges_count, representative_state, representative_district, representative_data (old, cleared on load) | Yes | Own row | None | None |
| `UserProgress` | user_email, content_id, content_type, status, last_practiced, ease_factor, interval, consecutive_correct, last_result, best_score, last_score, total_attempts | Yes | Own rows | Counts only (via function) | None |
| `LessonProgress` | user_email, lesson_id, topic, completed, quiz_attempts, best_score, last_score, total_questions, last_attempt_date, needs_review | Yes | Own rows | Counts only | None |
| `LessonNotes` | user_email, lesson_id, lesson_title, lesson_topic, content (free text) | Yes | Own rows | **Never** | **Never** |
| `N400SectionProgress` | user_email, section_id, section_title, completed, completed_date | Yes | Own rows | Count only, **never section names** | None |
| `InterviewSession` | user_email, overall_score, passed, question_count, passed_count, results[] (question, section, expected, content/grammar/fluency/overall score, is_acceptable; no transcripts) | Yes | Own rows | None today | Through the pilot report only |
| `AIStudyLog` | user_email, question, answer, language, created_at | Yes | Own rows | **Never** | **Never** |
| `Notification` | user_email, type, title, message, link, read | Yes | Own rows | None | None |
| `ActivityDay` | user_email, date | Yes | Own rows | Counts only (via function) | Through the pilot report only |
| `OutcomeCheckIn` | user_email, kind, confidence, stage, filed, interviewed, passed_tests, oath, registered_to_vote, would_have_without_pathways | Yes (pilot) | Own rows | **Never** | Through the pilot report only (keyed by `pilot_id`) |
| `CheckInReminder` | user_email, kind, sent_date | Yes | Delete own (through a function) | None | Read and write (function) |
| `SavedPlace` | user_email, resource_id | Yes | Own rows | None | None |
| `ProgramMembership` | user_email, partner_code, status, display_name, share_progress, status_changed_at | Yes | Read and delete own; create and change through a function | Their program's members: display name or email and status; counts; per-learner progress only when `share_progress` | None |
| `Partner` | name, code, staff_emails[], share_learners, active | No (staff emails) | Active programs' name and code, through a function | Their own program | Read and write |
| `CivicsQuestion` | question, answer, version, category, difficulty | No | Read | Read | Write |
| `InterviewQuestion` | section, question, expected_response, response_type, order, tips | No | Read | Read | Write |
| `ReadingSentence` | text, difficulty | No | Read | Read | Write |
| `Sentence` | text, category, difficulty | No | Read | Read | Write |
| `VocabularyWord` | word, category, definition | No | Read | Read | Write |
| `Lesson` | topic, title, description, video_url, content, key_points[], order | No | Read | Read | Write |
| `LessonFlashcard` | lesson_id, term, definition, example | No | Read | Read | Write |
| `LessonQuiz` | lesson_id, question, options[], correct_answer, explanation | No (unused) | Don't port | | |
| `CommunityResource` | name, category, services[], address, city, state, zip, latitude, longitude, location_precision, phone, website, logo_url, hours, languages[], cost, description, source, source_url, last_verified, external_id, relevance_note, is_active | No (public places) | Read | Read | **Write (admins only)** |

**Problems in today's Base44 rules (fix in Step 1, not on `main`):**

1. **`CommunityResource` can be changed by any signed-in user.** The rule is
   `create: created_by_id = user.id`, so the Admin page hides the button but
   the database doesn't block it. In Supabase, only admins should write it.
2. **`Notification`**: `create` checks only `created_by`, so a signed-in user
   could create a notification addressed to another learner's email. In
   Supabase, create only for your own `user_id`.
3. **Learner rows are keyed by `user_email`** (with a lowercase-email
   workaround in Delete my data). In Supabase, key every learner table by
   `user_id uuid references auth.users` and drop stored emails where we can.
   That also makes "partners never see emails unless needed" easier.
4. **The plan's Step 1 says "the partner view gets only anonymous totals,
   with counts under 5 hidden".** Today partner staff see each learner's
   display name (or email) and status, exact counts, and per-learner progress
   for learners who chose "Share my progress". CLAUDE.md says "Counts are
   exact everywhere". **Decide which rule Step 1 follows.**

**New tables from the redesign (Prompt 4, after Step 3):** `lesson_progress`
(new shape), `checkpoint_results`, `review_items` (replaces the spaced-review
fields on `UserProgress`), and `writeLevel` / `writeLevel1Passes` /
`lessonsPerDay` on the profile. If Step 1 runs first, leave room for these
rather than porting `UserProgress`'s spaced-review fields as they are.

**Content export (done Nov 13, `standalone-content-import`).** The content
entities were exported from Base44 and converted to JSON in
`content/base44-export/` (see its README), which Step 1 uses as the seed.
Counts: `CivicsQuestion` 228 (100 for 2008, 128 for 2025),
`InterviewQuestion` 24, `ReadingSentence` 76, `Sentence` 49,
`VocabularyWord` 79, `Lesson` 25, `LessonQuiz` 178, `LessonFlashcard` 115,
`CommunityResource` 5,588, `Partner` 0. Found along the way:

- `Lesson.key_points[]` can carry an `image_url` (shown by `LessonDetail.jsx`),
  but no lesson has one; `Lesson.video_url` is YouTube. No content file is
  stored on Base44, so nothing breaks when it's cancelled.
- 34 `LessonQuiz` and 20 `LessonFlashcard` rows point at 5 deleted lessons
  (kept apart, for review). `LessonQuiz` has 178 real questions but no screen
  uses it.
- The exported 2025 questions are identical to
  `content/civics/questions-2025.json`.

**Learner data does exist in Base44** (Nov 13 counts): 174 `PublicProfile`,
66 `Notification`, 34 `UserProgress`, 13 `ActivityDay`, 12 `AIStudyLog`,
5 `LessonProgress`, 2 `LessonNotes`, 0 for the other learner tables. These
may be test or early accounts. None of it is moved (by decision); those
people start fresh after cutover, and the records must be deleted from Base44
when it's cancelled. Put both in `CUTOVER.md`.

---

## c. Every AI call

All go through `base44.integrations.Core.InvokeLLM`. None sends an email or a
name. Learner text goes through `redactIdentifiers()` only in Ask Vía. Rough
calls per **active learner per month** assume about 12 study sessions.

| # | Feature | File | Exactly what is sent | Calls/learner/month |
|---|---|---|---|---|
| 1 | Ask Vía | `components/ai/StudyBuddy.jsx` (`buildAskPrompt` in `lib/askTutor.js`) | Tutor instructions (name, tone, English mix, fixed rules), the chat language, the learner's question (identifiers stripped), the officeholder rules and context (`VIA_OFFICEHOLDER_RULES`, `buildViaOfficeholderContext()`; the saved state and district only if set), the official 2025 civics list. No web search. | ~20 |
| 2 | Ask Vía privacy note translation | `StudyBuddy.jsx` | The fixed privacy note text and the language name. Cached per language. | ~0 (once per device and language) |
| 3 | Civics answer grading (spoken answers) | `components/civics/checkCivicsAnswer.js` (used by `CivicsTestCard`, `PosterRun`, `lessonSteps`) | The official question, the official answer(s), the learner's answer as text; in lessons also the language name and teaching instructions. Officeholder questions are graded on the device first (`gradeOfficeholderAnswer`). Typed answers are matched on the device (`matchOfficialAnswer`) and don't call the AI. | ~40 |
| 4 | Civics card "In my language" | `components/practice/CivicsTestCard.jsx` | The official question and answer, and the language name | ~5 (non-English learners) |
| 5 | "Why? Explain it simply" fallback | `components/ai/AIExplanation.jsx` | Question, answer, a short context; only when no reviewed explanation exists | ~3 |
| 6 | Reading feedback | `components/practice/ReadingPracticeCard.jsx` | The target sentence and the browser transcript of what the learner read | ~15 |
| 7 | Dictation translation (after the check) | `components/game/DictationCard.jsx` | The sentence or word, and the language label | ~5 |
| 8 | Mock interview scoring | `components/practice/evaluateInterviewAnswer.js` (`evaluateInterviewAnswer`) | Interview question, example response, what the learner said (text), response type | ~20 (2 interviews × 10 questions) |
| 9 | Understanding check (N-400 and personal questions) | same file (`evaluateUnderstanding`) | The officer's question, our plain meaning, what the learner said they think it asks | ~10 |
| 10 | Who Represents Me? | `components/civics/RepresentativeFinder.jsx` | The ZIP (plus a street address only when the ZIP has several districts); **web search on**; returns only state and district | ~0.1 (once) |
| 11 | UI string translation | `lib/translateStrings.js` (via `useHomeTranslation`, `useTranslatedLines`) | Fixed UI strings and the language name, 15 per request; cached per language on the device | ~3 (non-English, first use) |
| 12 | Lesson translation | `hooks/useLessonTranslation.js` | The lesson's text, key points and flashcards; cached | ~5 (non-English) |
| 13 | N-400 card translation, lawyer checklist translation | `components/n400/useN400Translation.js`, `hooks/useLawyerChecklistTranslation.js` | Our fixed N-400 explanation text or the checklist; cached | ~3 (non-English) |
| 14 | Admin: draft explanations | `components/admin/ExplanationTools.jsx` | Official question, answers, language (admins only) | 0 for learners |
| 15 | Pilot reminder email translation | `base44/functions/pilot-reminders/entry.js` | The fixed reminder subject and body and the target language; rejected if it contains forbidden words | 0 to 1 per learner per check-in window |

**Total: about 120–130 calls per active learner per month,** matching the
plan's estimate. About 30 of those are translations that are cached after
first use.

**What the plan's Step 4 misses.** It lists 4 functions (viaReply,
gradeCivicsAnswer, scoreInterview, findDistrict). The app also needs:

- **`translate`** for calls #2, 4, 7, 11, 12, 13 and 15.
- **`readingFeedback`** for #6.
- **`checkUnderstanding`** for #9 (it could share scoreInterview's file).
- **`explainAnswer`** for #5.

**findDistrict** moves from AI with web search to Geocodio, so #10 stops
being an AI call.

---

## d. Emails and schedules

| Email | Sent by | To | What | When |
|---|---|---|---|---|
| Talk to a person | `components/ai/TalkToPerson.jsx` (`SendEmail`, from the browser) | The support address in `src/config/support.js` (the form is disabled until it's set) | The learner's message, their email as reply-to, and a fixed footer. Not stored in the app. | When the learner sends it |
| Pilot check-in reminder | `base44/functions/pilot-reminders/entry.js` (`send`) | Learners with reminders on, whose 3-, 6- or 12-month check-in window is open and who haven't had this reminder yet | Fixed subject and body (never mentions citizenship, immigration, the interview or USCIS: `FORBIDDEN_EMAIL_WORDS`), translated into `User.reminder_language` with an English fallback; writes a `CheckInReminder` row | **An admin presses "Send due reminders"** (Admin → Pilot), weekly |
| Sign-in | Base44's hosted login | | Base44's own login email | Replaced in Step 2 (6-digit code through Resend) |

**Schedules:** none. Base44 can't schedule jobs from this repo, so:
- the pilot reminder emails run by hand;
- the daily practice reminder is an in-app `Notification` created by the
  browser (`DailyPracticeReminder.jsx`) when the learner opens the app.

Step 5's `pg_cron` job would replace the admin button. The in-app reminder
can stay as it is.

---

## e. The officeholders table

It's merged (`src/data/officeholders.json`, logic in
`src/lib/officeholders.js`, tests next to it). It's used by:

- `lib/officeholderQuestions.js`: the 16 questions; `gradeOfficeholderAnswer()`; `VIA_OFFICEHOLDER_RULES`, `buildViaOfficeholderContext()`
- `lib/currentAnswers.js`: names shown for "Answers change" and "Answers vary"
- `lib/learnerLocation.js`: `validateLocation()`, `getOfficialsFor()`, `isStale()`
- `components/civics/checkCivicsAnswer.js` and `components/practice/CivicsTestCard.jsx`: device grading before the AI
- `components/ai/StudyBuddy.jsx` and `lib/askTutor.js`: Ask Vía context
- `components/civics/RepresentativeFinder.jsx`, `OfficeholderNote.jsx`
- `components/lessons/LessonDetail.jsx`, `PosterRun.jsx`, `components/persona/lessonSteps.jsx`, `pages/ReviewCivics.jsx`: feedback and explanations

It makes no network calls, so it moves unchanged. Step 4's
`gradeCivicsAnswer` Edge Function should import the same file (it's plain
JavaScript and JSON, which Deno can import).

---

## f. What Cloudflare Pages needs

| Setting | Value |
|---|---|
| Build command | `npm run build` (Vite) |
| Output folder | `dist` |
| Node version | 20 or 22 (`NODE_VERSION` in Pages settings; matches the lockfile's Vite) |
| Install | `npm ci` (there's a `package-lock.json`) |
| Environment variables today | `VITE_BASE44_APP_ID`, `VITE_BASE44_BACKEND_URL` (plus optional `BASE44_LEGACY_SDK_IMPORTS`). After Step 2/3: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Everything else (AI keys, Geocodio, Resend) is a Supabase secret, never a `VITE_` variable. |
| Single-page routing | **Needed and missing.** Add `public/_redirects` with `/* /index.html 200`. Routes like `/Progress`, `/study?tab=practice` and `/n400-guide?section=…` are client-side. |
| Other build notes | `vite.config.js` uses `@base44/vite-plugin` (remove with the SDK) and sets `logLevel: 'error'`. The map uses a MapLibre web worker bundled with `?worker&url` (works on Pages). `public/manifest.json` and `public/icons/` are static. Lexend should be self-hosted (`docs/design/fonts/`), not loaded from Google Fonts. |
| Headers (optional) | `public/_headers` for a basic Content-Security-Policy once Google Fonts and Base44 are gone |

---

## g. Estimates (hours of Claude Code work, including your review rounds)

| Step | Estimate | Why |
|---|---|---|
| 1. Database and data rules | **8–12 h** | 22 tables (dropping `LessonQuiz`) plus profiles, row-level security on each, a partner-counts view or function, a seed script with fake learners, partner staff and an admin, one test per rule. Plus the content export and seed from Base44 (needs you to export it). Fixes the two rule problems above. |
| 2. Login | **4–6 h** | Email-code sign-in, replacing `AuthContext` and `app-params`, admin role (`app_metadata`), partner staff by email, sign-out and expiry, the sign-in email text. Resend setup is yours. |
| 3. Screens talk to Supabase | **16–24 h** | 39 files call entities directly (66 import the client). One `src/api` module per area (progress, lessons, N-400, interview, Ask Vía history, profile, pilot, partners, places, content), in about 8 small PRs. Delete my data (plus deleting the login, which needs an Edge Function). The `partner` and `pilot-report` functions move here too. |
| 4. AI and lookups | **10–16 h** | One provider file, viaReply, gradeCivicsAnswer (device first), scoreInterview and checkUnderstanding, readingFeedback, explainAnswer, translate, findDistrict on Geocodio, call counts, the evals script. |
| 5. Emails, schedules, export | **5–8 h** | Pilot reminders through Resend and `pg_cron`, the Talk to a person email from an Edge Function (not the browser), the pilot export/CSV. |
| **Total** | **43–66 h** | Before the redesign prompts that add data (4–8). |

**Order with the redesign:** Redesign Prompts 1, 2, 3 and 10 change only the
look and can run before Step 1. Prompts 4–8 add tables, so they wait for
Steps 1–3.
