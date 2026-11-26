# FAQ review (Settings → Questions and answers)

**Status: draft for the owner's review.** **Applied on 2026-11-26:** the wording for the six "Change" rows is now in `content/faq/faq.json`. Every entry is still `draft`; tick each box below after reading it, then set it to `reviewed` yourself. Learners see an entry only after you set it to `reviewed` (`reviewedFaq()` in `src/lib/faq.js`). Until then the row stays hidden in Settings.

- Checked on: 2026-11-26.
- Rules checked against (CLAUDE.md):
  - Not legal advice.
  - Never tell learners how to answer about their own history.
  - Officeholder names only from `src/data/officeholders.json`. None of the 8 entries names an officeholder.
  - The product name learners read is "Amio" ("Pathways" stays only on pilot, partner and staff screens).
  - Facts must match the app.
- Length limit: 240 characters per answer (`faqProblems()`). Every suggested answer below fits (character count in brackets).

| id | Mark | Why, in one line |
|---|---|---|
| free | Change | Product name: learners read "Amio". |
| uscis | Change | Product name; add "not legal advice". |
| legal | Change | Product name; say where the lawyer help is. |
| amio | OK | Matches the app. |
| voice | Change | "Never … what you said" is not true for Ask Amio history. |
| order | OK | Matches "Nothing is locked". |
| program | Change | Programs can be picked without a code and see the name *or email*. |
| delete | Change | Settings path; Contact us messages and (on Base44) the sign-in account aren't erased. |

No entry needs to be removed.

---

### free: Change
- [ ] Accept
- **Now:** "Is Pathways free?" / "Yes. Pathways is free practice for the U.S. citizenship test: civics, reading, writing, speaking and the N-400."
- **Why:** facts are right. The learner-facing name is "Amio" (CLAUDE.md, Legal and content, Product name).
- **Suggested:** "Is Amio free?" / "Yes. Amio is free practice for the U.S. citizenship test: civics, reading, writing, speaking and the N-400." (107)

### uscis: Change
- [ ] Accept
- **Now:** "Is Pathways part of USCIS or the government?" / "No. Pathways is not affiliated with USCIS or the government. The civics questions and answers come from the official USCIS lists."
- **Why:** facts are right (`CivicsQuestion` lists, `content/civics/questions-2025.json`). Product name. The footer line pairs "Not affiliated with USCIS" with "Not legal advice", so the FAQ can too.
- **Suggested:** "Is Amio part of USCIS or the government?" / "No. Amio, from Pathways USA, is not affiliated with USCIS or the government, and it is not legal advice. The civics questions and answers come from the official USCIS lists." (173)

### legal: Change
- [ ] Accept
- **Now:** "Can Pathways tell me how to answer the N-400 questions about me?" / "No. Pathways is not legal advice. We teach what each N-400 question means and how the officer may ask it. If yes might be true for you, talk to a lawyer first."
- **Why:**
  - The content is right and keeps the required line "If yes might be true for you, talk to a lawyer first."
  - Product name.
  - Learners can't follow the advice without knowing where the lawyer page is. The Interview tab's tile is "Ask a lawyer" (`/lawyer-first`, CLAUDE.md, Interview tab).
- **Suggested:** "Can Amio tell me how to answer the N-400 questions about me?" / "No. Amio is not legal advice. We teach what each N-400 question means and how the officer may ask it. If yes might be true for you, talk to a lawyer first. Find help in Interview, then Ask a lawyer." (198)

### amio: OK
- [ ] Accept as is
- **Now:** "Who is Amio?" / "Amio is your AI tutor, not a real person. Amio explains in your language. You answer, read and write in English, like at the interview."
- **Why:** matches How Amio works (`HowAmioWorksStep.jsx`) and the "AI, not a real person" rule.

### voice: Change
- [ ] Accept
- **Now:** "Do you record my voice?" / "No. Your phone turns what you say into text. Only your scores are saved, never your voice or what you said."
- **Why:**
  - Voice: right (no audio recorded or stored).
  - "Never … what you said" is too broad. A question asked out loud to Ask Amio is saved as text in the learner's history (`AIStudyLog` / `ai_study_logs`, `src/api/askHistory.js`; policy line 87).
  - It is the *browser's* speech service that turns speech into text, and that service may process the sound (policy line 27).
- **Suggested:** "Do you record my voice?" / "No. Your voice is never recorded or saved. Your phone's browser turns what you say into text. In practice, only your scores are saved. Questions you ask Amio are saved as text, and only you can see them." (203)

### order: OK
- [ ] Accept as is
- **Now:** "Do I have to do the lessons in order?" / "No. You can open any topic and any lesson. The quick check only suggests where to start."
- **Why:** matches "Nothing is locked" (`journeyStops()` returns done | current | open | soon; quick check results say "Just a suggestion").

### program: Change
- [ ] Accept
- **Now:** "Can my class or program see my answers?" / "No. If you join a program with its code, it sees your name and counts, like lessons done. Never your answers or your questions to Amio."
- **Why:**
  - A learner can also pick a program in the first-open steps without a code.
  - Staff see the name the learner gave **or their email** if they gave none (policy line 120; `ProgramSummary.jsx`).
  - Notes are also never shared. Worth saying, since notes are free text.
  - Optional shared progress adds quick-check levels. That is still "counts and levels", so I left it out to stay short. Say if you want it in.
- **Suggested:** "Can my class or program see my answers?" / "No. A program you join sees the name you gave (or your email) and counts, like lessons done. Never your answers, your notes or your questions to Amio." (150)

### delete: Change
- [ ] Accept
- **Now:** "How do I delete my data?" / "Go to Settings, then Delete all my data. It erases everything, on our side and on this phone."
- **Why:**
  - Settings is reached from Me (the settings button on `/me`).
  - "Everything" is too strong:
    - "Contact us" (Talk to a person) messages stay in the team mailbox until the learner asks (policy line 162).
    - On the current system (Base44) the sign-in account is reset, not deleted (`src/api/account.js:202-205`).
- **Suggested:** "How do I delete my data?" / "Go to Me, then Settings, then Delete all my data. It erases your saved data and clears this phone. Messages you sent with Contact us stay in our inbox until you ask us to delete them." (183)

---

**Next:** only you set an entry to `reviewed`, after reading it in the app. The FAQ text is English-only in Settings today.
