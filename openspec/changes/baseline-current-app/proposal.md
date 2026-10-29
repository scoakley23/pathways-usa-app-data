# Proposal

## Why

Pathways USA was built in Base44 and grew through a series of numbered prompts, so its behavior is recorded only in code, `CLAUDE.md`, and scattered docs. There are no OpenSpec main specs yet. A baseline spec captures what the app does today, so future changes can be proposed as small deltas against a known contract instead of being re-derived from code each time.

## What Changes

- Document the app's **current** behavior as OpenSpec capability specs. Every requirement describes observed behavior; this change adds no features and changes no behavior.
- Cover the whole app: cross-cutting rules (privacy, legal/content boundaries, languages, navigation shell) and each feature area.
- Where code and existing docs disagree, record the code's behavior and list the discrepancy in `design.md` under Open Questions rather than silently choosing.
- No code changes. Implementation tasks are limited to verifying the specs against the running app and syncing them to `openspec/specs/`.

## Capabilities

### New Capabilities
- `content-integrity`: Official USCIS civics answers come only from the question bank; AI explains but never changes answers; the app is not a legal service and never advises on a learner's own N-400 answers or eligibility.
- `learner-privacy`: What learner data is stored, where (account entities vs. device-only), what is never stored, access rules, what is sent to AI, and deleting one's data.
- `app-shell`: Navigation (phone tab bar, desktop nav, Menu), focus routes, brand/disclaimer placement, text size, accessibility minimums.
- `language-support`: Choosing a language, on-demand UI translation with per-language caching, and right-to-left layout.
- `onboarding`: Signed-out landing, role choice, Getting started steps, and the tutor introduction for new learners.
- `skill-check`: The quick check pretest, level cutoffs, saving levels only, and re-checking one skill.
- `study-plan`: Target date and plan mode on the device, the Today card, task selection, check-ins, and the Home roadmap.
- `civics-learning`: Teach-then-practice for civics (`/learn`, `/review`), reviewed explanations, test versions, and current-officials / varying answers.
- `skill-practice`: Reading, writing (dictation), civics, and interview practice, including speech input, scoring, and feedback.
- `guided-lessons`: The tutor lesson engine (step types, check mode, skippable parts), the topic lesson library, quizzes, and lesson progress.
- `n400-coaching`: The N-400 guide and coach using a practice person, form wording, and section-completion saving.
- `interview-day`: The interview "what to expect" guide and full rehearsal that saves nothing.
- `ai-tutor`: The tutor persona (name, portrait, expressions), tutor lines on pages, read-aloud, Ask Vía, and Talk to a person.
- `resource-hub`: Find help near you (device-only location, distance sort, filters, map/list), the lawyer-first section, and human-checked place listings.
- `classroom`: Human tutor ↔ student links, assignments, messages, notifications, and tutor views of student progress.
- `learner-progress`: Progress, points, badges, study history, and profile settings (no leaderboards or punishing streaks).
- `admin-tools`: Admin-only management of places, current officials, explanation export, and the tutor lesson demo.

### Modified Capabilities
<!-- None: no main specs exist yet. -->

## Impact

- Adds `openspec/changes/baseline-current-app/specs/*/spec.md` (17 capabilities); after sync, these become the first files under `openspec/specs/`.
- No changes to application code, Base44 entities, functions, or the live app.
- Future OpenSpec changes will modify these capabilities instead of creating new ones.
