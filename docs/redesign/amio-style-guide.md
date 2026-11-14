# Pathways + Amio style guide

Binding for the Pathways + Amio redesign (Nov 13, 2026; screens in the
"Pathways UI Directions" canvas, Rounds 30–33, and `docs/design/` once that
folder is added). Replaces `road-style-guide.md` ("The Road"), which is kept
for history. Copied word for word from the redesign prompts. In this repo,
"tutors" below means **partner program staff** (`/Partner`): there are no
tutor accounts.

```
PATHWAYS + AMIO STYLE GUIDE (use these exact values)

FONT: Lexend (Google Fonts), weights 400, 500, 600, 700, 800.
- Headings and buttons 700; labels 600; body 400. Big celebration titles 800.
- Fallback stack for other scripts, loaded only when that language is chosen:
  Lexend, "Noto Sans", "Noto Sans Arabic", "Noto Sans SC", "Noto Sans Devanagari", "Noto Sans Ethiopic", system-ui, sans-serif.
- Sizes: screen title 20px, lesson question 22-26px, celebration title 28-32px, body 15-16px, small 12-13px. Never below 12px.

COLORS (put these in ONE place with these names):
- navy        #1E2B45  top banner, main text
- denim       #3B5B92  main actions: buttons, progress, current step, the learner's answers. White text on it.
- red         #F0503C  Amio only (the mascot, its speech-bubble outline), the "you are here" stop, the little flag. Not for small text or errors.
- red-text    #C8352B  red where it needs white text on it (e.g. "end call")
- gold        #FFC23D  stars, rewards, badges, Speak it! checkpoints. Navy text on it.
- page        #F5F7FA  page background
- tint        #E7ECF4  scene backgrounds, step dots, progress tracks
- mid         #C7D1E2  illustration details, the road, locked-stop shadows
- line        #DCE2EC  borders
- chip-navy   #33415E  pills sitting on the navy banner
- muted       #4E5A70  secondary text
- on-navy     #C9D1DF  secondary text on navy
- correct     #1F7A4D  success, always with a check icon; success banner bg #E3F3EA, its title #165C3A
- not-yet     #A8460E  "not quite", always with words, never alone; its banner bg #FFF4EC
- sky #EAF1FA, grass #DCEBDD, tree #7FA88A  (journey illustrations only)
- stop types on the road: lesson = denim; read-and-write = #5B7FB8; Speak it! = gold; N-400 card = #6B5FA8; review chest = #FFF3CC with gold border; practice interview = navy with gold icon

LAYOUT:
- Navy banner on top (title, where you are, stars, progress); page-colored body below; white cards with 20-24px corners.
- Main button: denim, 56px tall, 16px corners, a 5px darker "lip" shadow (navy) under it. One main button per screen. Second button: white with a line border.
- Chips: white, line border, fully rounded. Tap targets at least 44x44px.
- Bottom tabs (4): Today, Course, Interview, Me. White bar, active tab denim.
- Icons: simple outline, 2px stroke. No emoji anywhere.

AMIO (the tutor character):
- A red speech bubble with feet, two white eyes with navy pupils, and a navy curl of "hair" on top.
- Moods: happy, wave, curious (asking), listen, kind (after a miss), cheer (arms up), proud (eyes closed, big smile).
- Build Amio as ONE inline-SVG component with a mood prop and a size prop (copy the shapes from the canvas frames).
- Amio talks in ONE short line in a white bubble with a red 2px border. Never paragraphs. Never a chat log.

THE FIVE RULES (what keeps this from feeling like a chatbot):
1. No blank text box for chatting. Learners tap, speak or choose. (Typing is still allowed for Write it, ZIP code, search, and a small "Type instead" link wherever speaking is asked, for learners who can't speak or hear.)
2. The plan comes first: Today shows today's lesson, not a conversation.
3. Amio is a character in a place, saying one short line.
4. Voice first: the microphone is the biggest button on speaking screens.
5. Lessons end: steps, a finish, "Done for today."

LANGUAGE:
- Amio explains in the learner's language (tag: "Said in your language").
- Everything the learner answers, reads or writes is in English.
- All text goes through the translation system. Must fit longer languages and work right-to-left (Arabic, Farsi, Urdu): logical start/end spacing, no fixed-width text boxes, mirror the journey path in RTL.

PRIVACY AND SAFETY (never break these):
- Never record or store audio. Speech is turned into text by the browser; only text is sent for grading.
- Never store: interview date/month (keep it on the device only), address (ZIP only, used once), immigration status, A-number, case details, answers to N-400 questions about the learner's own life.
- Personal N-400 questions are always practiced as a made-up "practice person," labeled "practice person, not real."
- Keep on every relevant screen: "Free practice · Not affiliated with USCIS · Not legal advice"; "Talk to a lawyer first"; the AI officer labeled "AI, not a real person."
- Every new saved data type must be covered by "Delete all my data."
- Tutors and partners never see Amio conversations, pilot answers or N-400 section names.

WORKING RULES:
- Before you build, list every file and component you'll change or add, and any new data, and wait for my OK.
- Fake data only while building. Don't merge.
- If a screen needs data we don't have and the prompt didn't ask you to add it, leave it out and tell me.
```

## Decisions (Nov 13, 2026)

- **Amio is the tutor's fixed name.** Learners no longer name the tutor; an
  old saved name (including "Vía") is ignored.
- **Partners, not tutors**: "My tutor", "a code from my tutor" and "tutors see
  counts" mean the existing partner programs (`Partner`, `ProgramMembership`,
  `/Partner`).
- **Streaks are allowed**, kept kind: one rest day a week, a missed day never
  punishes, no "in a row" pressure. Calculated from `ActivityDay`, not stored.
- **Practice people are a trial** (Prompt 10): a made-up person, always
  labeled "practice person, not real", whose answers are reviewed like other
  N-400 wording. We'll see if we like it.
- **One review schedule** (`review_items`, boxes 1–5: 1, 3, 7, 14, 30 days)
  replaces the spaced-review fields on `UserProgress` when the data moves to
  Supabase.
- **Content folders**: course in `content/course/`, official vocabulary lists
  in `content/vocab/` (copied, never retyped). Course content is 2025-only for
  now.
- **Write it level**: `writeLevel` and `writeLevel1Passes` on the profile,
  covered by "Delete all my data".
- **Left out**: push/lock-screen reminders, a reminder time and the Holiday
  bonus. The existing in-app daily reminder stays.
- **Confetti**: keep `canvas-confetti`, always with
  `disableForReducedMotion: true`.
- **Order**: Prompts 1, 2, 3, 10 (look only), then Standalone Steps 1–3
  (Supabase), then 4, 12 (alongside), 5, 6, 7, 8, 9, 11, 13.
