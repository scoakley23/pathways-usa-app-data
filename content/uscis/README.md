# N-400 processing times (filled in by hand)

`n400-processing-times.json` feeds "When's my interview?" (`/interview/when`) and the "Case likely done" line on Today. **The app never asks USCIS.** A person copies the numbers from the official page and checks them, about once a month.

## How to update
1. Open the USCIS processing times page (`source_url`): form **N-400**, then each field office.
2. For each office add or update one entry:
   ```json
   { "id": "houston-tx", "name": "Houston TX", "state": "TX", "min_months": 6, "max_months": 9, "sample": false }
   ```
   - `id`: lowercase letters, numbers and dashes; never change it once learners may have picked it (it's stored on their device).
   - `min_months` / `max_months`: months exactly as USCIS shows them, whole or half (`14.5`), never rounded. They mean the case is usually **finished** in that time, counted from when USCIS received the form. The interview usually comes before that.
   - **USCIS shows one number** (e.g. "80% of cases are completed within 14.5 months"): put it in both (`"min_months": 14.5, "max_months": 14.5`). The app then says "finished **by** {month}" instead of "between … and …". The filing month counts from its middle, so a whole number lands mid-month and a half month on the last day of the month (14.5 months from October 2026 = end of December 2027).
3. Set `checked_on` to the day you checked (`YYYY-MM-DD`).

### When someone else copies the numbers (needs your check)
Numbers copied by someone other than the owner (a helper, or a script) go in with `"needs_owner_check": true` and the day they were copied:
```json
{ "id": "houston-tx", "name": "Houston TX", "state": "TX", "min_months": 6, "max_months": 9, "sample": false, "needs_owner_check": true, "copied_on": "2026-11-26" }
```
Learners never see these offices (admins and dev do, marked "needs check" on `/interview/when`), and they don't need the file's `checked_on`. To approve one: compare it with the USCIS page, fix the months if needed, **delete both** `needs_owner_check` and `copied_on`, and set the file's `checked_on` to the day you checked. Learners keep seeing "Coming soon" until at least one office is approved.
4. A made-up office for testing needs `"sample": true` and "(sample, not real)" in its name; learners never see it. (The two samples were removed on 2026-11-27, when the real offices went in.)

## Every month (about 10 minutes, with the helper)
USCIS updates these times about once a month. **If `checked_on` is more than 60 days old, learners see "Coming soon" again instead of old numbers** (`isStale()`, `STALE_DAYS` in `src/lib/interviewEstimate.js`); admins see "Out of date" on `/interview/when`. A reminder comes on the 20th of each month.

### One-time setup: the bookmark
1. On GitHub, open `scripts/uscis/bookmarklet.txt` and copy its whole text (it starts with `javascript:`).
2. In Chrome or Edge on a computer: make a new bookmark (right-click the bookmarks bar → Add page), name it **Pathways: copy N-400 times**, and paste the text as its URL.
   If your browser won't run it, open the browser console on the USCIS page instead (F12 → Console) and paste the text of `scripts/uscis/copy-n400-times.console.js`.

### Each month
1. Open https://egov.uscis.gov/processing-times/ in your browser and click the bookmark.
2. A panel opens and goes through every N-400 field office, one every 3 seconds (about 5 minutes for 90). It asks USCIS only what the page itself asks when you click through it, and sends nothing anywhere else. You can use another tab meanwhile.
3. When it says Done, spot-check two or three offices against the USCIS page (pick the office the normal way). Rows marked "Check" couldn't be read.
4. Click **Copy result** and send it to your developer (or save it as a `.json` file).
5. The developer runs `npm run uscis:apply -- result.json` (add `--dry-run` to only see the changes). It keeps every office id, takes the months exactly as USCIS shows them, lists changed, new and no-longer-listed offices, and sets `checked_on` to the day you ran the helper. It refuses to write if anything was marked "Check", if a number isn't whole or half months, or if USCIS no longer lists an office (re-run with `--remove-missing` after you've checked). Then `npm test`, a pull request into `standalone`, and you merge it on to `main` as usual.

If the panel says **Stopped at …**, USCIS's page answered something the helper didn't expect (for example after a redesign). Copy the box, send it to your developer, and use the sheet below this month.

### Without the helper (the sheet)
`docs/review/n400-field-offices.xlsx` has every office, one row each. On the USCIS page pick N-400 and each office, copy the sentence word for word and the number (whole or half, never rounded) and the date, and send the sheet back.

### Rules for the helper
It runs only in the owner's own browser, started by hand, at most once a month, one office every 3 seconds. Never from a server, a scheduled job, or the app; learners' devices never contact USCIS. If USCIS blocks it or its website policies don't allow it, stop using it and use the sheet. The helper's code is `scripts/uscis/copy-n400-times.js` with the reading functions in `src/lib/uscisTimesParse.js`; rebuild the bookmark with `npm run uscis:bookmarklet` after changing either (`uscisTimesParse.test.js` fails when it's stale, and runs the helper against a made-up USCIS page).

`npm test` fails (`src/lib/interviewEstimate.test.js`) if a real office has no sensible months, if there are real offices but no `checked_on`, or if a sample entry isn't marked `"sample": true` with "(sample, not real)" in its name, or if an office waiting for your check isn't real, has no `copied_on`, or has `needs_owner_check` set to anything but `true` (`copied_on` is allowed only on those).

## Privacy
The learner's field office and filing month stay on their device only (`pathways_field_office`, `pathways_filed_month` in browser storage; Delete my data clears them). They are never saved to the database, put in a URL, or sent to the AI or any server.
