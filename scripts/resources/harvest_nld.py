# Usage: python3 scripts/resources/harvest_nld.py nld.json   (takes a while: ~1.5 s per request)
# Harvest National Literacy Directory programs offering "Learn English" (6)
# or "Become a U.S. citizen" (14), by map box. NLD's endpoint returns at most
# 500 results per box, so full boxes are split into four. Only public listing
# fields are kept; contact names, emails and account fields are dropped
# immediately and never written to disk.
import json, sys, time, urllib.request, urllib.parse
out = sys.argv[1]
KEEP = ['id', 'title', 'slug', 'street_address', 'address_2', 'city', 'state', 'zip_code_tx', 'lat', 'lng',
        'primary_contact_phone_tx', 'phone_extension', 'website_url', 'costs', 'cost_description',
        'education_services_cb', 'instruction_type_cb', 'status', 'deleted_at', 'updated_at']
CAP, DELAY = 500, 1.5
progs, calls = {}, 0

def fetch(box, svc):
    global calls
    q = urllib.parse.urlencode({'nelat': box[2], 'nelng': box[3], 'swlat': box[0], 'swlng': box[1], 'a[]': svc})
    req = urllib.request.Request('https://www.nld.org/programs/refresh?' + q, headers={
        'User-Agent': 'PathwaysUSA-resource-import (pathwaysusacitizenship@gmail.com)',
        'X-Requested-With': 'XMLHttpRequest', 'Referer': 'https://www.nld.org/programs'})
    for attempt in range(4):
        try:
            time.sleep(DELAY); calls += 1
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r).get('data') or {}
        except Exception as e:
            print('retry', box, svc, e, file=sys.stderr, flush=True); time.sleep(10 * (attempt + 1))
    raise SystemExit(f'failed {box} {svc}')

def walk(box, svc, depth=0):
    data = fetch(box, svc)
    if isinstance(data, list): data = {str(i): d for i, d in enumerate(data)}
    if len(data) >= CAP and depth < 12:
        s, w, n, e = box; ml, mg = (s + n) / 2, (w + e) / 2
        for b in [(s, w, ml, mg), (s, mg, ml, e), (ml, w, n, mg), (ml, mg, n, e)]:
            walk(b, svc, depth + 1)
        return
    for d in data.values():
        rec = {k: d.get(k) for k in KEEP}
        progs.setdefault(rec['id'], rec)
    print(f'svc {svc} depth {depth} box {tuple(round(x,2) for x in box)}: {len(data)} (total {len(progs)}, calls {calls})', file=sys.stderr, flush=True)

# 50 states, DC, PR, USVI (lat, lng boxes as south, west, north, east), plus Guam/CNMI.
BOXES = [(24.0, -125.0, 49.5, -66.5), (51.0, -180.0, 72.0, -129.0), (18.5, -161.0, 22.5, -154.5),
         (17.5, -68.0, 18.6, -64.3), (13.0, 144.5, 15.5, 146.0)]
for svc in ['6', '14']:
    for b in BOXES:
        walk(b, svc)
json.dump(list(progs.values()), open(out, 'w'))
print('DONE', len(progs), 'programs,', calls, 'calls', file=sys.stderr)
