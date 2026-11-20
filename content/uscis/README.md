# N-400 processing times (filled in by hand)

`n400-processing-times.json` feeds "When's my interview?" (`/interview/when`) and the "Case likely done" line on Today. **The app never asks USCIS.** A person copies the numbers from the official page and checks them, about once a month.

## How to update
1. Open the USCIS processing times page (`source_url`): form **N-400**, then each field office.
2. For each office add or update one entry:
   ```json
   { "id": "houston-tx", "name": "Houston TX", "state": "TX", "min_months": 6, "max_months": 9, "sample": false }
   ```
   - `id`: lowercase letters, numbers and dashes; never change it once learners may have picked it (it's stored on their device).
   - `min_months` / `max_months`: whole months, as USCIS shows them. They mean the case is usually **finished** in that time, counted from when USCIS received the form. The interview usually comes before that.
3. Set `checked_on` to the day you checked (`YYYY-MM-DD`).
4. Delete the two `sample` entries once real offices are in (they're never shown to learners anyway).

`npm test` fails (`src/lib/interviewEstimate.test.js`) if a real office has no sensible months, if there are real offices but no `checked_on`, or if a sample entry isn't marked `"sample": true` with "(sample, not real)" in its name.

## Privacy
The learner's field office and filing month stay on their device only (`pathways_field_office`, `pathways_filed_month` in browser storage; Delete my data clears them). They are never saved to the database, put in a URL, or sent to the AI or any server.
