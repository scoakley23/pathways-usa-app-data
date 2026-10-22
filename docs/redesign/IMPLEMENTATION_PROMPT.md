# Prompt: implement the Pathways brand kit and the "X2" app design

> Paste everything below the line into Claude Code (or another coding agent) working in this repo. It is written to be done in phases, one pull request per phase.

---

You are working in the Pathways USA repo (React 18 + Vite + Tailwind + shadcn, Base44 backend). Read `CLAUDE.md` first and follow every rule in it. Merging to `main` updates the live app, so work on a branch per phase and open one pull request per phase. **Before changing any code in a phase, show me a short plan for that phase and wait for my OK.**

## What we are building

We are re-skinning the app with the new **Pathways brand kit** and the **X2 design** ("index cards that become posters"). This changes how the app looks and how Today, Lessons, Practice and the N-400 area are presented. It does **not** change what data we store, the AI policy, the legal rules, or the official question/answer content.

Sources of truth (in this repo):
- `docs/redesign/brand-spec.md`: names, logo, Vía, colors, type, motifs and voice. Treat it as binding.
- `docs/redesign/assets/*.svg`: reference SVGs for the Pathways mark (`pathways-mark.svg`, `pathways-mark-small.svg` for ≤ 24px, `pathways-mark-white.svg` for posters), the app icon (`app-icon.svg`) and Vía's mark (`via-mark.svg`).
- The design canvas (for the human reviewer; you may not be able to open it): boards **BK2** brand kit, **BK3** in use, **BK4** practice screens and **"Pathways app · X2 with the brand kit"**.

## Decisions already made (do not reopen)

1. **Name stays Pathways.** Store title "Pathways: US Citizenship Test", subtitle "Free tutor in your language". Wherever the brand meets the public (landing/splash, footer, store text), show **"Free practice · Not affiliated with USCIS"**. Never use "official", USCIS branding, seals, eagles, flags, shields, torches or the Statue of Liberty.
2. **Logo = "Merging roads"** (F1): a long road and a shorter side road merge and bend toward one red dot. Wordmark "Pathways" in Instrument Serif. Lockups: symbol left of word (horizontal) and symbol over word (stacked). Use the heavier `pathways-mark-small.svg` geometry under 24px. On red or blue posters the mark and dot are white.
3. **Vía is always the V mark.** Two paths meeting at a red dot, pointing down. Pathways leads up; Vía meets you where you are. She is never a human face, photo or drawn portrait, and is always labeled "Vía · AI tutor". Show her mark **once per screen**: the center of the tab bar. Elsewhere she signs in text ("— Vía"). The Pathways logo dot and Vía's dot may share a screen; no other Signal-red decor on that screen.
4. **Type:** Instrument Serif (headlines, numerals, Vía's spoken lines in italic), Instrument Sans (all UI and body text, ≥ 16px), Caveat (Vía's short handwritten notes only, ≥ 20px), Courier Prime (N-400 form wording only). Manrope goes away.
5. **Color tokens** (see brand-spec table): Ink `#14264A`, Ink deep `#0F1B36`, Signal red `#D9483F` (dot and small decor only, never text), Red ink `#B53A32` (red text and red posters), Paper `#FFFFFF`, Mist `#F3F5F9` (app background), Linen `#ECEAE4`, Slate `#D5DDEA` (ground behind card stacks), Line `#DEE4EE`, Muted `#3D4F73`, Manila `#EFDFB8` (N-400 only), subject colors Civics `#1F4C8F`, Reading `#1E6B66`, Writing `#2E7D4F`, Speaking `#B53A32`.
6. **Posters:** test questions and practice items are full-bleed posters that **alternate Red ink and Civics blue** card by card, with white text (white on `#B53A32` ≈ 5.6:1, on `#1F4C8F` ≈ 8.5:1). Keep one constant to switch to "red = civics, blue = English skills" later.
7. **Time:** no big countdown. Learners may wait a year or more. Show readiness and a weekly rhythm. Show "about N weeks" only as a small line when the learner has set an interview month (the existing device-only target date).
8. **Voice:** calm, plain, respectful. "Explain it simply" is the standard way to ask for a simpler explanation. No mascots, streaks, hearts or leaderboards (already a CLAUDE.md rule).

## Decision to confirm with me before Phase 2

**Tutor pictures.** Today the app has six portrait tutors (`src/assets/tutors/`, `TutorAvatar.jsx`, picker in `TutorChoices.jsx`) and an option to use the learner's own photo (device-only, `src/lib/tutorPhoto.js`). The brand says Vía is always the V mark.

My recommendation: **show the V mark for every tutor**. Remove the picture step from Getting started and the picture picker from Profile. Keep tutor **name** and **tone** choices (learners can still rename their tutor). Clear the saved device photo (`pathways_tutor_photo`) once on load, and leave the old `tutor_profile.avatar` value ignored, not migrated. Ask me to confirm, or tell me what I'd rather do, before touching this.

## Rules that must still hold (from CLAUDE.md, restated)

