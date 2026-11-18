# Officeholders: senators' photos

The names of current officeholders come only from `src/data/officeholders.json`
(the monthly check against official government websites). This folder has the
one step that follows that check:

```
python3 scripts/officeholders/build_senator_photos.py
```

It reads the Senate's own list (senate.gov) for each senator's Bioguide id,
matches it to the official name in `officeholders.json` (same state, same last
name), downloads the official Bioguide portrait (public domain), crops it to a
200×250 head-and-shoulders picture and writes `public/senator-photos/` and
`src/data/senatorPhotos.json`. Photos of senators no longer on the list are
deleted. It prints anyone it couldn't match or who has no portrait yet; the app
shows their name without a photo.

Run it after every monthly check, and after the new Congress starts
(January 3, 2027). The app shows a photo only while its name still matches the
official list, so a stale photo is never shown with a new name.
`src/lib/senatorPhotos.test.js` fails if a photo isn't listed, a listed name
isn't in the official list, or a file is over 30 KB.
