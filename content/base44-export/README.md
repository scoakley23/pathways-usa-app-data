# Base44 content export

The app's shared study content, exported from Base44 on Nov 13, 2026 and
converted to JSON for the move off Base44 (Standalone App Plan, Step 1 seeds
the Supabase tables from these files). **Content only: no learner data.**

| File | From Base44 entity | Rows |
|---|---|---:|
| `civics-questions-2008.json` | `CivicsQuestion` (`version` 2008) | 100 |
| `civics-questions-2025.json` | `CivicsQuestion` (`version` 2025) | 128 |
| `interview-questions.json` | `InterviewQuestion` | 24 |
| `reading-sentences.json` | `ReadingSentence` | 76 |
| `writing-sentences.json` | `Sentence` | 49 |
| `vocabulary-words.json` | `VocabularyWord` | 79 |
| `lessons.json` | `Lesson` | 25 |
| `lesson-quizzes.json` | `LessonQuiz` (lesson still exists) | 144 |
| `lesson-quizzes-orphaned.json` | `LessonQuiz` (lesson deleted) | 34 |
| `lesson-flashcards.json` | `LessonFlashcard` (lesson still exists) | 95 |
| `lesson-flashcards-orphaned.json` | `LessonFlashcard` (lesson deleted) | 20 |
| `community-resources.json` | `CommunityResource` | 5,588 |
| `manifest.json` | each CSV's row count and SHA-256, and the dropped columns | |

## How it was made

```bash
node scripts/content/import-base44-csv.mjs <folder with the *_export.csv files>
```

- **Types come from `base44/entities/*.jsonc`.** Numbers and true/false become
  real values. Nested fields (`Lesson.key_points`, `LessonQuiz.options`,
  `CommunityResource.services` and `languages`) were JSON text in the CSV and
  are real lists and objects here. An empty non-text cell is `null` (3 places
  have no `services`).
- **Text is copied exactly**, not trimmed. A separate check compared all
  110,039 text fields with the CSVs: no differences. No official question or
  answer was changed.
- **Every row keeps its Base44 `id`**, so `lesson_id` links keep working.
- **Dropped:** Base44's own columns `created_by` (the creator's email),
  `created_by_id`, `created_date`, `updated_date` and `is_sample` (always
  false). The raw CSVs are not in the repo because of the email column;
  `manifest.json` lets anyone check these files came from them.
- `src/lib/contentExport.test.js` checks the row counts, the civics split,
  every `lesson_id`, unique ids, the nested fields, and that no email or
  Base44 column is left.

## Findings

- **2025 civics questions:** identical to `content/civics/questions-2025.json`
  (all 128 questions, answers and categories, character for character). See
  `docs/content-import/civics-2025-differences.md`
  (`scripts/content/compare-civics-2025.mjs` re-runs it).
- **Quizzes and flashcards whose lesson was deleted:** 34 `LessonQuiz` and 20
  `LessonFlashcard` rows point at 5 lesson ids that no longer exist in Base44.
  They're kept apart in the `-orphaned` files, not dropped. 15 of the 20
  flashcards repeat a card that already sits under a real lesson (same term);
  the quizzes are mostly unique (17 are "… is famous for many things. Name
  one."). Deciding what to do with them is open.
- **`LessonQuiz` isn't used by any screen today** (the lesson deck passes an
  empty quiz list).
- **No file is stored on Base44.** No link in any field points at Base44's
  storage. Lessons have no images (all 100 key points have `image_url: null`);
  the 25 videos are YouTube links; the 3,535 place logos are `https://` links
  to the places' own websites, NLD or their site builders (Wix, Squarespace,
  …), so cancelling Base44 breaks none of them. (One place's `website` is on
  `base44.app`: that organization's own site, not our files.)
- **Not exported:** `Partner` (0 rows) and every learner table.
