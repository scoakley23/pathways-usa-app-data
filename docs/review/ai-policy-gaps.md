# AI policy check: gaps between the policy and the code

**Status: draft for the owner's review.** Nothing here has been approved, and `docs/AI-Policy-updated.md` has not been edited.

- Checked on: 2026-11-26, against `standalone` at `c7f48cf`.
- Policy version checked: "Updated November 20, 2026" (`docs/AI-Policy-updated.md`).
- Line numbers below are the policy's line numbers.

**How to use this list:** each row gives what the policy says now (or "missing"), the wording I suggest, and the code the suggestion is based on. Tick the box when you accept a row. Then a later PR can copy the accepted wording into the policy and into the in-app copy (Settings → AI policy bundles the same file).

## Summary

| # | Area | Kind | Severity |
|---|------|------|----------|
| 1 | Where the AI runs: officeholder questions in Ask Amio | Contradiction | High |
| 2 | Civics grading: only Base44 named | Out of date | High |
| 3 | Mock interview scoring: only Base44 named | Out of date | High |
| 4 | Ask Amio: saying a question (no chat box any more) | Out of date | Medium |
| 5 | Ask Amio: where the privacy reminder sits | Out of date | Low |
| 6 | Check-ins that suggest plan changes | Describes a feature not in the app | Medium |
| 7 | Notifications and the daily reminder | Missing | Medium |
| 8 | Badges and points with no pop-up | Clarify | Low |
| 9 | Deletion list: course data and AI usage counts | Missing | Medium |
| 10 | Deletion: sign-in account wording | Unclear | Medium |
| 11 | Practice record: spaced repetition and "email" | Out of date for Supabase | Low |
| 12 | "AI Use": only Base44 named | Out of date | Low |
| 13 | Interview Day: "small talk" | Not in the app | Low |
| 14 | Talk to a person: where the form is | Out of date | Low |
| 15 | "Profile" (now Settings) | Out of date | Low |
| 16 | Daily limits and the support limit | Correct, one small precision | Low |
| 17 | Ask Amio's pre-written answers | Correct, one small precision | Low |
| 18 | "When's my interview?" | Correct | none |
| 19 | AI model and server-side fallback | Missing (optional) | Low |
| 20 | Server logs | Check before switching on | Low |

## The six changes you asked about

| Change | Policy today | Result |
|---|---|---|
| AI daily limits (`AI_LIMITS`) and the support limit | Lines 16 and 94 | Numbers match (30 / 200 / 100 / 50 a UTC day, support 3). One small precision suggested: row 16. |
| Supabase Edge Functions vs Base44 | Lines 9, 14–16, 34, 71, 81, 94, 139, 153 | Ask Amio, limits, Talk to a person and reminders are right. Civics grading and interview scoring still name Base44 only: rows 2, 3, 12. |
| No "New badge" pop-up (badges still saved) | Line 48 | Correct ("Learners no longer see stars or badges…"). Optional clarification: row 8. |
| Ask Amio's pre-written answers | Line 81 | Correct. One small precision suggested: row 17. |
| Notifications no longer send a test push | Not mentioned anywhere | Notifications are missing from the policy entirely: row 7. |
| "When's my interview?" device-only | Lines 24, 60, 164 | Correct and complete: row 18. |

## Rows

### 1. Officeholder questions and Ask Amio (contradiction)
- [ ] Accept
- **Policy, line 14:** "Questions about current officeholders and state capitals never go to the AI."
- **What the code does:** this is true for **grading**. `civics_check` and `explain` refuse officeholder questions: `src/lib/aiRequests.js:105` and `:209` (`officeholderKindFor`). But an **Ask Amio** question about an officeholder does go to the AI, together with the app's checked list: `src/lib/askTutor.js:178` (`buildViaOfficeholderContext`), and `aiRequests.js:70-93` has no officeholder check for `ask`. Line 81 of the policy already describes this correctly, so line 14 contradicts line 81.
- **Suggested wording (line 14):** "Answers to civics questions about current officeholders and state capitals are never graded or explained by the AI: the app checks them on the learner's device against its own list. If a learner asks Amio about one, Amio answers only from that list (see Ask Amio)."