- **Official content.** Civics questions and accepted answers come only from the question bank (`CivicsQuestion`, versions 2008/2025). Feedback always shows official accepted answers. AI may explain but never changes, adds or invents answers. Only `"reviewed"` explanations from `content/explanations/{lang}.json` are shown.
- **Legal.** We explain what N-400 questions mean; we never tell a learner how *they* should answer or whether they're eligible. Every N-400 item keeps "Talk to a lawyer first" (`/lawyer-first`). Practice for N-400 items checks understanding only.
- **Privacy.** No new stored data, no new AI calls, no new entities or fields unless I approve. Location, target date, notes and photos stay as they are today. Keep `docs/privacy-audit.md` and `docs/AI-Policy-updated.md` accurate. If a phase changes data handling, update them in the same PR.
- **Accessibility.** Mobile-first at 360px. Buttons ≥ 44px. Body ≥ 16px. Contrast ≥ 4.5:1 (check every text-on-poster and text-on-manila pair). Real buttons and labels. RTL for `ar`, `fa`, `ur`, `he`.
- **Unchanged.** Keep the official N-400 paper-form replica (`src/components/n400/N400PaperForm.jsx`, `form/`) in its own look. Don't edit `src/pages.config.js` (only `mainPage`). Interview Day must still save nothing.
- **Every PR:** `npm run lint` clean, `npm test` passing, `npm run build` passing. Test with fake data only.

## Phases (one PR each)

### Phase 1: Tokens, fonts and building blocks
- `src/index.css`: replace the Manrope import with Instrument Serif (400, italic), Instrument Sans (400/500/600/700), Caveat (600/700) and Courier Prime (400/700) from Google Fonts. Set body to Instrument Sans.
- `tailwind.config.js`: update the `pw.*` colors to the brand values. Keep existing token names where the meaning is the same (`pw-navy` = Ink, `pw-red` = Signal red, `pw-red-ink` = Red ink, `pw-page` = Mist, `pw-line`, `pw-muted` = Muted) so existing classes keep working. Add `pw-linen`, `pw-slate`, `pw-manila`, `pw-civics`, `pw-reading`, `pw-writing`, `pw-speaking`. Set font families `sans` = Instrument Sans, `display` = Instrument Serif, plus new `hand` = Caveat and `form` = Courier Prime. Fix any shadcn CSS variables in `index.css` that still point at old colors.
- `src/components/pathways/ui.jsx`: restyle the existing blocks (`Tag`, buttons, `RaisedCard`, `SegmentedProgress`, `Eyebrow`, `SKILL_*` maps → new subject colors) and add:
  - `PathwaysMark` (props `size`, `tone` = ink|white; uses the small geometry at ≤ 24px) and `PathwaysLockup` (horizontal|stacked, optional descriptor line)
  - `ViaMark` (size; decorative unless labeled)
  - `IndexCard` (white, radius 14, optional thin top rule and colored tab label)
  - `Poster` (full-bleed block in `red`|`blue`, white text, caps label, huge Instrument Sans 700 question, Instrument Serif italic answer line, white mark)
  - `Folder` + `FolderTab` (manila folder with colored section tabs)
  - `FormQuote` (Courier Prime, label "ON THE FORM · WORD FOR WORD", source line "— Form N-400, item {n}")
  - `ExplainSimplyButton`
- Update the **Design** section of `CLAUDE.md` to describe the new kit (replace the "Calm and confident" Manrope/navy/red text, keep the rules that still apply). Link `docs/redesign/brand-spec.md`.
- No screen layout changes yet. Expect visual drift only from the new fonts and colors.

### Phase 2: Logo, Vía and app chrome (after the tutor-picture decision)
- `index.html`: title "Pathways: US Citizenship Test", favicon/apple-touch icon from `app-icon.svg` (generate PNGs at 16, 32, 180, 192, 512), theme color Ink. Update the web manifest if one exists.
- `TutorAvatar.jsx`: render `ViaMark`. Apply the confirmed tutor-picture decision (Getting started step, `TutorChoices.jsx`, Profile, `tutorPhoto.js`, and the CLAUDE.md lines about portraits and expressions).
- `TabBar.jsx`: tabs **Today · Lessons · Vía (center, `ViaMark`, opens Ask Vía via `openTutorChat()`) · Practice · N-400**. Rename "Learn" to "Lessons" and keep the `/Lessons` path. Do the same in the desktop nav in `Layout.jsx`. Make sure Vía's mark appears once per screen: remove other avatar spots on the same screen (`TutorLine`, `TutorMessage`, `PageHeader` guide), or turn them into a "— Vía" text signature.
- Signed-out landing (`StartHereCard`) becomes the **splash**: stacked lockup, "Free U.S. citizenship test practice", "Civics, reading, writing, and the interview. Learn in your language, answer in English.", the line "Free practice · Not affiliated with USCIS", and a hello card: "Hi, I'm Vía, your AI tutor. I'll explain things in plain words." with "Vía · AI tutor".

