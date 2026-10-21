# Resource Hub places

The Resource Hub map ("Find help near you") shows `CommunityResource` records. They are **public listings checked by a person**. Never add places found or written by AI, and never add a learner's own information.

Manage them in **Admin → Places**: add, edit, hide/show, delete, or **Import CSV/JSON**.

## Import format

Start from `import-template.csv` (open it in a spreadsheet, fill rows, save as CSV). A JSON file with a list of objects using the same field names also works.

| Column | Required | Notes |
| --- | --- | --- |
| `name` | yes | |
| `category` | yes | one of `legal`, `esl`, `citizenship_class`, `uscis`, `library`, `other` |
| `address`, `city`, `state`, `zip` | ZIP needed if no coordinates | `state` is the 2-letter code. A ZIP that lost its leading zero (`2138`) is fixed. |
| `latitude`, `longitude` | no | Leave empty to place the pin at the center of the ZIP code (shown to learners as approximate). |
| `phone`, `website` | no | Only `http(s)` websites are kept. |
| `languages` | no | Separate with `;`, e.g. `English; Spanish` |
| `cost` | no | `free`, `low_cost`, `varies`, or empty. Only say `free` if the source says so. |
| `description` | no | One or two plain sentences. |
| `source`, `source_url` | strongly recommended | Where the listing came from. |
| `last_verified` | recommended | `YYYY-MM-DD` |

Re-running an import is safe: rows with the same name and ZIP as an existing place are skipped. Rows with problems are skipped and listed in the browser console.

## Starting sources

- **USCIS field offices**: https://www.uscis.gov/about-us/find-a-uscis-office/field-offices (each office page lists its address). Category `uscis`, cost `free`, description e.g. "USCIS field office. Interviews and appointments only. You need an appointment notice to visit."
- **DOJ-recognized organizations** (free/low-cost legal help): the "Recognized Organizations" roster at https://www.justice.gov/eoir/recognition-and-accreditation-roster-reports. Category `legal`, description e.g. "DOJ-recognized organization. Its accredited representatives can give immigration legal help."
- **English and citizenship classes, libraries**: local adult-education programs, public libraries, and community partners. Check each one directly.

Check listings at least once a year and update `last_verified`. Hide places that close or can't be confirmed.

## ZIP table

`src/data/zipCentroids.json` maps each 5-digit ZIP to `[latitude, longitude]` (3 decimals). It was built from the `us-zips` npm package (MIT, version 2022.9.1), which is based on the U.S. Census Bureau 2022 ZIP Code Tabulation Areas Gazetteer (public domain). It lets the app turn a typed ZIP into map coordinates on the device, without sending the ZIP anywhere.
