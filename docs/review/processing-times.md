# N-400 processing times: fill-in sheet for the owner

**Status: no real offices yet.** `content/uscis/n400-processing-times.json` is unchanged: only the two sample offices, `checked_on: null`. Learners still see "Coming soon" and the USCIS link on "When's my interview?" (`/interview/when`).

## Why there are no numbers here

On 2026-11-26 I tried to read the official page from this session (read-only, once each). USCIS blocked every request with a Cloudflare "Attention Required" page (HTTP 403):

| URL | Result |
|---|---|
| `https://egov.uscis.gov/processing-times/` | 403, Cloudflare "Attention Required" |
| `https://egov.uscis.gov/processing-times/api/forms` | 403 |
| `https://egov.uscis.gov/processing-times/api/formoffices/N-400/` | 403 |
| `https://www.uscis.gov/n-400` | 403 |
| The same page through a second web-reading tool | 403 |

I did not try to get around the block. The numbers have to be copied by a person in a normal browser, which is also what `content/uscis/README.md` asks for. **The app never asks USCIS live.** It only reads the bundled JSON file.

## How to fill it in (about 20–40 minutes)

1. Open https://egov.uscis.gov/processing-times/ in your browser.
2. Form: **N-400 | Application for Naturalization**. Category: **Field office**.
3. For each field office in the list, write down the time USCIS shows ("80% of cases are completed within…" or the range shown). Round to **whole months**, as USCIS shows them:
   - `min_months` = the lower number (if USCIS shows one number only, ask me how you want to handle it; don't guess).
   - `max_months` = the upper number.
4. Fill in the table below. You don't need every office on the first pass; start with the offices your pilot learners use.
5. Send me the filled table (or paste the rows into the JSON yourself with the snippet below). I'll then:
   - add the offices with `"sample": false`, and set the file's `checked_on` to the day **you** checked;
   - delete the two sample offices;
   - run `npm test` (`interviewEstimate.test.js` checks months and the date) and `npm run lint`, and open a PR for you to look at in the app before it merges.

**IDs:** lowercase letters, numbers and dashes, the city then the state, e.g. `city-st`. Once learners can pick an office, its id must never change, because it is stored on their phones.

## Fill-in table

Copy each office name exactly as USCIS writes it. Tick "Checked" only when you have compared the row with the USCIS page yourself.

| Checked | id | Name (as on USCIS) | State | min_months | max_months | Seen on USCIS (date) |
|---|---|---|---|---|---|---|
| [ ] | | | | | | |
| [ ] | | | | | | |
| [ ] | | | | | | |
| [ ] | | | | | | |
| [ ] | | | | | | |
| [ ] | | | | | | |
| [ ] | | | | | | |
| [ ] | | | | | | |
| [ ] | | | | | | |
| [ ] | | | | | | |

Source URL for every row: `https://egov.uscis.gov/processing-times/` (already the file's `source_url`).

## JSON shape (for each checked row)

```json
{ "id": "city-st", "name": "City ST", "state": "ST", "min_months": 0, "max_months": 0, "sample": false }
```

and at the top of the file:

```json
"checked_on": "YYYY-MM-DD"
```

`npm test` fails if a real office has months that don't make sense (`min_months` > `max_months`, not whole numbers), if real offices exist without `checked_on`, or if an entry looks like a sample but isn't marked `"sample": true`.

## Keeping it current

USCIS updates these times about once a month. The README asks for a monthly check, like the officeholder list. Each month: open the page, update the months that changed, and set `checked_on`.

## Two ways in: checked by you, or "needs check"

Every office in the file is one of three kinds:

| Office | Learners | Admins and dev | Needs |
|---|---|---|---|
| `"sample": true` (made up) | hidden | shown | "(sample, not real)" in the name |
| `"needs_owner_check": true` (real USCIS numbers, not checked yet) | hidden | shown, marked "needs check" | `"sample": false` and its own `copied_on` date |
| neither (checked by you) | shown | shown | the file's `checked_on` |

- **You copy the numbers yourself:** add them as checked offices (no flag) and set `checked_on`.
- **Someone else copies them** (a helper, or me if the page becomes readable): they go in with `"needs_owner_check": true` and `"copied_on": "YYYY-MM-DD"`. You can see them on `/interview/when` as an admin. To approve one: compare it with the USCIS page, fix the months if needed, delete `needs_owner_check` and `copied_on`, and set the file's `checked_on`.

Learners keep seeing "Coming soon" until at least one office has been approved. Details in `content/uscis/README.md`; the rules are in `processingProblems()` and `isCheckedOffice()` (`src/lib/interviewEstimate.js`) and checked by `npm test`.
