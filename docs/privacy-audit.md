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
| N-400 answers | Never collected | No | N-400 coaching uses the six made-up practice people; only section completion is saved |
| Audio | No (reading audio upload removed) | No | Mock interview opens the microphone only to draw a live level meter and for the browser's own speech-to-text; nothing is recorded |
| Transcripts (speech-to-text) | **No** (interview transcripts removed) | **Yes, for scoring**: civics spoken answers, interview answers, reading (text only for a tip), lesson practice | Expected: scoring needs the words; nothing is kept. Mock interview personal/morals questions are answered as a practice person |
| Typed answers | Not stored | Civics quiz: answers that clearly match an accepted answer are now checked on the device; only the rest go to the AI, with emails/phone numbers stripped. Tutor lessons check typed answers on the device | Matches the AI Policy's Civics Practice Grading section. A note under the answer box says "Answer only the civics question. Don't include personal information." |
| Learner identity with AI calls | — | No email or name is included in any AI prompt | Persona instructions contain only the tutor's name/tone |

## 3. AI Policy.md

The policy was compared with the app on 2026-10-21. A revised draft with every change marked is in `docs/AI-Policy-updated.md`. Main differences: the policy still describes Study Buddy emails to tutors (removed), tutor leaderboards (removed), and "nothing from a mock interview is saved" (scores are saved, not transcripts); and it doesn't yet cover Ask Vía's case-question declines, quick check levels, tutor settings, the device-only target date and plan, lesson explanations, N-400 coaching with practice people, or "Talk to a person".

## 4. "Free. No ads. We never record your voice or ask about your case."

This line **is not on the home screen yet**. Checked against the code, before adding it:

- **Free / No ads:** no payment or ads code is used (`@stripe/*` packages are installed but not imported anywhere in `src`). ✔
- **We never record your voice:** true now — reading audio upload was removed; the interview opens the mic only for a live level meter; speech-to-text runs in the browser. ✔ (Suggested wording for accuracy: "We never record or keep your voice.")
- **We never ask about your case:** true — the tutor never asks; mock interview personal/morals questions and N-400 coaching use practice people; the plan asks only for a month, on the device; Ask Vía declines case questions. The representative lookup may ask for a street address only to find elected officials, and doesn't save it.

**Conclusion:** the line is accurate. The representative lookup asks for an address only to find elected officials (not about the learner's case), uses it once and doesn't save it. It can be added to the home screen.
