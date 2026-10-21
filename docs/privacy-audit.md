# Privacy audit — Pathways Tutor (Prompt 11)

*Code audit of the tutor work (Prompts 0–10) on branch `claude/kind-ride-kfpg9q`, October 2026. No code was changed for this audit. "Base44" = the app's backend database; Base44 admins (the Pathways team) can see everything stored there.*

## 1. Data the tutor work saves

### New since the tutor work started

| Data | Where | What exactly | Who can see it |
| --- | --- | --- | --- |
| Tutor settings | `User.tutor_profile` (Base44) | tutor name, avatar id, tone, English mix | learner; Pathways staff |
| Quick check results | `User.skill_levels` (Base44) | one level per skill (civics / reading / writing / speaking) + date. No answers, no transcripts, no per-question results | learner; Pathways staff |
| Teach / review progress (Prompt 7) | `UserProgress` (Base44, existing entity) | per civics question: practicing/mastered, interval, last result, scores | learner; their tutor in My Classroom; Pathways staff |
| N-400 section completion (Prompt 9) | `N400SectionProgress` (Base44, existing entity) | section id + title, completed, date. Never form answers | learner; their tutor; Pathways staff |
| Target date | `localStorage` `pathways_target_date` (this device only) | `yyyy-mm-dd` | only someone using this browser |
| Plan settings | `localStorage` `pathways_plan` | mode (date / unknown / study) + start date | this device only |
| Today checkmarks, visit dates, dismissed check-ins | `localStorage` `pathways_done_*`, `pathways_last_visit`, `pathways_missed_today`, `pathways_checkins_dismissed` | task ids, dates | this device only |
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
| Address / zip | Not stored (only official names are cached) | **Yes — Representative Finder sends the street address and zip to the AI** to look up officials | ⚠️ Conflicts with "learner-typed text goes to the AI only in Study Buddy". Option: zip only (no street address), or a non-AI lookup |
| Filing date, field office | Never asked or stored | No | The plan asks "when is your interview or when do you hope to be ready" — month only, device only; never asks which office |
| N-400 answers | Never collected | No | N-400 coaching uses the six made-up practice people; only section completion is saved |
| Audio | No (reading audio upload removed) | No | Mock interview opens the microphone only to draw a live level meter and for the browser's own speech-to-text; nothing is recorded |
| Transcripts (speech-to-text) | **No** (interview transcripts removed) | **Yes, for scoring**: civics spoken answers, interview answers, reading (text only for a tip), lesson practice | Expected: scoring needs the words; nothing is kept. Mock interview personal/morals questions are answered as a practice person |
| Typed answers | Not stored | **Civics quiz (old Practice card) sends typed answers to the AI**; tutor lessons check typed answers on the device | ⚠️ Known conflict listed in CLAUDE.md |
| Learner identity with AI calls | — | No email or name is included in any AI prompt | Persona instructions contain only the tutor's name/tone |

## 3. AI Policy.md — what the policy needs to say

*AI Policy.md wasn't provided in this repo, so this is the list of points the app's behavior requires the policy to cover. Paste the policy and I'll mark which are already there.*

1. Which features send text to an AI provider (via Base44): Ask Vía questions; spoken answers (as text) for civics, interview, lesson and quick-check scoring; reading transcripts for a tip; Representative Finder address/zip; civics quiz typed answers; on-demand translation of fixed app text.
2. That no audio is sent or stored; speech is turned into text by the learner's own browser.
3. That no account email or name is sent to the AI.
4. That AI never writes or changes official USCIS answers; accepted answers always come from the official question list; explanations are human-reviewed before learners see them (draft explanations are hidden).
5. That the tutor is not a lawyer, won't answer questions about the learner's own case or eligibility, and points to "Talk to a lawyer first".
6. What is stored and for how long (section 1): Ask Vía history and tutor messages until Delete My Data; quick check levels and tutor settings until Delete My Data; the target date only on the device.
7. That "Talk to a person" messages go by email to the team and are kept under the team's email retention.
8. That tutors in My Classroom can see progress (not Ask Vía history, not the target date).
9. AI provider/model and whether the provider may retain or train on data (depends on Base44's terms — needs confirming).

## 4. "Free. No ads. We never record your voice or ask about your case."

This line **is not on the home screen yet**. Checked against the code, before adding it:

- **Free / No ads:** no payment or ads code is used (`@stripe/*` packages are installed but not imported anywhere in `src`). ✔
- **We never record your voice:** true now — reading audio upload was removed; the interview opens the mic only for a live level meter; speech-to-text runs in the browser. ✔ (Suggested wording for accuracy: "We never record or keep your voice.")
- **We never ask about your case:** mostly true — the tutor never asks; mock interview personal/morals questions and N-400 coaching use practice people; the plan asks only for a month, on the device. ⚠️ Two places ask for personal information that isn't "case" information but is sensitive: Representative Finder asks for a **street address** (sent to the AI), and Study Buddy/Ask Vía lets learners type anything (protected by the note, stripping, and declines).

**Recommendation before adding the line:** make Representative Finder zip-only (or stop sending it to the AI), then the sentence is accurate. Add the line under the home hero once that's done.
