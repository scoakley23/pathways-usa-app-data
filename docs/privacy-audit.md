# Privacy audit — Pathways Tutor (Prompt 11)

*Code audit of the tutor work (Prompts 0–10) on branch `claude/kind-ride-kfpg9q`, October 2026. No code was changed for this audit. "Base44" = the app's backend database; Base44 admins (the Pathways team) can see everything stored there.*

## 1. Data the tutor work saves

### New since the tutor work started

| Data | Where | What exactly | Who can see it |
| --- | --- | --- | --- |
| Tutor settings | `User.tutor_profile` (Base44) | tutor name, tone, English mix (an old picture id, `avatar`, may remain from before; it is no longer shown or used) | learner; Pathways staff |
| Quick check results | `User.skill_levels` (Base44) | one level per skill (civics / reading / writing / speaking) + date. No answers, no transcripts, no per-question results | learner; Pathways staff |
| Teach / review progress (Prompt 7) | `UserProgress` (Base44, existing entity) | per civics question: practicing/mastered, interval, last result, scores | learner; their tutor in My Classroom; Pathways staff |
| N-400 section completion (Prompt 9) | `N400SectionProgress` (Base44, existing entity) | section id + title, completed, date. Never form answers | learner; their tutor; Pathways staff |
| Target date | `localStorage` `pathways_target_date` (this device only) | `yyyy-mm-dd` | only someone using this browser |
| Plan settings | `localStorage` `pathways_plan` | mode (date / unknown / study) + start date | this device only |
| Today checkmarks, visit dates, dismissed check-ins | `localStorage` `pathways_done_*`, `pathways_last_visit`, `pathways_missed_today`, `pathways_checkins_dismissed` | task ids, dates | this device only |
| Getting started answers | `localStorage` `pathways_stage`, `civicsVersion`, `pathways_onboarded` | broad stage (preparing / applied / interview / learning), civics test version (2008 / 2025), done flag; never a date or case detail | this device only |
| Read out loud setting | `localStorage` `pathways_auto_read` | on / off | this device only |
| Text size, cached translations of fixed text | `localStorage` `pathways_text_size`, `pathways_*_tr_*`, `pathways_tutor_lines_*`, `pathways_today_*`, `pathways_ask_tutor_*` | settings; translated app text (no learner text) | this device only |
| Ask Vía questions and answers | `AIStudyLog` (Base44, existing entity) | learner's question, the answer, language, email. **Declined case/eligibility questions are not saved** | learner (Study History); Pathways staff. Not tutors |
| Messages to a tutor | `Message` (Base44, existing entity) | message text | learner, that tutor; Pathways staff |
| "Talk to a person" form | email to `SUPPORT_EMAIL` (not stored in the app) | message + learner's account email (for the reply) | Pathways team mailbox |

### Removed or reduced by the tutor work
- Mock interview: spoken-answer **transcripts are no longer saved** (`InterviewSession` keeps scores only).
- Reading practice: **no audio is recorded or uploaded** (was uploaded to public Base44 storage).
- Test date: moved off the account (`User.test_date` removed) to this device only.
- Study Buddy: questions are **no longer emailed to the tutor**.
- Delete My Data: also resets tutor settings, quick check levels, points/badges/name, and clears this device's app storage.

