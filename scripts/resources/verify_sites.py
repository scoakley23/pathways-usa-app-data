# Usage: python3 scripts/resources/verify_sites.py candidates.json places.json verified.json
#   candidates.json: {"<external_id>": ["https://...", ...]} (e.g. from a web search)
#   places.json:     list of {id, name, address, city, state, zip, phone}
# Keeps a candidate website only if the site itself shows the place's phone
# number or its street number + street name, on the given page or on its
# /contact or /about page. One site at a time, short timeouts, robots.txt
# respected. Output: {"<external_id>": {"website": url, "matched": "phone"|"address"}}
import json, os, re, sys, urllib.parse, urllib.request, urllib.robotparser, html

cand_path, places_path, out = sys.argv[1:4]
UA = 'PathwaysUSA-resource-check (pathwaysusacitizenship@gmail.com)'
proxy = os.environ.get('https_proxy') or os.environ.get('HTTPS_PROXY') or ''
if proxy:
    urllib.request.install_opener(urllib.request.build_opener(urllib.request.ProxyHandler({'http': proxy, 'https': proxy})))
BLOCKED = re.compile(r'(nld\.org|immigrationlawhelp|immigrationadvocates|probono\.net|yelp|yellowpages|mapquest|facebook|'
                     r'instagram|linkedin|guidestar|candid\.org|charitynavigator|211|findhelp|volunteermatch|idealist|'
                     r'justia|visamind|wikipedia)', re.I)

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'text/html,*/*;q=0.5'})
    with urllib.request.urlopen(req, timeout=15) as r:
        if 'html' not in r.headers.get('Content-Type', '').lower():
            return r.geturl(), ''
        return r.geturl(), r.read(600_000).decode('utf-8', 'replace')

def allowed(url):
    p = urllib.parse.urlsplit(url)
    rp = urllib.robotparser.RobotFileParser()
    try:
        rp.parse(get(f'{p.scheme}://{p.netloc}/robots.txt')[1].splitlines())
    except Exception:
        return True
    return rp.can_fetch(UA, url)

def text(page):
    page = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', page, flags=re.S | re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', page))

def phone10(p):
    d = re.sub(r'\D', '', str(p or ''))
    return d[-10:] if len(d) >= 10 else ''

def street_bits(address):
    first = str(address or '').split(',')[0]
    m = re.match(r'\s*(\d+[a-z]?)\s+(?:[nsew]\.?\s+)?([a-z][a-z.\'-]+)', first, re.I)
    return (m.group(1), m.group(2).lower().strip('.')) if m and len(m.group(2)) > 2 else None

def matches(t, place):
    digits = re.sub(r'\D', '', t)
    ph = phone10(place.get('phone'))
    if ph and ph in digits:
        return 'phone'
    sb = street_bits(place.get('address'))
    if sb and re.search(rf'\b{re.escape(sb[0])}\s+(?:[nsew]\.?\s+)?{re.escape(sb[1])}', t, re.I):
        return 'address'
    return ''

cands = json.load(open(cand_path))
places = {p['id']: p for p in json.load(open(places_path))}
result = json.load(open(out)) if os.path.exists(out) else {}
for pid, urls in cands.items():
    if pid in result or pid not in places:
        continue
    found = None
    for url in [u for u in urls if u and not BLOCKED.search(u)][:3]:
        try:
            if not allowed(url):
                continue
            final, page = get(url)
            how = matches(text(page), places[pid])
            if not how:
                root = '{0.scheme}://{0.netloc}'.format(urllib.parse.urlsplit(final))
                for extra in ['/contact', '/contact-us', '/about', '/about-us']:
                    try:
                        how = matches(text(get(root + extra)[1]), places[pid])
                    except Exception:
                        how = ''
                    if how:
                        break
            if how:
                found = {'website': final, 'matched': how}
                break
        except Exception:
            continue
    result[pid] = found
    json.dump(result, open(out, 'w'))
ok = sum(1 for v in result.values() if v)
print(f'verified {ok} of {len(result)}', file=sys.stderr)
