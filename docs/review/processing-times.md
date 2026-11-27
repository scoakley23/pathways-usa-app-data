# N-400 processing times: status

**Status (2026-11-27):** 90 real field offices are in `content/uscis/n400-processing-times.json`, read by the owner on uscis.gov on 2026-11-26 (`checked_on`). The two samples are gone. **Learners stop seeing the times after 2027-01-25** (60 days) unless the owner checks them again. The owner copies the numbers by hand from https://egov.uscis.gov/processing-times/ in their own browser; how to do it (and the monthly check) is in `content/uscis/README.md`.

## Decisions (2026-11-27, owner)
- **One number from USCIS** ("80% of cases are completed within N months"): `min_months` = `max_months` = N, and the app says "finished **by** {month}" (When's my interview?, Today's "Case likely done by {month}", Settings).
- **Half months are kept, never rounded** (44 of the 90 offices show one, e.g. Chicago 14.5). The filing month counts from its middle, so 14.5 months lands on the last day of the 14th month; the screen quotes USCIS exactly ("USCIS says 14.5 months").
- **Imperial CA**: the sheet's number column said 15 but the copied sentence said 15.5; the owner confirmed 15.5.
- **Office list**: the owner's sheet dropped Saint Albans VT and added Burlington VT, Cranbury NJ, Helena MT, Montgomery AL and Wichita KS.
- **Old numbers are hidden**: after 60 days without a check (`checked_on`), learners see "Coming soon" again; admins see "Out of date".
- **No servers, no working around blocks.** The USCIS processing-times page and its data addresses answer automated requests from servers with a Cloudflare block (HTTP 403, seen on 2026-11-26 and 2026-11-27). We don't work around that. No official USCIS data feed was found (2026-11-27).
- **The owner's browser helper** (decided 2026-11-27, because the hand copy took over an hour): a bookmark the owner clicks on the USCIS page, once a month, one office every 3 seconds; it asks only what the page itself asks and sends nothing elsewhere. The owner spot-checks the result; `npm run uscis:apply` updates the file through a PR. **Not yet tried on the real page** (USCIS blocks this session, so it was written against made-up answers): the first run may stop with "Stopped at …" and need a fix. The owner should also check the egov.uscis.gov website policies. Steps in `content/uscis/README.md`.
- **Monthly reminder**: the 20th of each month, 8:13 AM Eastern, into the owner's session.

## The sheet
`docs/review/n400-field-offices.xlsx` is the owner's filled-in sheet (90 offices, one row each: the sentence from USCIS word for word, the months, the date read, Checked). Use it for the next monthly check.
