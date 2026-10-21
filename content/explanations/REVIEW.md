# Reviewing lesson explanations

Each file here (`en.json`, `es.json`, …) holds one entry per official 2025 civics
question, keyed by the exact English question. The app shows an entry to
learners **only** when its `"status"` is `"reviewed"`.

Review one entry at a time. Change `"status": "draft"` to `"status": "reviewed"`
only when every box below is true.

## Checklist for each entry

**Official answer (must not change)**
- [ ] `question` is exactly the official question (do not edit it).
- [ ] `answers` is exactly the official accepted answers list (do not edit it).
- [ ] The explanation does not give a different, extra, or "better" answer.
  If it hints at an answer, the hint matches the official list.

**Explanation**
- [ ] It is accurate. Facts, names, numbers, and dates are correct.
- [ ] It is 3 to 5 short sentences.
- [ ] It is easy to read (about level A2–B1): short sentences, common words.
- [ ] It is neutral: no political opinions, no jokes, nothing about any party.
- [ ] It gives no legal advice. It never tells the learner how to answer
  questions about their own history or whether they are eligible.
- [ ] For "Answers change" / "Answers vary" questions, it tells the learner to
  check the current answer (uscis.gov) or their own state's officials, and
  does not name a person as the answer.
- [ ] Translations (not `en.json`) read naturally, like a teacher wrote them,
  and use the polite form of "you" (Spanish: "usted").

**Key words**
- [ ] Each `en` key word appears in the official question or an accepted answer.
- [ ] Each `translation` is correct for this meaning (in `en.json` it is the
  same word).
- [ ] 2 to 5 key words; the most useful ones for understanding the question.

**Then**
- [ ] Change `"status"` to `"reviewed"`.
- [ ] Run `npm test`. It must pass. (It fails if any `question` or `answers`
  differs from `content/civics/questions-2025.json`.)

If an entry needs big changes, fix the `explanation` or `keyWords` by hand.
Never edit `question` or `answers` — if they look wrong, fix the question in
the Admin page, export the questions again, and re-draft.
