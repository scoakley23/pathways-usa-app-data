#!/usr/bin/env python3
"""Senators' official portraits for the story player ("Your senators").

Run after each monthly officeholder check (src/data/officeholders.json):

    python3 scripts/officeholders/build_senator_photos.py

1. Reads the Senate's own list (senate.gov senators_cfm.xml) for each
   senator's state and Bioguide id.
2. Matches each one to a senator NAME in src/data/officeholders.json (same
   state, same last name). The names always come from officeholders.json;
   this script never changes it.
3. Downloads the official Bioguide portrait (bioguide.congress.gov, a U.S.
   government work in the public domain), resizes it to 200x250 and writes
   public/senator-photos/<bioguide>.jpg, then src/data/senatorPhotos.json:
   { checkedOn, photos: { "<State>": [{ name, file, bioguide }] } }.

The app shows a photo only while its `name` still matches the official list,
so a new senator never gets the old photo (src/lib/senatorPhotos.js).
Photos of senators no longer on the list are deleted.
"""
import datetime, io, json, os, re, sys, unicodedata, urllib.request, xml.etree.ElementTree as ET
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OFFICEHOLDERS = os.path.join(ROOT, 'src/data/officeholders.json')
OUT_JSON = os.path.join(ROOT, 'src/data/senatorPhotos.json')
OUT_DIR = os.path.join(ROOT, 'public/senator-photos')
SENATE_XML = 'https://www.senate.gov/general/contact_information/senators_cfm.xml'
PHOTO = 'https://bioguide.congress.gov/photo/{id}.jpg'
UA = {'User-Agent': 'Mozilla/5.0 (education app; senator portraits)'}

STATES = {
 'AL':'Alabama','AK':'Alaska','AZ':'Arizona','AR':'Arkansas','CA':'California','CO':'Colorado','CT':'Connecticut','DE':'Delaware',
 'FL':'Florida','GA':'Georgia','HI':'Hawaii','ID':'Idaho','IL':'Illinois','IN':'Indiana','IA':'Iowa','KS':'Kansas','KY':'Kentucky',
 'LA':'Louisiana','ME':'Maine','MD':'Maryland','MA':'Massachusetts','MI':'Michigan','MN':'Minnesota','MS':'Mississippi','MO':'Missouri',
 'MT':'Montana','NE':'Nebraska','NV':'Nevada','NH':'New Hampshire','NJ':'New Jersey','NM':'New Mexico','NY':'New York',
 'NC':'North Carolina','ND':'North Dakota','OH':'Ohio','OK':'Oklahoma','OR':'Oregon','PA':'Pennsylvania','RI':'Rhode Island',
 'SC':'South Carolina','SD':'South Dakota','TN':'Tennessee','TX':'Texas','UT':'Utah','VT':'Vermont','VA':'Virginia','WA':'Washington',
 'WV':'West Virginia','WI':'Wisconsin','WY':'Wyoming',
}

def norm(s):
    s = unicodedata.normalize('NFD', s or '')
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z ]+', ' ', s.lower()).split()

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()

def main():
    official = json.load(open(OFFICEHOLDERS))['places']
    root = ET.fromstring(get(SENATE_XML))
    members = [{k: (m.findtext(k) or '').strip() for k in ('last_name', 'first_name', 'state', 'bioguide_id')} for m in root.iter('member')]
    os.makedirs(OUT_DIR, exist_ok=True)
    photos, unmatched, keep = {}, [], set()
    for m in members:
        state = STATES.get(m['state'])
        names = [s['name'] for s in (official.get(state, {}).get('senators') or [])]
        last = norm(m['last_name'])
        match = [n for n in names if last and all(w in norm(n) for w in last)]
        if len(match) != 1 or not m['bioguide_id']:
            unmatched.append(f"{m['first_name']} {m['last_name']} ({m['state']})")
            continue
        bid = m['bioguide_id']
        path = os.path.join(OUT_DIR, f'{bid}.jpg')
        if not os.path.exists(path):
            try:
                im = Image.open(io.BytesIO(get(PHOTO.format(id=bid)))).convert('RGB')
            except Exception as e:
                unmatched.append(f'{match[0]} (no photo: {e})')
                continue
            # A close head-and-shoulders crop (the middle 62% of the width,
            # from the top), so the flags behind most portraits mostly drop
            # out (brand rules: no flag pictures).
            w, h = im.size
            nw = int(w * 0.62)
            nh = min(h, int(nw * 5 / 4))
            left = (w - nw) // 2
            top = min(int(h * 0.04), h - nh)
            im = im.crop((left, top, left + nw, top + nh))
            im.resize((200, 250), Image.LANCZOS).save(path, 'JPEG', quality=80, optimize=True, progressive=True)
        keep.add(f'{bid}.jpg')
        photos.setdefault(state, []).append({'name': match[0], 'file': f'{bid}.jpg', 'bioguide': bid})
    for f in os.listdir(OUT_DIR):
        if f.endswith('.jpg') and f not in keep:
            os.remove(os.path.join(OUT_DIR, f))
    out = {
        'note': 'Senators\' official Bioguide portraits (public domain). Built by scripts/officeholders/build_senator_photos.py from senate.gov; names copied from src/data/officeholders.json. A photo shows only while its name matches that list.',
        'checkedOn': datetime.date.today().isoformat(),
        'credit': 'Official portrait · Biographical Directory of the U.S. Congress',
        'source': 'https://bioguide.congress.gov/',
        'photos': dict(sorted(photos.items())),
    }
    json.dump(out, open(OUT_JSON, 'w'), ensure_ascii=False, indent=2)
    open(OUT_JSON, 'a').write('\n')
    print(f'{sum(len(v) for v in photos.values())} senators with photos; not matched: {unmatched or "none"}')

if __name__ == '__main__':
    sys.exit(main())
