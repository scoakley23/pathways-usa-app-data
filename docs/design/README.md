# Pathways design frames (for Claude Code)

These are the final screens from the Pathways design canvas, exported so you can see them without a claude.ai login.
Copy this whole folder into the app repo at `docs/design/` (on the `standalone` branch) and commit it.

## What's here

- `frames/<Name>.png`: a picture of each screen at phone size (390 × 844, shown at 2×). Look at these first.
- `frames/<Name>.html`: the same screen as plain HTML with inline styles. Open it in a browser, or read it for exact sizes, colors, spacing and wording. Links between frames work.
- `amio/Amio.tsx`: Amio as a ready React component with 7 moods, plus `<AmioSays>`. **Copy it; don't redraw Amio.** `amio/amio-<mood>.svg` are the same shapes as plain SVG files.
- `tokens.css`: every color, radius and the font stack.
- `fonts/`: Lexend 400–800 (latin). In the app you can use these or `@fontsource/lexend`.

## Rules for using the frames

- They are **pictures of the goal, not code to paste.** Build with the app's own components and the tokens; match how it looks.
- The names and numbers in them (Lucía, 46 stars, March) are sample data. Use real data.
- Where a frame and the written prompt disagree, the prompt wins.
- On R32Path, Amio's "Next!" bubble overlaps the "Parts of Congress" label. Don't copy that; put Amio beside the stop.
- Don't load Google Fonts in the app (privacy: no third-party requests). Self-host Lexend.

## Frames for each prompt

**Prompt 1 · Colors, Lexend, base pieces**

- `R33Today`: Today ([png](frames/R33Today.png), [html](frames/R33Today.html))
- `R33LessonDone`: Lesson complete ([png](frames/R33LessonDone.png), [html](frames/R33LessonDone.html))
- `R30TryAgain`: Lesson · Not quite ([png](frames/R30TryAgain.png), [html](frames/R30TryAgain.html))

**Prompt 2 · Amio**

- `R30Welcome`: Welcome ([png](frames/R30Welcome.png), [html](frames/R30Welcome.html))
- `R30MeetAmio`: Meet Amio ([png](frames/R30MeetAmio.png), [html](frames/R30MeetAmio.html))
- `R33Teach`: Step 2 · Teach it back ([png](frames/R33Teach.png), [html](frames/R33Teach.html))
- `R30TryAgain`: Lesson · Not quite ([png](frames/R30TryAgain.png), [html](frames/R30TryAgain.html))

**Prompt 3 · App shell, Ask Amio, Me, Settings**

- `R33Today`: Today ([png](frames/R33Today.png), [html](frames/R33Today.html))
- `R30AskAmio`: Ask Amio ([png](frames/R30AskAmio.png), [html](frames/R30AskAmio.html))
- `R30Me`: Me ([png](frames/R30Me.png), [html](frames/R30Me.html))
- `R30Settings`: Settings and privacy ([png](frames/R30Settings.png), [html](frames/R30Settings.html))

**Prompt 4 · Course model (sample section)**

- `R32Path`: Journey · smaller lessons ([png](frames/R32Path.png), [html](frames/R32Path.html))

**Prompt 5 · Journey**

- `R32Path`: Journey · smaller lessons ([png](frames/R32Path.png), [html](frames/R32Path.html))
- `R31Preview`: Topic preview ([png](frames/R31Preview.png), [html](frames/R31Preview.html))
- `R33UnitGuide`: Unit guide · sections ([png](frames/R33UnitGuide.png), [html](frames/R33UnitGuide.html))
- `R31Map`: All units map ([png](frames/R31Map.png), [html](frames/R31Map.html))

**Prompt 6 · Lesson player**

- `R32Lesson`: Lesson · 5 steps ([png](frames/R32Lesson.png), [html](frames/R32Lesson.html))
- `R33Listen`: Step 1 · Listen ([png](frames/R33Listen.png), [html](frames/R33Listen.html))
- `R33Teach`: Step 2 · Teach it back ([png](frames/R33Teach.png), [html](frames/R33Teach.html))
- `R32Read`: Step 3 · Read it ([png](frames/R32Read.png), [html](frames/R32Read.html))
- `R32Write`: Step 4 · Write it ([png](frames/R32Write.png), [html](frames/R32Write.html))
- `R33Officer`: Step 5 · Officer question ([png](frames/R33Officer.png), [html](frames/R33Officer.html))
- `R30TryAgain`: Lesson · Not quite ([png](frames/R30TryAgain.png), [html](frames/R30TryAgain.html))
- `R33LessonDone`: Lesson complete ([png](frames/R33LessonDone.png), [html](frames/R33LessonDone.html))

