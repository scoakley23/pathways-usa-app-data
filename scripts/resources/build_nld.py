# Usage: python3 scripts/resources/build_nld.py nld.json content/resources/seed-nld-classes.json
#   nld.json = output of harvest_nld.py (public listing fields only)
# Turns National Literacy Directory programs that offer "Learn English" or
# "Become a U.S. citizen" into Admin -> Places import records.
import json, math, re, sys
src, out = sys.argv[1], sys.argv[2]
zips = json.load(open('src/data/zipCentroids.json'))
TODAY = '2026-10-21'

def miles(a, b):
    la1, lo1, la2, lo2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 7917.6 * math.asin(math.sqrt(h))

EMAIL = re.compile(r'[\w.+-]+@[\w-]+(\.[\w-]+)+')

# Program staff sometimes type a personal email into the phone or website box;
# emails are never imported.
def clean(v):
    v = EMAIL.sub('', str(v or ''))
    return re.sub(r'\s+', ' ', v).strip(' ,;')

recs, skipped = [], 0
for p in json.load(open(src)):
    if p.get('status') != 1 or p.get('deleted_at'):
        skipped += 1
        continue
    services = set(clean(p.get('education_services_cb')).replace(' ', '').split(','))
    citizenship, english = '14' in services, '6' in services
    if not (citizenship or english):
        skipped += 1
        continue
    zip5 = re.sub(r'\D', '', clean(p.get('zip_code_tx')))[:5].zfill(5)
    lat, lng = p.get('lat'), p.get('lng')
    try:
        lat, lng = float(lat), float(lng)
    except (TypeError, ValueError):
        lat = lng = None
    ref = zips.get(zip5)
    exact = lat is not None and not (lat == 0 and lng == 0) and (not ref or miles(ref, (lat, lng)) <= 25)

    offers = ['citizenship classes' if citizenship else '', 'English classes' if english else '']
    desc = 'Offers ' + ' and '.join(o for o in offers if o) + '.'
    if 'Instruction in Spanish' in clean(p.get('instruction_type_cb')):
        desc += ' Some teaching in Spanish.'
    if 'Distance learning' in clean(p.get('instruction_type_cb')):
        desc += ' Online classes available.'
    desc += ' Call to ask about class times.'

    cost_text = clean(p.get('cost_description'))
    cost = 'free' if re.search(r'\bfree\b', cost_text, re.I) and not re.search(r'\$|\bfee', cost_text, re.I) else ''

    address = ', '.join(a for a in [clean(p.get('street_address')), clean(p.get('address_2'))] if a)
    phone = clean(p.get('primary_contact_phone_tx'))
    if clean(p.get('phone_extension')):
        phone = f"{phone} ext. {clean(p.get('phone_extension'))}".strip()
    phone = re.sub(r'^ext\.\s*', '', phone)
    recs.append({
        'name': clean(p.get('title')),
        'category': 'citizenship_class' if citizenship else 'esl',
        'address': address, 'city': clean(p.get('city')), 'state': clean(p.get('state')).upper()[:2], 'zip': zip5,
        'latitude': round(lat, 6) if exact else None, 'longitude': round(lng, 6) if exact else None,
        'phone': phone, 'website': clean(p.get('website_url')), 'languages': [], 'cost': cost,
        'description': desc,
        'source': 'National Literacy Directory',
        'source_url': f"https://www.nld.org/{p['slug']}" if p.get('slug') else 'https://www.nld.org/programs',
        'last_verified': TODAY, 'is_active': True,
    })

recs.sort(key=lambda r: (r['state'], r['city'].lower(), r['category'], r['name'].lower()))
json.dump(recs, open(out, 'w'), indent=1, ensure_ascii=False)
print(f"{len(recs)} records ({sum(r['category'] == 'citizenship_class' for r in recs)} citizenship, "
      f"{sum(r['category'] == 'esl' for r in recs)} English); {skipped} skipped", file=sys.stderr)
