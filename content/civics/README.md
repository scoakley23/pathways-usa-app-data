# Official civics questions (copy)

`questions-2025.json` is a copy of the 2025 USCIS civics questions stored in the
Base44 `CivicsQuestion` entity (version `2025`). It is used:

- by the test `src/lib/explanations.test.js`, to make sure no lesson
  explanation changes an official answer, and
- by **Ask Amio** (`src/lib/civicsBank.js`), which sends the full list with
  every request so the tutor answers civics questions from the official
  accepted answers, not from memory. Amio uses this copy, so re-export it
  whenever the database changes.

**Do not type or edit this file by hand.** To update it:

1. Sign in to the app as an admin and open the Admin page.
2. In "Lesson explanations", tap **Export 2025 questions (JSON)**.
3. Replace this file with the downloaded `questions-2025.json` and commit it.

Each entry is `{ "question", "answer", "category" }`, copied exactly from the
database and sorted by question text. It starts as an empty list (`[]`) until
the first export.

## Official numbers and 65/20 marks

`numbers-2025.json` gives each question its number on the official USCIS 2025
list (1–128) and whether it is one of the 20 questions for applicants 65 and
older who have been permanent residents for 20 years or more. Each entry:

```json
{ "number": 30, "sixty_five_twenty": false, "question": "What is the name of the Speaker of the House of Representatives now?" }
```

`question` must match `questions-2025.json` word for word. Copy the numbers and
stars from the official USCIS "2025 Civics Test 128 Questions and Answers"
PDF; never guess them. While the file is empty (`[]`) or incomplete, Amio gets
the questions without numbers or stars and is not asked to give numbers.
`npm test` fails if a filled-in file doesn't number all 128 questions 1–128
exactly once, repeats a question, or doesn't mark exactly 20 as 65/20. The same
checks run on any `numbers-2025*.json` draft put beside it.

### Where the numbers come from (live since Nov 27, 2026)

`numbers-2025.json` holds all 128 numbers and the 20 65/20 marks, so Ask Amio
gets the numbered list with stars. The owner checked it against the PDF on
Nov 27, 2026.

- Source: USCIS, "128 Civics Questions and Answers (2025 version)", form
  M-1778 (09/25),
  https://www.uscis.gov/sites/default/files/document/questions-and-answers/2025-Civics-Test-128-Questions-and-Answers.pdf
  (downloaded Nov 27, 2026; PDF last modified Sep 26, 2025; SHA-256
  `f280608c0fb6dc1eba344b4746a7ba52d02fe411fba30cedd4371819f0abe11c`).
- How it was made: the PDF text was extracted with `pdftotext`, each numbered
  question read with its asterisk, and matched to `questions-2025.json` by
  exact wording. All 128 matched word for word; none were left over on
  either side.
- 65/20 questions (asterisk in the PDF): 2, 7, 12, 20, 30, 36, 38, 39, 44, 52,
  61, 66, 74, 78, 86, 94, 113, 115, 121, 126.

When USCIS publishes a new version: put the new numbers in
`numbers-2025.draft.json` first, have a person check it, then copy it over
this file, delete the draft, and run `npm run ai:server` (the Supabase AI
bundle includes this file) and `npm test`.
