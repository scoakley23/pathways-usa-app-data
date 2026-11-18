# N-400 lessons

One lesson per section of the N-400 guide, at the end of each unit of the
course. They teach learners to **understand** each question the way the
officer may ask it. They never suggest an answer: no sample answers, no
practice person, and nothing about the learner is asked or saved.

This is **reviewed content**, like the course: learners see a lesson only when
its `status` is `"reviewed"`. Admins see drafts, marked "Draft".

## Where the words come from

Most of a lesson comes straight from the N-400 guide
(`src/components/n400/n400Content.js`): each question's form wording, its plain
meaning, its words to know and the officer's other ways to ask it. This file
adds only:

| Field | What it is |
|---|---|
| `questionNames` | A short name for every guide question, e.g. "Ever said you were a U.S. citizen". Shown in Listen and as the choices in Same question?. Never an answer. |
| `lessons[].same` | **Same question?**: `phrasing` = one of the guide's officer phrasings for `answer`; `choices` = 3 guide question ids, one of them `answer`. |
| `lessons[].spot` | **Spot the word**: `text` copied from the form or an officer phrasing, `word` in it, 3 `choices`, `answer` = the index of the right one. When the guide lists the word, the right choice must be the guide's own definition, word for word. |
| `lessons[].understand` | **Say what it asks**: `phrasing` = one of the guide's officer phrasings for `questionId`. The AI checks only that the learner understood it. |
| `lessons[].helpWord` | The word in "What does “{word}” mean?", one of the section's words to know. |
| `help.phrases` | The three phrases for **Ask for help**, the same in every lesson. |

`npm test` (`src/lib/n400Lessons.test.js`) fails if a phrasing, text or
definition isn't in the guide, or a choice points to a question that doesn't
exist.

## Draft → reviewed

Review each lesson in the review page, then set its `status` to `"reviewed"`.
