# The course (Prompt 4)

Small 5-step lessons, grouped into sections and units. This is **reviewed
content in the repo**: never generated live by AI, never edited in a database.
Course content is 2025-only for now.

| File | What it is |
|---|---|
| `units.json` | The outline: 7 units (number, title, description, icon) and their sections. A section with a `file` has its content in `sections/`. |
| `sections/<file>.json` | One section: its stops in order, and its lessons |

## A section

```json
{ "id": "u2-s2", "unitId": "u2", "number": 2, "title": "Congress", "stops": [ ... ], "lessons": [ ... ] }
```

**Stops** (in order on the journey): `{ "id", "type", "title" }` plus
- `lesson`: `"lessonId"` (a lesson in this file)
- `readwrite`: `"fromLessons"` (the lessons whose sentences it uses)
- `speakit`: the section's questions, out loud (nothing extra)
- `n400`: `"lessonId"` = an N-400 lesson in `content/n400/lessons.json` (one at the end of each unit, just before the practice interview), **or** `"section"` + `"card"` = one card of the N-400 guide (`src/components/n400/n400Content.js`: the section id, and the card's number from 1 among the approved cards). A card stop goes after the section's Speak it! (or just before the unit's N-400 lesson, to read first), is optional and always open, never done, and is hidden while its card isn't approved. `src/lib/n400Stops.test.js` checks each one points to an approved card with no draft before it. Titles: "N-400 card: {short name}".
- `review`, `practiceInterview`: used by later prompts

**A lesson:**

```json
{
  "id": "u2-s2-l3",
  "title": "How many senators?",
  "status": "draft",
  "questionIds": ["<id>", "<id>"],
  "steps": {
    "listen":    { "explanationKey": "<question text>", "facts": ["..."], "newWords": [{ "word": "...", "meaning": "..." }] },
    "teachBack": { "questionId": "<id>" },
    "readIt":    { "sentence": "How many Senators does a state have?", "words": ["How", "many", "..."] },
    "writeIt":   { "sentence": "The United States has 100 Senators.", "distractorWords": ["fifty", "Canada", "red"] },
    "officer":   { "questionId": "<id>" }
  }
}
```

- **`listen.story`** (optional, the story player): scenes `{ "say": "...", "picture": { "drawing": "congressNumbers", "focus": "senate" } }` (or `{ "photo": file }` / `{ "officeholder": "speaker" }`), and a check at least every 3 scenes: `{ "check": { "kind": "tf", "statement": "...", "answer": true } }` or `{ "check": { "kind": "pick", "prompt": "...", "choices": ["a", "b", "c"], "answer": 0 } }`. `listen.storyStatus` is `draft` until reviewed; learners see the facts list until then. Lines stay short (≤ 140 characters) and never name a current officeholder.
- **`questionIds`**: 1–2 official 2025 questions, by their **database id** (the
  `id` in `content/base44-export/civics-questions-2025.json`, the same id as
  Supabase's `civics_questions`). The test checks that each one's wording and
  answers match `content/civics/questions-2025.json` exactly.
- **`explanationKey`**: the question's text, a key in
  `content/explanations/en.json` (only `"reviewed"` explanations are shown).
- **`readIt.sentence`**: a **question**, using **only** words from the official
  reading list (`content/vocab/reading-vocabulary.json`). `words` = its words in order.
- **`writeIt.sentence`**: a **statement**, using **only** words from the
  official writing list (`content/vocab/writing-vocabulary.json`); so must
  every distractor word. Word forms count as listed ("Senators", not "senator";
  "elects" for reading, "elect" for writing).
- Officeholder questions ("your senators") never put a name in the lesson:
  names come only from `src/data/officeholders.json`.

`npm test` (`src/lib/course.test.js`) fails on any of these.

## Draft → reviewed

1. Draft lessons (Prompt 12 drafts a unit at a time) with `"status": "draft"`.
2. A person reviews every fact, word and sentence; N-400-related and
   explanation wording also goes to the expert reviewer.
3. Only then change `"status"` to `"reviewed"`. Learners see only reviewed
   lessons. Developers can see drafts on their own machine with
   `VITE_SHOW_DRAFT_LESSONS=true` in `.env.local` (`npm run dev` only).
