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

Re-running an import is safe: rows with the same name, street address and ZIP as an existing place are skipped. Rows with problems are skipped and listed in the browser console.

## Starting data: `seed-resources.json`

1,651 places, built 2026-10-21. Import it in **Admin → Places → Import CSV/JSON**.

| Category | Count | Source |
| --- | --- | --- |
| `uscis` | 92 field offices | Addresses from Occam Immigration's USCIS office finder (https://occamimmigration.com/resources/uscis-field-offices), which republishes the USCIS office list. Website links go to the official USCIS office list. |
| `legal` | 1,559 offices of 947 organizations | DOJ EOIR "Recognized Organizations and Accredited Representatives Roster by State and City", report updated 10/18/26 (public U.S. government data). Organizations only: no individual representatives' names. |

Pins: 1,500 are exact (U.S. Census geocoder). 151 are at the ZIP center (`location_precision: "zip"`, shown to learners as approximate): P.O. boxes, addresses the geocoder couldn't match, and 5 listings whose geocoded address was over 25 miles from their ZIP (likely typos in the roster — worth checking): Catholic Charities of Southern New Mexico (Roswell office), De Novo, Santa Barbara County Immigrant Legal Defense Center, Lutheran Community Services Northwest (McMinnville office), Pisgah Legal Services (Marshall office).

To rebuild (Python 3 and `pdftotext`; scripts in `scripts/resources/`):
1. Save the Occam office finder page; run `extract_occam.py page.html occam_offices.json`.
2. Download the DOJ roster "by State" PDF; `pdftotext -layout roster.pdf roster.txt`; run `parse_doj.py roster.txt doj.json`.
3. `build_seed.py occam_offices.json doj.json content/resources/seed-resources.json`
4. `geocode_census.py content/resources/seed-resources.json` (from the repo root).

Not imported, linked instead (the "Search national directories" card on the Resource Hub):
- **ImmigrationLawHelp.org**: its robots.txt asks crawlers to stay out of its search pages. Most of its legal providers are DOJ-recognized organizations, which are in the seed file. Ask Pro Bono Net (who runs it) for a data export before importing.
- **National Literacy Directory** (English and citizenship classes): not imported yet. Its listings could be imported with public fields only. Its search endpoint also returns program contacts' names, emails and account codes, which must never be imported.
- **CareerOneStop library finder**: blocks automated access. It is a search tool, not a list.

## Starting sources

- **USCIS field offices**: https://www.uscis.gov/about-us/find-a-uscis-office/field-offices (each office page lists its address). Category `uscis` (leave cost empty: visiting is free, filing fees are not), description e.g. "USCIS field office. Interviews and appointments only. You need an appointment notice to visit."
- **DOJ-recognized organizations** (free/low-cost legal help): the "Recognized Organizations" roster at https://www.justice.gov/eoir/recognition-and-accreditation-roster-reports. Category `legal`, description e.g. "DOJ-recognized organization. Its accredited representatives can give immigration legal help."
- **English and citizenship classes, libraries**: local adult-education programs, public libraries, and community partners. Check each one directly.

Check listings at least once a year and update `last_verified`. Hide places that close or can't be confirmed.

## ZIP table

`src/data/zipCentroids.json` maps each 5-digit ZIP to `[latitude, longitude]` (3 decimals). It was built from the `us-zips` npm package (MIT, version 2022.9.1), which is based on the U.S. Census Bureau 2022 ZIP Code Tabulation Areas Gazetteer (public domain). It lets the app turn a typed ZIP into map coordinates on the device, without sending the ZIP anywhere.
