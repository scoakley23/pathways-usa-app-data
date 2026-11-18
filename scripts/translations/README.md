# Translation pack

The app's fixed text (screen lines, civics questions and answers, sentences,
words, lessons, key words, the N-400 guide, the lawyer checklist, Ask Amio's
privacy note) translated once, ahead of time, into every app language and kept
in the repo as content. Learners get translations instantly and nothing is
sent to an AI for them.

| File | What |
| --- | --- |
| `content/translations/_sources.json` | every English text to translate (generated; don't edit) |
| `content/translations/{lang}.json` | machine translation, made by `build-pack.mjs` |
| `content/translations/reviewed/{lang}.json` | lines a person checked; these win and are never re-translated |

In the app (`src/lib/translationPack.js`): a screen's hand-written lines →
reviewed pack → machine pack → anything missing stays **English** when the
Supabase switch is on, or uses the old live AI translation while it is off.

## Steps

Run these on your computer. Never paste the API key into a chat.

1. `npm run translations:sources` writes `_sources.json` from the app's lists
   and content. `npm test` fails if the file is out of date or a screen
   translates a list that isn't registered in `src/lib/translationSources.js`.
2. `npm run translations:check` lists, per language, how many texts are missing
   and estimates the cost. Free, no key needed.
3. Set your key in your terminal only: `export ANTHROPIC_API_KEY=...`
   (from console.anthropic.com; set a monthly spend limit there).
4. `npm run translations:build` sends everything missing to Claude Opus 5.5 in
   batch mode (half price; about $50 for all 61 languages the first time, a
   few cents after small text changes). It waits (usually under an hour,
   up to 24 hours), then writes the pack files.
   - One language first: `npm run translations:build -- --languages es`
   - If the window closes: `node scripts/translations/build-pack.mjs --resume`
   - Other options: `--model`, `--effort low|medium|high`, `--prune` (drop
     lines whose English no longer exists).
5. Look over a few files, then commit `content/translations/`.

A translation is rejected (and stays English; run again to retry) when it is
empty, its `{placeholders}` or numbers differ from the English, or it
translates a feature name. Feature names stay in English in every language:
Speak it!, Read it, Write it, Teach it back, Read and write (`FEATURE_NAMES`
in `build-pack.mjs`).

Numbers may be written the way the language writes them: in its own digits,
"1,500" as "1.500", "the 1800s" as the 19th century (Chinese 19世纪), "the
1950s" as 20世纪50年代, "$15 million" as 1500万, and a number the English says
in words as digits: "five", "First Amendment", "Sept. 11", "two-thirds" (3分の2),
"one hundred years" (100年), "a day" (1日), "doubled" (2倍), "World War II", and
a year in the Thai Buddhist Era (1803 as 2346). Anything else that
changes a number is rejected. The full list of the last run's rejected lines
is saved to `.claude/translations/rejected.json` on your computer (not
committed).

Lines already in a machine pack are checked again on every run. One that
breaks today's checks (for example a feature name translated before that rule
existed) counts as missing and is sent again; if the new translation is
rejected too, the old line is dropped and the text shows in English.
`--check` lists them as "to redo". Reviewed lines are never sent again.

## Reviewing

Copy lines a fluent speaker has checked into `reviewed/{lang}.json` with the
same format (`{ "language": "es", "source": "reviewed", "strings": { English: checked } }`).
Official civics questions and answers, the N-400 wording and the lawyer
checklist are the most important to check first.