### 2. Civics grading names only Base44
- [ ] Accept
- **Policy, line 34:** "Other answers are graded by the AI service built into the base44 platform: …"
- **What the code does:** on Supabase, `civics_check` goes through the `ai` Edge Function to Claude (`src/api/ai.js:34-42`, `supabase/functions/ai/index.ts`). On Base44 it uses `InvokeLLM` (`ai.js:43-46`).
- **Suggested wording:** "Other answers are graded by AI: on the new system by Anthropic's Claude through Pathways USA's server (see "Where the AI Runs, and Daily Limits"), on the current system by the AI service built into base44. In course lessons, typed answers are checked only on the device; in Practice, typed answers that don't match are graded by the AI like spoken ones."
- **Why:**
  - In the lesson player, typed answers are checked on the device only (`gradeCivics()`, CLAUDE.md, Lesson player).
  - Practice's `CivicsTestCard.jsx:160-175` sends any unmatched answer, typed or spoken, to `checkCivicsAnswer()`.
  - Today the policy's "Go over them" sentence covers only the older lesson deck.

### 3. Mock interview scoring names only Base44
- [ ] Accept
- **Policy, line 71:** "…to the AI service built into the base44 platform. … The specific AI provider behind this service is not yet fully known…"
- **What the code does:** the `interview` and `understanding` kinds (`aiRequests.js:131-200`) go through the `ai` Edge Function on Supabase, like row 2.
- **Suggested wording:** "To score each answer, the app sends the text transcript, the interview question and the expected answer (in the understanding sections: the question and, in the N-400 lessons, its plain meaning) to the AI: Anthropic's Claude through Pathways USA's server on the new system, or the AI service built into base44 on the current one (whose provider is not yet fully known; see Third-Party AI Tools)."

### 4. Ask Amio: saying a question
- [ ] Accept
- **Policy, line 91:** "The learner's browser turns the speech into text in the chat box… The learner reads the text and sends it like a typed question."
- **What the code does:** there is no chat box. When the learner stops speaking, the words are asked straight away (`src/components/ai/StudyBuddy.jsx:309-314`: `rec.onend` → `ask(words)`). Typing is a small "Type instead" option.
- **Suggested wording:** "**Saying a question:** learners tap the microphone and ask out loud, in their own language. The learner's browser turns the speech into text (see Speech Input and Voice Data above), and the question is sent when the learner stops speaking. Learners can also choose "Type instead". Pathways USA never receives or stores audio. The question is handled and saved exactly as described above."

### 5. Ask Amio: privacy reminder location
- [ ] Accept
- **Policy, line 89:** "…the app shows this reminder at the top of the chat, with the full note one tap away."
- **What the code does:** a short privacy line with "Read more" on the Ask Amio screen (`StudyBuddy.jsx:363-373`). There is no chat.
- **Suggested wording:** "…the app shows this reminder on the Ask Amio screen, with the full note one tap away."

### 6. Check-ins that suggest plan changes
- [ ] Accept
- **Policy, line 64:** "**Check-ins:** the app may suggest a shorter plan after missed days, more practice for a skill that has been hard, a short re-check every two weeks, or more English when scores are high…"
- **What the code does:** the logic exists in `src/lib/checkIns.js`, but no screen imports it (only its test does). Today shows the lesson, the goal bar, the readiness tiles and the Review chest (CLAUDE.md, Today). Your plan says "Missed a day? No problem. I'll adjust the plan." The name also clashes with the pilot "Check-ins" (line 124 onward).
- **Suggested wording:** delete the paragraph, or replace it with: "**Plan changes:** if a learner misses a day, the plan simply continues; nothing is lost and no message is sent. All of this is worked out from progress the app already saves."

### 7. Notifications and the daily reminder (missing)
- [ ] Accept
- **Policy:** notifications are mentioned only in the deletion list (line 164).
- **What the code does:**
  - Once a day, if the learner hasn't practiced, the app adds an in-app notification, "Your lesson for today is ready". It is saved as a `Notification` record (Base44) / `notifications` row (Supabase): `src/components/notifications/DailyPracticeReminder.jsx:51-57`.
  - The daily reminder switch is kept on the device only (`pathways_daily_reminder`, `src/lib/reminderSetting.js`).
  - If the learner allows phone notifications, the open app shows the newest unread one as a browser notification (`NotificationCenter.jsx:49-55`, `:102-109`). There is no push server, and turning them on no longer sends a test notification.
  - Not on Interview Day (CLAUDE.md, Interview Day).
