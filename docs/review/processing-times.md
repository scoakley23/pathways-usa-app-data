# N-400 processing times: status

**Status (2026-11-27):** the app is ready for real offices; the file still has only the two sample offices, so learners see "Coming soon". The owner copies the numbers by hand from https://egov.uscis.gov/processing-times/ in their own browser; how to do it (and the monthly check) is in `content/uscis/README.md`.

## Decisions (2026-11-27, owner)
- **One number from USCIS** ("80% of cases are completed within N months"): `min_months` = `max_months` = N, and the app says "finished **by** {month}" (When's my interview?, Today's "Case likely done by {month}", Settings).
- **Old numbers are hidden**: after 60 days without a check (`checked_on`), learners see "Coming soon" again; admins see "Out of date".
- **No scraping.** The USCIS processing-times page and its data addresses answer automated requests with a Cloudflare block (HTTP 403, seen on 2026-11-26 and again on 2026-11-27). We don't work around that. An automatic update is allowed only through an official USCIS data source (to check: developer.uscis.gov); until one exists, the check stays by hand.

## Fill-in rows for the owner
One line per office: `Office (as USCIS writes it) | what USCIS shows, word for word | date you read it`, e.g. `Houston TX | 80% within 7 months | 2026-11-27`.