**Prompt 7 · Today and plan**

- `R33Plan`: Your plan ([png](frames/R33Plan.png), [html](frames/R33Plan.html))
- `R33Today`: Today ([png](frames/R33Today.png), [html](frames/R33Today.html))
- `R30Done`: Done for today ([png](frames/R30Done.png), [html](frames/R30Done.html))

**Prompt 8 · Checkpoints**

- `R33SpeakIntro`: Speak it! · start ([png](frames/R33SpeakIntro.png), [html](frames/R33SpeakIntro.html))
- `R33SpeakAsk`: Speak it! · question ([png](frames/R33SpeakAsk.png), [html](frames/R33SpeakAsk.html))
- `R33SpeakResult`: Speak it! · result ([png](frames/R33SpeakResult.png), [html](frames/R33SpeakResult.html))
- `R33UnitDone`: Unit complete ([png](frames/R33UnitDone.png), [html](frames/R33UnitDone.html))
- `R30ReadAloud`: Reading practice ([png](frames/R30ReadAloud.png), [html](frames/R30ReadAloud.html))
- `R30Writing`: Writing practice ([png](frames/R30Writing.png), [html](frames/R30Writing.html))

**Prompt 9 · Getting started**

- `R30Welcome`: Welcome ([png](frames/R30Welcome.png), [html](frames/R30Welcome.html))
- `R30Language`: Choose your language ([png](frames/R30Language.png), [html](frames/R30Language.html))
- `R30MeetAmio`: Meet Amio ([png](frames/R30MeetAmio.png), [html](frames/R30MeetAmio.html))
- `R30QuickCheck`: Quick check ([png](frames/R30QuickCheck.png), [html](frames/R30QuickCheck.html))

**Prompt 10 · Interview tab**

- `R30Interview`: Interview ([png](frames/R30Interview.png), [html](frames/R30Interview.html))
- `R30Call`: Practice interview call ([png](frames/R30Call.png), [html](frames/R30Call.html))
- `R30Report`: Interview report ([png](frames/R30Report.png), [html](frames/R30Report.html))
- `R30DayGuide`: Interview day guide ([png](frames/R30DayGuide.png), [html](frames/R30DayGuide.html))
- `R30N400`: N-400 guide ([png](frames/R30N400.png), [html](frames/R30N400.html))
- `R30N400Card`: N-400 question card ([png](frames/R30N400Card.png), [html](frames/R30N400Card.html))
- `R30Lawyer`: Talk to a lawyer first ([png](frames/R30Lawyer.png), [html](frames/R30Lawyer.html))
- `R30Help`: Free help near you ([png](frames/R30Help.png), [html](frames/R30Help.html))

**Prompt 11 · Me**

- `R30Me`: Me ([png](frames/R30Me.png), [html](frames/R30Me.html))
- `R30Settings`: Settings and privacy ([png](frames/R30Settings.png), [html](frames/R30Settings.html))

## All screens

| Frame | Screen |
|---|---|
| `R30AskAmio` | Ask Amio |
| `R30Call` | Practice interview call |
| `R30DayGuide` | Interview day guide |
| `R30Done` | Done for today |
| `R30Help` | Free help near you |
| `R30Interview` | Interview |
| `R30Language` | Choose your language |
| `R30Lawyer` | Talk to a lawyer first |
| `R30Me` | Me |
| `R30MeetAmio` | Meet Amio |
| `R30N400` | N-400 guide |
| `R30N400Card` | N-400 question card |
| `R30QuickCheck` | Quick check |
| `R30ReadAloud` | Reading practice |
| `R30Report` | Interview report |
| `R30Settings` | Settings and privacy |
| `R30TryAgain` | Lesson · Not quite |
| `R30Welcome` | Welcome |
| `R30Writing` | Writing practice |
| `R31Map` | All units map |
| `R31Preview` | Topic preview |
| `R32Lesson` | Lesson · 5 steps |
| `R32Path` | Journey · smaller lessons |
| `R32Read` | Step 3 · Read it |
| `R32Write` | Step 4 · Write it |
| `R33LessonDone` | Lesson complete |
| `R33Listen` | Step 1 · Listen |
| `R33Officer` | Step 5 · Officer question |
| `R33Plan` | Your plan |
| `R33SpeakAsk` | Speak it! · question |
| `R33SpeakIntro` | Speak it! · start |
| `R33SpeakResult` | Speak it! · result |
| `R33Teach` | Step 2 · Teach it back |
| `R33Today` | Today |
| `R33UnitDone` | Unit complete |
| `R33UnitGuide` | Unit guide · sections |

Frame names start with the design round they come from (R30, R31, R32, R33). Only the frames listed here are final.