- **Suggested wording (new short section after "Reading aloud"):** "**Reminders and notifications:** if the learner hasn't practiced yet that day, the app adds a reminder to their notifications ("Your lesson for today is ready"). Notifications are saved with the learner's account and only they can see them. Learners can turn the daily reminder off in Settings; that choice is kept on the device. If a learner allows phone notifications, the browser shows new ones while the app is open; Pathways USA does not use a push service and sends no test notification. Reminders are not emails or text messages, and nothing in them is sent to the AI."

### 8. Badges and points with no pop-up (clarify)
- [ ] Accept
- **Policy, line 48:** correct already.
- **What the code does:** `src/lib/awardBadges.js:5-19` still saves earned badges to the account after a Practice run, `/learn` or `/review`, with no "New badge" pop-up. Points too (`profiles.points` / `badges`, `supabase/migrations/20261114000001_schema.sql:153-154`).
- **Suggested wording (optional, end of line 48):** "No message about a new badge is shown."

### 9. Deletion list: course data and AI usage counts (missing)
- [ ] Accept
- **Policy, line 164:** the "How deletion works" list has no course data and no AI or support counts.
- **What the code does:** on Supabase, `delete_my_account()` deletes the login, and every learner table cascades with it (`src/api/account.js:163-191`). That includes `lesson_progress`, `checkpoint_results`, `review_items`, and `ai_usage` (`on delete cascade`, `supabase/migrations/20261117000001_ai_usage.sql:12`). Line 48 says "Delete my data removes them", but the full list should match.
- **Suggested wording (add to the list on line 164):** "…course progress (lesson steps and stars, checkpoints passed and the review schedule), lessons per day and the Write it level, the daily counts of AI requests and contact messages, …"

### 10. Deletion: sign-in account wording
- [ ] Accept
- **Policy, line 164:** "On the new system, it also deletes the sign-in account itself. The sign-in account itself is deleted on request by emailing…"
- **What the code does:** Supabase deletes the login (`account.js:186-191`). Base44 can't delete it and resets the account fields instead (`account.js:202-205`, `ACCOUNT_RESET` in `src/lib/deleteMyData.js:31-39`). The two sentences read as if they contradict each other.
- **Suggested wording:** "On the new system, it also deletes the sign-in account itself. On the current system the app can't delete the sign-in account; learners can ask for that by emailing pathwaysusacitizenship@gmail.com."

### 11. Practice record: spaced repetition and "linked to email"
- [ ] Accept
- **Policy, line 31:** "…and spaced-repetition values used to decide when to review it again. This record is linked to the learner's email address…"
- **What the code does:** on Supabase, `user_progress` keeps status, results and scores only (`src/api/progress.js` no longer sends `ease_factor` / `interval`). Review timing lives in `review_items` boxes 1–5 (`src/lib/reviewSchedule.js`). Rows are keyed by the login's `user_id`, not an email column.
- **Suggested wording:** "…when it was last practiced, and when it should come back for review. This record is linked to the learner's account (on the current system, by email address), never to their voice."

### 12. "AI Use": only Base44 named
- [ ] Accept
- **Policy, line 9:** "…through an application built on base44, which utilizes third-party AI platforms."
- **What the code does:** the move to Supabase and Claude (`src/api/provider.js`, `supabase/functions/ai/`).
- **Suggested wording:** "…through an application currently built on base44 and moving to Pathways USA's own system (Supabase), where AI requests go to Anthropic's Claude through Pathways USA's server."

### 13. Interview Day: "small talk"
- [ ] Accept
- **Policy, line 78:** "…the promise to tell the truth, small talk and an N-400 review…"
- **What the code does:** `DAY_PARTS = ['oath', 'n400', 'reading', 'writing', 'civics']` (`src/lib/interviewDay.js:19`). There is no separate small-talk part.
- **Suggested wording:** "…the promise to tell the truth, an N-400 review where the learner says what each question is asking (never answers it), then reading, writing, and civics." Also: "…Leaving or refreshing the page erases it. The daily reminder does not run on this page." (optional)