### Unchanged existing data (for completeness)
`PublicProfile` (name, role, invite code, cached names of elected officials), `LessonProgress`, `LessonNotes` (learner's own free-text notes), `Assignment`, `TutorRelationship`, `Notification`, `InterviewSession` (scores). Tutors can read their active students' `UserProgress`, `LessonProgress`, `N400SectionProgress`, and assignments.

## 2. Search: anything that could store or send sensitive data to the AI

Searched all `InvokeLLM`, `SendEmail`, `UploadFile`, entity `create/update`, and `updateMe` calls.

| Concern | Stored? | Sent to the AI? | Notes |
| --- | --- | --- | --- |
| Immigration status, A-number, case details | No field stores them | Only if a learner types them into Ask Vía | Privacy note above the chat; email/phone numbers are stripped before sending; case questions are declined (local keyword check before the AI, plus the AI flags them) and not saved. Free text in **Lesson notes** and **tutor messages** could contain anything the learner types (stored, not sent to AI) |
| Address / zip | Not stored (only official names are cached) | Zip code, and a street address **only when the zip spans several districts**, for the lookup | Matches the AI Policy: used once, cleared right after, never saved. The screen now says "Your address is used only for this search. We don't save it." |
| Filing date, field office | Never asked or stored | No | The plan asks "when is your interview or when do you hope to be ready" — month only, device only; never asks which office. Getting started asks only whether Form N-400 was sent before or after October 20, 2025, and keeps just the civics test version (2008 / 2025) on the device |
| N-400 answers | Never collected | No | The guide explains questions and shows blank form pages; N-400 practice checks understanding only; only section completion is saved |
| Audio | No (reading audio upload removed) | No | Mock interview opens the microphone only to draw a live level meter and for the browser's own speech-to-text; nothing is recorded |
| Transcripts (speech-to-text) | **No** (interview transcripts removed) | **Yes, for scoring**: civics spoken answers, interview answers, reading (text only for a tip), lesson practice | Expected: scoring needs the words; nothing is kept. Mock interview personal/morals questions and N-400 coaching are never answered: the learner says what the question asks and only understanding is checked (emails/phone numbers stripped) |
| Typed answers | Not stored | Civics quiz: answers that clearly match an accepted answer are now checked on the device; only the rest go to the AI, with emails/phone numbers stripped. Tutor lessons and the civics lesson decks ("Go over them") check typed answers on the device; lesson decks no longer send official questions/answers for translation or ask the AI to explain a missed answer | Matches the AI Policy's Civics Practice Grading section. A note under the answer box says "Answer only the civics question. Don't include personal information." |
| Learner identity with AI calls | — | No email or name is included in any AI prompt | Persona instructions contain only the tutor's name/tone |

## 3. AI Policy.md

The policy was compared with the app on 2026-10-21. A revised draft with every change marked is in `docs/AI-Policy-updated.md`. Main differences: the policy still describes Study Buddy emails to tutors (removed), tutor leaderboards (removed), and "nothing from a mock interview is saved" (scores are saved, not transcripts); and it doesn't yet cover Ask Vía's case-question declines, quick check levels, tutor settings, the device-only target date and plan, lesson explanations, N-400 coaching with practice people, or "Talk to a person".

## 4. "Free. No ads. We never record your voice or ask about your case."

This line **is not on the home screen yet**. Checked against the code, before adding it:

- **Free / No ads:** no payment or ads code is used (`@stripe/*` packages are installed but not imported anywhere in `src`). ✔
- **We never record your voice:** true now — reading audio upload was removed; the interview opens the mic only for a live level meter; speech-to-text runs in the browser. ✔ (Suggested wording for accuracy: "We never record or keep your voice.")
- **We never ask about your case:** true — the tutor never asks; mock interview personal/morals questions, Interview Day and N-400 coaching ask the learner only to say what a question means, never to answer it; the plan asks only for a month, on the device; Ask Vía declines case questions. The representative lookup may ask for a street address only to find elected officials, and doesn't save it.

**Conclusion:** the line is accurate. The representative lookup asks for an address only to find elected officials (not about the learner's case), uses it once and doesn't save it. It can be added to the home screen.

## Addendum — Resource Hub (October 2026)

The "Talk to a lawyer first" page became the **Resource Hub** (`/resources`; `/lawyer-first` still works and opens the lawyer section). It adds "Find help near you" (`src/components/resources/ResourceFinder.jsx`, logic in `src/lib/resourceHub.js`).

| Data | Where | What exactly | Who can see it |
| --- | --- | --- | --- |
| Learner's location (browser location or typed ZIP) | React state on the page only | latitude/longitude or ZIP, for sorting by distance | nobody; not saved, not in the URL, not sent to the AI or to Base44 |
| Places | `CommunityResource` (Base44, new entity) | public listings: name, category, public address, coordinates, phone, website, languages, cost, source, last checked. No learner data | everyone who opens the page; edited by admins |
| Saved places | `SavedPlace` (Base44, owner-only) | the learner's email (lowercase) + the id of a saved public listing. No location, no notes, no search | the learner only (not tutors, not admins); removed by Delete my data |

- ZIP to coordinates uses a bundled Census ZIP table (`src/data/zipCentroids.json`, loaded only when needed), so no lookup service sees the ZIP.
- Outside requests: OpenFreeMap map tiles, or USGS National Map tiles as a fallback (they see the map area being viewed), and Google Maps only when the learner taps "Directions" (destination address only).
- Place logos load from nld.org or from the place's own website only when a learner opens a place's summary on the map (`referrerPolicy="no-referrer"`). Logo links are found before import by keyword rules (`scripts/resources/find_logos.py`), never by AI.
- Saved places (signed-in learners, "Save" on a place): only the listing's id is stored with the email, so the list follows the learner to other devices. The places a learner saves can hint at the area they live in and the kind of help they want; that was accepted so the list follows the account, and nothing else (location, ZIP, search) is stored with it.
- Relevance checks, services and languages are worked out by keyword rules in `scripts/resources/build_update.py` from NLD's public program descriptions and each program's public website front page, before import. No learner data is involved; hidden places keep their reason in the admin-only `relevance_note`.


## Addendum — Pilot check-ins, part 1 (October 2026)

Optional outcome questions for the partner pilot ("Help us improve Pathways", shown once on Home after the learner's first day; `src/components/pilot/`, logic in `src/lib/pilot.js`, codes in `src/config/pilot.js`). AI Policy section: "Pilot Check-ins and Outcome Questions".

| Data | Where | What exactly | Who can see it |
| --- | --- | --- | --- |
| Sign-up answers | `OutcomeCheckIn` (Base44, new, owner-only) | email + kind (`signup`) + fixed choices only: stage (not filed / filed, waiting / interview scheduled / prefer not), readiness 1–5 or prefer not. Unanswered questions are left out; no row if nothing was answered. No free text, no dates | the learner only for now (admin reporting comes with the pilot dashboard) |
| Activity days | `ActivityDay` (Base44, new, owner-only) | email + local date (YYYY-MM-DD), at most one a day (`src/lib/activityDay.js`) | the learner only for now |
| Pilot profile fields | `User` (account) | `program_code` (must be on the allowed list), `state` (two-letter code or prefer not; never ZIP or city), `checkin_email_reminders` (off by default), `pilot_id` (random, for exports), `pilot_intro_seen` | the learner (and admins, like every `User` field) |
| Program code from a link | `localStorage['pathways_program_code']` | a known program code from `?code=`, until the screen is answered or skipped | device only |

- **Partner staff see none of it.** `User` is not readable by other users. `src/lib/pilotPrivacy.test.js` fails if a backend function, a notification screen, or any file other than the screen, the activity recorder and Delete my data touches the new entities or fields. (Human tutor accounts were removed on 2026-10-27; see the last section.)
- **Not sent to the AI.** Only the fixed English text of the screen is translated (`usePilotText`, cached on the device).
- **Stage is new server-side data.** Getting started's stage answer stays on the device; the pilot screen only prefills its own stage question from it, and saves it only when the learner presses Save.
- **Delete my data** deletes `OutcomeCheckIn` and `ActivityDay` and resets the five fields (`src/lib/deleteMyData.js`; `src/lib/deleteMyData.test.js` checks every learner entity and every `User` field is covered).

## Human tutor accounts removed (2026-10-27)

Pathways now focuses on learners studying with Vía. Nobody was using the human-tutor side, so it was removed:

- **Gone from the app:** the role picker at sign-up (everyone is a learner; the first sign-in makes the `PublicProfile` and opens Getting started), the Tutor Portal and My Classroom (`/Tutor`), the Messages page, tutor chat in "Talk to a person" (now the team email form only), "From your tutor" assignments on Practice, and the tutor dashboard on Profile.
- **Gone from Base44:** the `TutorRelationship`, `Assignment` and `Message` entities, the `tutor-link` and `student-progress` functions, `PublicProfile.invite_code` / `account_type`, and `UserProgress.assignment_id`.
- **Effect on the tables above:** "their tutor" no longer applies anywhere. `UserProgress`, `LessonProgress` and `N400SectionProgress` are visible to the learner and Pathways staff only. Delete my data no longer needs to delete chat messages, assignments or tutor links.

## Partner programs (2026-10-27)

- **New data:** `ProgramMembership` (Base44): the learner's email, the partner code they picked, status (pending / confirmed / removed), an optional name (a name only: `cleanName()` drops anything with "@" or 3+ digits), and a share choice (only where the program allows it). Created and changed only by `base44/functions/partner`; the learner can read and delete their own; Delete my data removes it. `Partner` (admin-only): program name, code, staff emails, switches.
- **Who sees it:** the program's staff, through `partner` → `members`, see name-or-email and status for learners who picked their program only. The function never reads `OutcomeCheckIn`, `AIStudyLog`, `LessonNotes`, `InterviewSession` or `UserProgress` (`src/lib/partners.test.js`, plus the existing pilot and Ask Vía privacy tests over every function).
- **Removed:** the free-typed program code on "Help us improve Pathways" and `User.program_code`; `?code=` links were replaced by `?program=CODE`, kept in `localStorage['pathways_program']` until Getting started.
- **Not sent to the AI.** Partner names are shown as written; only the fixed question text is translated.

