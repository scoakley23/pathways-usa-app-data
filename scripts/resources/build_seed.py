# Usage: python3 scripts/resources/build_seed.py occam_offices.json doj.json content/resources/seed-resources.json
# Build content/resources/seed-resources.json (Admin -> Places import format)
# from: USCIS field offices (Occam Immigration office finder page data) and
# the DOJ EOIR recognized-organizations roster by state and city.
import json, re, sys
occam, doj, out = sys.argv[1:4]
TODAY = '2026-10-21'
recs = []

for o in json.load(open(occam)):
    recs.append({
        'name': f"USCIS {o['name']} Field Office",
        'category': 'uscis',
        'address': o['address'], 'city': o['city'], 'state': o['state'], 'zip': o['zip'],
        'phone': o.get('phone') or '1-800-375-5283',
        'website': 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices',
        'languages': [], 'cost': '',
        'description': 'USCIS field office. Interviews and appointments only. You need an appointment notice to visit.',
        'source': 'USCIS field offices (Occam Immigration office finder)',
        'source_url': f"https://occamimmigration.com/resources/uscis-field-offices/{o['slug']}",
        'last_verified': TODAY, 'is_active': True,
    })

for d in json.load(open(doj)):
    addr, city = d['address'], d['city']
    if not addr and re.match(r'\d', city):  # street ran into the city line
        hdr = d.get('city_header', '')
        if hdr and city.lower().endswith(hdr.lower()):
            addr, city = city[: -len(hdr)].rstrip(' ,'), hdr
        elif ',' in city:
            addr, city = [p.strip() for p in city.rsplit(',', 1)]
    office = d['office']
    name = d['org']
    if office != 'Principal Office':
        place = re.sub(r'\s*Extension Office$', '', office).strip()
        name = f"{name} ({place} office)" if place else name
    recs.append({
        'name': name, 'category': 'legal',
        'address': addr, 'city': city, 'state': d['state'], 'zip': d['zip'],
        'phone': d['phone'], 'website': '', 'languages': [], 'cost': '',
        'description': 'DOJ-recognized organization. Its accredited representatives can give immigration legal help. Call to ask about services and cost.',
        'source': 'DOJ EOIR Recognized Organizations roster (by state and city, updated 10/18/26)',
        'source_url': 'https://www.justice.gov/eoir/recognition-accreditation-roster-reports',
        'last_verified': TODAY, 'is_active': True,
    })

recs.sort(key=lambda r: (r['state'], r['city'].lower(), r['category'], r['name'].lower()))
json.dump(recs, open(out, 'w'), indent=1, ensure_ascii=False)
print(len(recs), 'records', file=sys.stderr)
