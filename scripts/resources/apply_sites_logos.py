# Usage (from the repo root):
#   python3 scripts/resources/apply_sites_logos.py content/resources/update-2026-10.json [--websites verified.json] [--logos logos.json]
#
# Fills in, in place, only where a place has none yet (existing values are never replaced):
#   --websites: verify_sites.py output ({"<external_id>": {"website": url, "matched": ...}}). The
#               website also goes to the organization's other DOJ offices without one (same name).
#   --logos:    find_logos.py output ({"<website>": {"logo": url, ...}}), for places with a website.
#               USCIS offices get no logo (no seals).
# Prints counts.
import json, re, sys

args = sys.argv[1:]
path = args[0]
opt = lambda name: args[args.index(name) + 1] if name in args else ''
rows = json.load(open(path))
key = lambda r: re.sub(r'\s+', ' ', r['name'].strip().lower())

added_sites = 0
if opt('--websites'):
    verified = {k: v for k, v in json.load(open(opt('--websites'))).items() if v and v.get('website')}
    by_org = {}
    for r in rows:
        if r['external_id'] in verified:
            by_org.setdefault(key(r), verified[r['external_id']]['website'])
    for r in rows:
        site = (verified.get(r['external_id']) or {}).get('website') or (by_org.get(key(r)) if r['external_id'].startswith('doj:') else '')
        if site and not r.get('website'):
            r['website'] = site
            added_sites += 1

added_logos = 0
if opt('--logos'):
    logos = json.load(open(opt('--logos')))
    for r in rows:
        logo = (logos.get(r.get('website') or '') or {}).get('logo')
        if logo and not r.get('logo_url') and not r['external_id'].startswith('uscis:'):
            r['logo_url'] = logo
            added_logos += 1

json.dump(rows, open(path, 'w'), indent=1, ensure_ascii=False)
print(f'websites added: {added_sites}, logos added: {added_logos}', file=sys.stderr)
