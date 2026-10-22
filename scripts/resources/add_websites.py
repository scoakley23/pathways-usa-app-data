# Usage (from the repo root):
#   python3 scripts/resources/add_websites.py ian.json nld-verified.json content/resources/update-2026-10.json
#
# Adds websites (and stated languages) to the update file, in place:
#   - DOJ-recognized organizations: from the Immigration Advocates Network
#     directory (harvest_ian.py), only when an IAN listing has the same phone
#     number, or the same street address and ZIP, and the names share a
#     distinctive word. The website then also goes to the organization's other
#     DOJ offices (same organization name in the DOJ roster).
#   - NLD programs without a website: from verify_sites.py (a web-search
#     candidate whose own pages show the program's phone or address).
# Existing websites are never replaced. Prints counts.
import json, re, sys, urllib.parse

ian_path, nld_path, update_path = sys.argv[1:4]
rows = json.load(open(update_path))
ian = [o for o in json.load(open(ian_path)).get('orgs', {}).values() if o and o.get('website')]
nld_found = json.load(open(nld_path))

STOP = set('inc the of and for at in a an on to llc corp co services service center centre program programs project '
           'english esl esol literacy learning education class classes community international institute office '
           'immigration immigrant immigrants legal ministry ministries church catholic charities refugee refugees '
           'diocese archdiocese family families'.split())
LANGS = ['Spanish', 'Arabic', 'Chinese', 'Mandarin', 'Cantonese', 'Vietnamese', 'Korean', 'Tagalog', 'French', 'Haitian Creole',
         'Portuguese', 'Russian', 'Ukrainian', 'Polish', 'Somali', 'Amharic', 'Tigrinya', 'Swahili', 'Nepali', 'Burmese', 'Karen',
         'Dari', 'Pashto', 'Farsi', 'Persian', 'Urdu', 'Hindi', 'Bengali', 'Punjabi', 'Gujarati', 'Japanese', 'Hmong', 'Khmer',
         'Lao', 'Thai', 'Italian', 'German', 'Greek', 'Turkish', 'Hebrew', 'Kinyarwanda', 'Kirundi', 'Oromo', 'Mixteco',
         'Zapoteco', "K'iche'", 'Mam', 'Q\'anjob\'al', 'American Sign Language', 'Romanian', 'Albanian', 'Bosnian', 'Armenian']

def phone10(p):
    d = re.sub(r'\D', '', str(p or ''))
    return d[-10:] if len(d) >= 10 else ''

def street_key(address, zip5):
    a = str(address or '').lower().split(',')[0]
    a = re.sub(r'\b(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|suite|ste|floor|fl)\b\.?', '', a)
    return re.sub(r'[^a-z0-9]', '', a) + '|' + str(zip5 or '')

def words(s, place=''):
    skip = STOP | set(re.findall(r'[a-z0-9]+', place.lower()))
    return {w for w in re.findall(r'[a-z0-9]+', re.sub(r'\([^)]*\)', ' ', s or '').lower()) if len(w) > 2 and w not in skip}

def ian_address(o):
    loc = [x for x in o.get('location', []) if x != ',']
    zip5 = next((x for x in reversed(loc) if re.fullmatch(r'\d{5}(-\d{4})?', x)), '')[:5]
    street = loc[0] if loc else ''
    return street, zip5

def ian_langs(o):
    stated = o.get('languages', '')
    return [l for l in LANGS if re.search(rf'\b{re.escape(l)}\b', stated, re.I)]

# Directory websites that, on review, didn't belong to the matched organization.
REJECT_HOSTS = {'saferoute.org', 'ascafrica.org', 'ciiccolorado.org', 'ilashc.org'}

def clean_site(url):
    url = (url or '').strip()
    url = re.sub(r'^(https?://)[a-z]www\.', r'\1www.', url, flags=re.I)  # "lwww." typos in the directory
    host = urllib.parse.urlsplit(url if '://' in url else 'http://' + url).netloc.lower().removeprefix('www.')
    if not host or host in REJECT_HOSTS or re.search(r'facebook|instagram|linkedin', host):
        return ''
    return url

for o in ian:
    o['website'] = clean_site(o['website'])
ian = [o for o in ian if o['website']]

by_phone, by_street = {}, {}
for o in ian:
    street, zip5 = ian_address(o)
    if phone10(o.get('phone')):
        by_phone.setdefault(phone10(o['phone']), []).append(o)
    if street and zip5:
        by_street.setdefault(street_key(street, zip5), []).append(o)

base_name = lambda n: re.sub(r'\s*\([^)]*\)\s*$', '', n or '').strip().lower()
counts = {'doj_matched': 0, 'doj_via_same_org': 0, 'doj_languages': 0, 'nld_added': 0}
org_site, org_langs = {}, {}

for r in rows:
    if not r['external_id'].startswith('doj:'):
        continue
    cands = by_phone.get(phone10(r.get('phone')), []) + by_street.get(street_key(r.get('address'), r.get('zip')), [])
    o = next((c for c in cands if words(c['name'], r.get('city', '')) & words(r['name'], r.get('city', ''))), None)
    if not o:
        continue
    if not r.get('website'):
        r['website'] = o['website']; counts['doj_matched'] += 1
    langs = ian_langs(o)
    if langs and not r.get('languages'):
        r['languages'] = langs; counts['doj_languages'] += 1
    org_site.setdefault(base_name(r['name']), o['website'])
    if langs:
        org_langs.setdefault(base_name(r['name']), langs)

# Other offices of a matched organization (same name in the DOJ roster).
for r in rows:
    if r['external_id'].startswith('doj:') and not r.get('website') and base_name(r['name']) in org_site:
        r['website'] = org_site[base_name(r['name'])]; counts['doj_via_same_org'] += 1
        if not r.get('languages') and base_name(r['name']) in org_langs:
            r['languages'] = org_langs[base_name(r['name'])]; counts['doj_languages'] += 1

def tidy(url):
    # A verified page can be a news story or an event notice; link to the
    # site's home page instead, and skip sites that are news outlets.
    p = urllib.parse.urlsplit(url)
    if re.search(r'news|times|herald|gazette|tribune|patch\.com', p.netloc, re.I):
        return ''
    if re.search(r'(news|press|release|article|blog|story|openhouse|event|calendar|fee-schedule)', p.path, re.I):
        return f'{p.scheme}://{p.netloc}/'
    return url

for r in rows:
    hit = nld_found.get(r['external_id'])
    if r['external_id'].startswith('nld:') and hit and not r.get('website'):
        site = tidy(hit['website'])
        if site:
            r['website'] = site; counts['nld_added'] += 1

json.dump(rows, open(update_path, 'w'), indent=1, ensure_ascii=False)
shown = [r for r in rows if r.get('is_active') is not False]
counts['shown_with_website'] = f"{sum(1 for r in shown if r.get('website'))} of {len(shown)}"
print(json.dumps(counts), file=sys.stderr)