### Phase 3: Today (X2)
- Header: small horizontal lockup left and the learner's stage right ("Waiting for interview" etc. from the existing Getting-started stage). Then "Good evening, {name}." in Instrument Serif. Then today's line in Instrument Serif italic signed "— Vía". No avatar in the header.
- Main area: a **card stack** on Slate. The top card is today's main task from the existing plan logic (`studyPlan.js` / `TodayCard`; keep all logic, checkmarks and check-ins). It has a subject-colored tab ("Civics · Lesson 1"), a kicker ("LESSON 1 · STEP 2 OF 5"), a title, the time estimate and a pill button. Tapping it opens the task. If the task is a question run, its first screen is a Poster.
- Optional: a small sticky note on the stack with one handwritten (Caveat) line from Vía, signed in text.
- "Also today": two small cards for secondary tasks (e.g. Practice, N-400 section).
- Finished tasks show a small stamp ("DONE"/"FILED") on the card. No streaks.
- Keep the existing reminders, check-ins and the device-only target date. Show "about N weeks" only when an interview month is set.

### Phase 4: Lessons tab
- `/Lessons` becomes a **card box**: the five official topics (Principles of American Democracy, System of Government, Rights and Responsibilities, U.S. History, Geography and Symbols) as colored dividers, each with "n of m lessons" from `LessonProgress`.
- A lesson opens as a **deck** with segmented progress through five steps: **Watch** (the `video_url` if present), **Learn** (the lesson `content` / `key_points`, one idea per card, tappable glossary words via `GlossaryText`, "Explain it simply" and the existing translation), **Key words** (`LessonFlashcard` as flip cards), **Questions on the test** (the official questions for this lesson, with their official answers: "These are the exact questions the officer may ask"), **Go over them** (a Poster run, then a done card with a summary and the existing `LessonNotes` box).
- For "Questions on the test", find how to link a lesson to its civics questions without new data if possible (e.g. by topic plus an explicit list in the lesson content). If a new optional field is needed (e.g. `Lesson.civics_question_ids`), **ask me first**. "Go over them" should reuse the existing teach-then-practice checks (`checkCivicsAnswer()` for spoken, `matchOfficialAnswer()` for typed) and the `/learn` / `/review` logic rather than duplicating it.
- Keep `/learn` and `/review` working (Today links to them). Style them with the same Poster/IndexCard components.

### Phase 5: Practice (red and blue)
- Practice hub: four part cards (Civics, Reading, Writing, Speaking) with alternating red/blue strips, plus "Mixed practice".
- Each practice item (civics question, read aloud, listen and write, speaking/interview question) renders as a Poster with a caps label ("PRACTICE · CARD 2 OF 6") and a row of small squares in alternating colors. Colors alternate red/blue across cards.
- Feedback stays on the poster's color: "Answer: …" in Instrument Serif italic with official answers only. Reading and writing keep the word-by-word check (`wordDiff.js`, `checkDictation()`).
- "Explain it simply" opens a white sheet with Vía's explanation (existing explanation sources only).
- For N-400 speaking items: understanding only ("Say what this question is asking"), plus "Talk to a lawyer first".
- Keep all existing modes and query params (`/Practice?mode=reading|dictation|civics|interview`) and the `InterviewSession` save rules (scores only).

### Phase 6: N-400 folder
- `/n400-guide` and `/n400-coach` use the manila **Folder** with colored section tabs (Part 8; Part 9 groups: Citizenship, voting, and taxes · Groups and violence · Crimes and offenses · Immigration history · Selective Service and military · Oath questions), with "n of 7 sections read" from `N400SectionProgress`.
- Each item shows its wording in `FormQuote` (Courier Prime, "ON THE FORM · WORD FOR WORD", "— Form N-400, item {label}"), then "Explain it simply" revealing the existing plain meaning, words and officer phrasings from `n400Content.js` (verbatim), then "Talk to a lawyer first" and "We never save your answers to the N-400."
- Do not change `N400PaperForm`.

### Phase 7: Ask Vía, Interview Day and the rest
- `StudyBuddy` (Ask Vía) as a sheet or drawer: header "Vía · AI tutor" with the V mark, messages in Instrument Sans, Vía's replies in Instrument Serif italic. Keep every privacy behavior (no emails stored, declined case questions not saved, "Talk to a lawyer first" on case questions).
- Restyle Interview Day, Quick check, Getting started, Progress, Profile, Resource Hub, My Classroom, Study History and Admin with the new tokens and components. Do not change their logic.
- Final sweep: no Manrope left, no old portrait images referenced, contrast checks, 360px layout, RTL, lint/test/build.

## Definition of done (all phases)

- The app matches the brand spec: logo, Vía mark (once per screen), fonts, colors, posters alternating red/blue, manila N-400 folder with Courier Prime quotes, "Explain it simply".
- No data, AI or legal behavior changed except the confirmed tutor-picture change, and the docs reflect it.
- `npm run lint`, `npm test` and `npm run build` pass in every PR. Each PR description lists what changed, screenshots at 360px and desktop, and anything left for the next phase.
