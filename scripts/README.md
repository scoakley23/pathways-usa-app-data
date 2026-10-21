# Lesson explanations: export → draft → review

Every 2025 civics question gets a "teach first, then practice" lesson
(`/learn`). The explanation in each lesson is **content written ahead of time
and checked by a person**, not generated live. Official questions and answers
are never typed by hand and never written by the AI: they are copied from the
`CivicsQuestion` records in Base44.

## Files

| File | What |
| --- | --- |
| `content/civics/questions-2025.json` | Copy of the official 2025 questions `{ question, answer, category }`, exported from the app. Used by the test. |
| `content/explanations/en.json`, `es.json` | One entry per question, keyed by the exact English question: `{ question, answers, status, explanation, keyWords: [{ en, translation }] }`. |
| `content/explanations/REVIEW.md` | Checklist for the person reviewing entries. |
| `src/lib/explanations.test.js` | Fails if any entry's question or answers differ from the official list. |
| `scripts/check-explanations.mjs` | Same check from the command line, printing every mismatch. |

## Workflow

1. **Export the official questions.** Sign in as an admin, open the Admin page,
   scroll to "Lesson explanations", and tap **Export 2025 questions (JSON)**.
   Replace `content/civics/questions-2025.json` with the download. Do this again
   whenever a question or answer changes in the Admin page.
2. **Draft explanations.** In the same section, choose English or Español and
   tap **Draft explanations**. The app asks the AI about one question at a time
   and shows progress. Questions already in the committed file, or already
   drafted on this device, are skipped, so you can stop and continue later
   (drafts are kept in this browser until you clear them).
   The AI writes only `explanation` (3–5 sentences, A2–B1, no legal advice)
   and `keyWords`. `question` and `answers` are copied from the record.
   Key words that are not in the official text are dropped.
3. **Download and commit.** Tap **Download en.json** (or `es.json`). The file
   contains everything already committed plus the new drafts, all marked
   `"draft"`. Replace `content/explanations/<lang>.json` with it and commit on a
   branch.
4. **Review.** Follow `content/explanations/REVIEW.md` for each entry. When an
   entry passes, change `"status": "draft"` to `"status": "reviewed"`.
5. **Check.** Run `npm test` (or `node scripts/check-explanations.mjs` for a
   readable list of problems). Merge through a pull request only when it passes.

## What learners see

- An entry in their language, only if `"reviewed"`.
- Otherwise the reviewed English entry, with "Translation coming soon."
- Otherwise "Explanation coming soon." (the lesson still shows the official
  question and answers and lets them practice).

To add another language later, add `content/explanations/<code>.json` (start
with `{}`), add it to `DRAFT_LANGUAGES` in
`src/components/admin/ExplanationTools.jsx`, and follow the same steps.
