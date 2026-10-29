# Tasks

No application code changes. Groups 2–3 are checked against the code (browser walk-throughs were not available this session); a live walk-through with fake accounts is listed under Workflow follow-up.

## 1. Check the cross-cutting specs against the code

- [x] 1.1 Check `content-integrity` against `src/lib/explanations.js`, `practiceChecks.js`, `askTutor.js`, and the N-400 components; verify `npm test` passes and every scenario is either met or listed in design.md's Known gaps
- [x] 1.2 Check `learner-privacy` against every `base44/entities/*.jsonc` rls block and every `InvokeLLM` call site (`grep -rn InvokeLLM src`); verify each call site is either covered by the spec or listed in Known gaps, and confirm whether `evaluateInterviewAnswer` callers redact (update the gap row)
- [x] 1.3 Check `app-shell` and `language-support` against `src/Layout.jsx`, `TabBar.jsx`, `textSize.js`, `useAppLanguage.js`; verify the focus routes, nav lists, and RTL language list in the specs match the code exactly
- [x] 1.4 Update the RTL list in `CLAUDE.md` (Languages/i18n) to include `prs` and `ps`, matching the code and `language-support`; verify `grep RTL_LANGUAGES src/hooks/useAppLanguage.js` and `CLAUDE.md` list the same six

## 2. Check learner feature specs against the code

- [x] 2.1 Check every `onboarding` and `skill-check` scenario against the code (Home, role dialog, Getting started, quick check, `pretest.js`); verify each is met, corrected in the spec, or listed in design.md's Known gaps
- [x] 2.2 Check every `study-plan` scenario against `studyPlan.js`, `planSettings.js`, `checkIns.js`, `TodayCard.jsx`, `PlanSetup.jsx`, `RoadmapPath.jsx`; verify each is met, corrected, or listed as a gap, and that plan data is written only to browser storage
- [x] 2.3 Check every `civics-learning`, `skill-practice`, and `guided-lessons` scenario against the code; verify each is met, corrected, or listed as a gap, including that matching typed answers skip the AI call
- [x] 2.4 Check every `n400-coaching` and `interview-day` scenario against the code; verify each is met, corrected, or listed as a gap, including that the rehearsal code has no entity or browser-storage writes
- [x] 2.5 Check every `ai-tutor` scenario against the code (persona, avatar, read aloud, Ask Vía, Talk to a person); verify each is met, corrected, or listed as a gap, including redaction before the AI call and no save on declines
- [x] 2.6 Check every `learner-progress` scenario against Progress, Dashboard, Profile, StudyHistory, and DeleteMyData; verify each is met, corrected, or listed as a gap

## 3. Check tutor, classroom, resource, and admin specs against the code

- [x] 3.1 Check every `classroom` scenario against `tutor-link`, `student-progress`, the entity rls blocks, and the tutor components; verify each is met, corrected, or listed as a gap
- [x] 3.2 Check every `resource-hub` scenario against `LawyerPage.jsx`, `ResourceFinder.jsx`, `ResourceMap.jsx`, `resourceHub.js`; verify each is met, corrected, or listed as a gap, including that location is never sent
- [x] 3.3 Check every `admin-tools` scenario against `Admin.jsx`, the admin components, `planImport`, and `TutorDemo.jsx`; verify each is met, corrected, or listed as a gap

## 4. Finish the baseline

- [x] 4.1 Apply any spec corrections found in groups 1–3 to the delta specs; verify `openspec validate baseline-current-app --strict` passes
- [x] 4.2 Turn each row of design.md's Known gaps into a short follow-up note (title + affected capability) in design.md, ready to become its own OpenSpec change; verify every gap row has one

## Workflow follow-up

- Walk through each capability in a running build with fake student, tutor, and admin accounts (needs Base44 env vars and a git branch) to confirm the code-checked scenarios.

- Sync the specs to `openspec/specs/` with `/opsx:sync baseline-current-app`, or archive with `/opsx:archive` once review is done.
- Propose each Known gap fix as its own change (e.g. `/opsx:propose redact-lesson-quiz-answers`).
