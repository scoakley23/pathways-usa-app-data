# Official USCIS vocabulary lists

`reading-vocabulary.json` and `writing-vocabulary.json` are the official
"Reading Vocabulary for the Naturalization Test" and "Writing Vocabulary for
the Naturalization Test" (USCIS, rev. 08/08), **copied from the PDFs in
`source/`** by `scripts/vocab/extract_vocabulary.py` (pdftotext). They are never
typed or edited by hand. Each file lists the PDF's columns in order, with
every entry exactly as printed (`is/are/was/be`, `Washington, D.C.`).

Read it sentences use only reading-list words, Write it sentences only
writing-list words (`src/lib/officialVocabulary.js`, `wordsNotOnList()`;
checked by `src/lib/course.test.js`).

If USCIS publishes new lists: put the new PDFs in `source/`, run
`python3 scripts/vocab/extract_vocabulary.py`, compare the JSON with the PDFs
by eye, and commit both.
