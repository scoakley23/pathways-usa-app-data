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

1,651 places (USCIS offices and legal help), built 2026-10-21. Import it first in **Admin → Places → Import CSV/JSON**.

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

## English and citizenship classes: `seed-nld-classes.json`

3,947 programs from the **National Literacy Directory** (https://www.nld.org), downloaded 2026-10-21: every program offering "Become a U.S. citizen" (1,486, category `citizenship_class`) or "Learn English" but not citizenship (2,461, category `esl`). Import it in **Admin → Places** after `seed-resources.json`; 13 programs NLD lists twice are skipped automatically.

- Public listing fields only: program name, address, phone, website, map coordinates (from NLD; 3,916 exact, others at the ZIP center), whether some teaching is in Spanish or online, and "Free" only when the program's own cost note says free.
- NLD's search endpoint also returns each program contact's name, email, and account details. `harvest_nld.py` drops those before anything is written to disk, and `build_nld.py` removes any email typed into another field. Never import them.
- Program names are NLD's (some are generic, e.g. "Library Classes and Events"); edit in Admin if needed.
- To refresh: `harvest_nld.py nld.json` (about 50 requests, 1.5 s apart), then `build_nld.py nld.json content/resources/seed-nld-classes.json` from the repo root.

## October 2026 update: `update-2026-10.json` (+ `review-2026-10.csv`)

One file that **updates** the 5,585 places already imported from the two seed files. Import it in Admin → Places → Import CSV/JSON; the confirmation should say about **0 new, 5,585 updated (about 690 hidden)**, or, if you already imported the first version of this file, **469 updated (469 hidden)**. Running it again changes nothing, and never undoes a place you have checked.

What it changes:
- **Source ids** (`external_id`: `uscis:…`, `doj:…`, `nld:…`) so later imports update the same place.
- **Services**: each place lists everything it offers (`services`), so a place can show under several filters. "Free legal help" is given **only** to DOJ-recognized organizations, never inferred from a website.
- **Merged duplicates**: 56 NLD programs that are the same organization and place as a DOJ listing (same phone or street address and ZIP, and a shared distinctive word in the name) are hidden; the DOJ listing gains their class services, website, logo and hours.
- **Not relevant (hidden, not deleted)**: 172 programs for children, K-12 schools, youth programs, and family-literacy programs without adult English classes, judged from the program's name and NLD description.
- **Hidden until you check them** (469): programs that couldn't be confirmed as adult programs, libraries whose description leads with children's programs, websites that talk mostly about children's programs, and 14 that mention immigration consulting or notario services (check these are not notarios). Find them in Admin → Places → Show: "Waiting for your check". For each one, choose **Show** (it goes live) or **Keep hidden (checked)**. Either way it's marked "Checked: …" and later imports won't change that decision.
- **Hours** (2,968), **logos** (1,906, NLD's own image links, loaded only when a learner opens a place's summary), **websites**, and **languages** only where stated: NLD's "Instruction in Spanish" flag, or explicit phrases such as "classes taught in …", "bilingual …", "staff speak …".

`review-2026-10.csv` lists every hidden, merged and flagged place with its reason, NLD page and website, for a person to check. To change a decision, edit the place in Admin → Places (Show / Hide).

How it was built (keyword rules, not AI; scripts in `scripts/resources/`):
1. `harvest_nld.py nld.json` (public listing fields only, incl. description, logo, hours)
2. `fetch_sites.py nld.json sites.json` then `fetch_sites.py nld.json sites.json --retry-errors` (front page of each program's website; robots.txt respected; emails removed). 2,685 of 3,353 websites could be read.
3. `build_update.py nld.json sites.json content/resources/update-2026-10.json content/resources/review-2026-10.csv`

Note: a place an admin renamed before this update won't match by name and would be added again; check Admin for a renamed place's twin after importing.

Not imported, linked instead (the "Search national directories" card on the Resource Hub):
- **ImmigrationLawHelp.org**: its robots.txt asks crawlers to stay out of its search pages. Most of its legal providers are DOJ-recognized organizations, which are in the seed file. Ask Pro Bono Net (who runs it) for a data export before importing.
- **CareerOneStop library finder**: blocks automated access. It is a search tool, not a list.

## Starting sources

- **USCIS field offices**: https://www.uscis.gov/about-us/find-a-uscis-office/field-offices (each office page lists its address). Category `uscis` (leave cost empty: visiting is free, filing fees are not), description e.g. "USCIS field office. Interviews and appointments only. You need an appointment notice to visit."
- **DOJ-recognized organizations** (free/low-cost legal help): the "Recognized Organizations" roster at https://www.justice.gov/eoir/recognition-and-accreditation-roster-reports. Category `legal`, description e.g. "DOJ-recognized organization. Its accredited representatives can give immigration legal help."
- **English and citizenship classes, libraries**: local adult-education programs, public libraries, and community partners. Check each one directly.

Check listings at least once a year and update `last_verified`. Hide places that close or can't be confirmed.

## ZIP table

`src/data/zipCentroids.json` maps each 5-digit ZIP to `[latitude, longitude]` (3 decimals). It was built from the `us-zips` npm package (MIT, version 2022.9.1), which is based on the U.S. Census Bureau 2022 ZIP Code Tabulation Areas Gazetteer (public domain). It lets the app turn a typed ZIP into map coordinates on the device, without sending the ZIP anywhere.