### 14. Talk to a person: where the form is
- [ ] Accept
- **Policy, line 94:** "Learners can reach a person from the Ask Amio screen with a short form."
- **What the code does:** the form is on Ask Amio (`StudyBuddy.jsx:496`) and in Settings → Contact us (`src/components/shell/SettingsPage.jsx`).
- **Suggested wording:** "Learners can reach a person from the Ask Amio screen or Settings (Contact us) with a short form."

### 15. "Profile" is now Settings
- [ ] Accept
- **Policy, lines 116 and 137:** "later on their Profile" / "turn them back on in Profile".
- **What the code does:** `/Profile` redirects to Me / Settings (`profileRedirect()` in `src/lib/shellRoutes.js`). My tutor and Help us improve Amio are in Settings.
- **Suggested wording:** line 116 "…and later in Settings (My tutor)…"; line 137 "…and turn them back on in Settings (Help us improve Amio)."

### 16. Daily limits and the support limit (correct; one precision)
- [ ] Accept
- **Policy, line 16:** the numbers are right: `AI_LIMITS` (`src/lib/aiRequests.js:21`) = `ai_daily_limit()` (`20261117000001_ai_usage.sql:23-31`); support 3 = `SUPPORT_DAILY_LIMIT` (`src/config/support.js:12`) = `20261118000001_support_limit.sql`. "Only for the latest day the learner used it" is right: `take_ai_request()` deletes earlier days only when the learner makes a new request.
- **Small precision:** "The same count covers…" reads as if messages share the AI count. They are a separate group (kind `support`) in the same table.
- **Suggested wording:** "Talk to a person" messages are counted the same way, separately (3 a day)."

### 17. Ask Amio's pre-written answers (correct; one precision)
- [ ] Accept
- **Policy, line 81:** correct. `preparedAnswer()` (`src/lib/askAnswers.js`) uses only `reviewed` entries in `content/ask/answers.json` (56 entries, all `reviewed` today), and only when the translation pack has them in the chat language (English needs nothing).
- **Suggested addition:** "These answers never name a current officeholder. Pre-written answers are saved to the learner's history the same way."

### 18. "When's my interview?" (correct)
- [ ] Accept as is
- **Policy, lines 24, 60, 164:** matches the code. The values are device-only (`pathways_field_office` and `pathways_filed_month`, `src/lib/interviewEstimate.js`). The ranges come from the bundled file (`content/uscis/n400-processing-times.json`), with "Estimate only. Not legal advice." "Add the earlier month to my plan" is `savePlanChoice` (`src/components/interview/WhenInterviewPage.jsx:159`). Delete my data clears every `pathways_` key (`src/components/profile/DeleteMyData.jsx:15-24`).
- **Optional:** mention that Today and Settings → Your interview show the same device-only estimate ("Case likely done …").

### 19. AI model and server-side fallback (optional)
- [ ] Accept
- **Policy, line 153:** names Anthropic (Claude) but no model.
- **What the code does:** `AI_MODEL` defaults to `claude-sonnet-5-5`. On a refusal, Anthropic's server-side fallback may answer with another Claude model (`supabase/functions/ai/index.ts:35-38`, `:100-102`).
- **Suggested wording (optional):** "Requests use a Claude model chosen by Pathways USA; if that model declines a request, Anthropic may answer it with another Claude model under the same terms."

### 20. Server logs (check before switching on)
- [ ] Owner to check
- **Policy, line 14:** "The server does not log or save the question, the answer or what the learner said."
- **What the code does:**
  - `ai` and `support-message` log only status codes and kinds (`ai/index.ts:80,106,112,118`), and a support error's first 40 characters (`support-message/index.ts`).
  - `pilot-report` logs the whole error object (`supabase/functions/pilot-report/index.ts:81`). It holds no learner text, but it could include query details.
- The policy's claim holds today. Consider trimming the `pilot-report` log line in a separate change. Not a policy edit.
