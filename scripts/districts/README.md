# ZIP code → congressional district table

`src/data/zipDistricts.json` lets "Who Represents Me?" find a learner's state
and congressional district from a ZIP code **on the device**, with no AI and
nothing sent anywhere. It comes from the U.S. Census Bureau's official
relationship file of ZIP code areas (ZCTAs, 2020) by congressional district:

    https://www2.census.gov/geo/docs/maps-data/data/rel2020/cd-sld/tab20_cd11920_zcta520_natl.txt

Rebuild it with:

    node scripts/districts/build-zip-districts.mjs                 # 119th Congress (default)
    node scripts/districts/build-zip-districts.mjs --congress 120  # once Census publishes it
    node scripts/districts/build-zip-districts.mjs --file <downloaded .txt>

## How it works

- A ZIP is listed under every district that holds any of its land (parts that
  are only water are left out). About 5,800 of 33,800 ZIPs are in two or more
  districts ("split"); for those, and for ZIPs that aren't Census ZIP areas
  (some PO-box-only ZIPs, like 20500), the app asks for the street address and
  looks it up once (`src/api/districts.js`: Geocodio on Supabase, the AI on
  Base44). It never guesses.
- At-large states, D.C. and the territories are `"At-large"`, matching
  `src/data/officeholders.json`. `src/lib/zipDistricts.test.js` fails if any
  district in the table is missing from the officeholders table.

## When districts change

The table is the **119th Congress** (until January 3, 2027). Several states
redrew their districts for the November 2026 election, so in January 2027:

1. Update `src/data/officeholders.json` for the 120th Congress (the monthly check).
2. Rebuild this table from the 120th Congress file (`--congress 120`), or, if
   Census hasn't published it yet, keep the old table and expect more
   "split" or wrong answers in the redrawn states until it has.
3. Run `npm test`: it checks every district in the table against the
   officeholders table.
