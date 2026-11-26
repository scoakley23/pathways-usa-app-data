# Amio design frames v2 (Nov 18, 2026)

Put this folder in the repo as `docs/design-v2/`. It replaces `docs/design/` (the Round 30–33 look with the old Amio). The build prompts in "Claude Code Prompts - Amio Look v2.md" point here.

- `frames/<Name>.png`: the goal, at phone size (390 × 844, shown at 2×). `frames/<Name>.html`: the same screen as plain HTML, for exact sizes, spacing and wording. These are pictures of the goal, not code to paste. Names, numbers, dates and the office are sample data.
- `amio/Amio.tsx`: the character as a React component (8 moods, 16 language marks, right-to-left flip) plus `AmioSays`, the hand-drawn speech bubble. Copy it; never redraw Amio.
- Language marks (updated Nov 26, 2026, to match the app): English is a tilde, the same shape as Spanish; languages without their own mark show the dot (`"other"`).
- `tokens.css`: every color, font, radius and shadow.
- `fonts/`: Lexend and Bricolage Grotesque (Latin, Latin Extended, Vietnamese), self-hosted.

## Frames, by prompt
| Prompt | Frames |
|---|---|
| 2 · Amio | AmioCharacter, AmioLanguages |
| 3 · Shell | Launch, Today (tab bar) |
| 4 · Onboarding | OnboardWelcome, OnboardLanguage, OnboardHowItWorks, OnboardPlan |
| 5 · Today | Today |
| 6 · Lesson | Speak, Right, NotQuite, LessonDone |
| 7 · Course | Course |
| 8 · Interview | Interview, WhenInterview |
| 9 · Me | Me, MeSettings |
