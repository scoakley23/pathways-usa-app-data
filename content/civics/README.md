# Official civics questions (copy)

`questions-2025.json` is a copy of the 2025 USCIS civics questions stored in the
Base44 `CivicsQuestion` entity (version `2025`). It is used:

- by the test `src/lib/explanations.test.js`, to make sure no lesson
  explanation changes an official answer, and
- by **Ask Vía** (`src/lib/civicsBank.js`), which sends the full list with
  every request so the tutor answers civics questions from the official
  accepted answers, not from memory. Vía uses this copy, so re-export it
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
PDF; never guess them. While the file is empty (`[]`) or incomplete, Vía gets
the questions without numbers or stars and is not asked to give numbers.
`npm test` fails if a filled-in file doesn't number all 128 questions 1–128
exactly once.
