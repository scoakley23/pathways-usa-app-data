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

## Every month (about 10 minutes)
USCIS updates these times about once a month. **If `checked_on` is more than 60 days old, learners see "Coming soon" again instead of old numbers** (`isStale()`, `STALE_DAYS` in `src/lib/interviewEstimate.js`); admins see "Out of date" on `/interview/when`.
1. Open https://egov.uscis.gov/processing-times/ in your own browser. Form **N-400**, then each office in the file, one at a time.
2. Compare the months with the file. Change any that moved (one number → both `min_months` and `max_months`, half months as shown). The fill-in sheet `docs/review/n400-field-offices.xlsx` has every office in the file, one row each, if you'd rather work there and send it back.
3. A new office you want: add it (see step 2 above). An office USCIS no longer lists: leave it until you've decided; never reuse its `id`.
4. Set `checked_on` to today, even if nothing changed.
5. Run `npm test`, open a pull request into `standalone`, and merge it on to `main` as usual.

The app never asks USCIS for these numbers. An automatic update is only allowed through an official USCIS data source (for example an API from developer.uscis.gov), never by reading the website with a script; until one exists, this check stays by hand.

`npm test` fails (`src/lib/interviewEstimate.test.js`) if a real office has no sensible months, if there are real offices but no `checked_on`, or if a sample entry isn't marked `"sample": true` with "(sample, not real)" in its name, or if an office waiting for your check isn't real, has no `copied_on`, or has `needs_owner_check` set to anything but `true` (`copied_on` is allowed only on those).

## Privacy
The learner's field office and filing month stay on their device only (`pathways_field_office`, `pathways_filed_month` in browser storage; Delete my data clears them). They are never saved to the database, put in a URL, or sent to the AI or any server.
