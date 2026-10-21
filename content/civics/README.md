# Official civics questions (copy)

`questions-2025.json` is a copy of the 2025 USCIS civics questions stored in the
Base44 `CivicsQuestion` entity (version `2025`). It is used only by the test
`src/lib/explanations.test.js` to make sure no lesson explanation changes an
official answer.

**Do not type or edit this file by hand.** To update it:

1. Sign in to the app as an admin and open the Admin page.
2. In "Lesson explanations", tap **Export 2025 questions (JSON)**.
3. Replace this file with the downloaded `questions-2025.json` and commit it.

Each entry is `{ "question", "answer", "category" }`, copied exactly from the
database and sorted by question text. It starts as an empty list (`[]`) until
the first export.
