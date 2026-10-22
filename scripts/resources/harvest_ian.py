# Usage: python3 scripts/resources/harvest_ian.py ian.json [--minutes 110]
#
# Reads the Immigration Advocates Network's National Immigration Legal
# Services Directory (https://www.immigrationadvocates.org/legaldirectory/):
# each state's result pages, then each organization page. Its robots.txt
# allows these pages (it disallows only /search/*) and asks for 20 s between
# requests, which this script keeps. Progress is saved after every request,
# so it can be stopped and run again to continue (e.g. --minutes 110 stops
# after about that long).
#
# Kept per organization (public listing fields only): name, location lines,
# website, phone, languages spoken, areas of legal help. Emails and contact
# names are never kept.
import html, json, os, re, sys, time, urllib.request

out = sys.argv[1]
minutes = float(sys.argv[sys.argv.index('--minutes') + 1]) if '--minutes' in sys.argv else 1e9
BASE = 'https://www.immigrationadvocates.org/legaldirectory/'
UA = 'PathwaysUSA-resource-check (pathwaysusacitizenship@gmail.com)'
DELAY = 20
STATES = ('AK AL AR AZ CA CO CT DC DE FL GA HI IA ID IL IN KS KY LA MA MD ME MI MN MO MS MT NC ND NE NH NJ NM NV NY '
          'OH OK OR PA RI SC SD TN TX UT VA VT WA WI WV WY PR GU VI MP AS').split()
EMAIL = re.compile(r'[\w.+-]+@[\w-]+(\.[\w-]+)+')
proxy = os.environ.get('https_proxy') or os.environ.get('HTTPS_PROXY') or ''
if proxy:
    urllib.request.install_opener(urllib.request.build_opener(urllib.request.ProxyHandler({'http': proxy, 'https': proxy})))

state = json.load(open(out)) if os.path.exists(out) else {'pages_done': [], 'org_paths': {}, 'orgs': {}, 'errors': {}}
start, last = time.time(), [0.0]

def save():
    tmp = out + '.tmp'
    json.dump(state, open(tmp, 'w'))
    os.replace(tmp, out)

def get(path):
    wait = DELAY - (time.time() - last[0])
    if wait > 0:
        time.sleep(wait)
    last[0] = time.time()
    req = urllib.request.Request(BASE + path, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode('utf-8', 'replace')

def lines_of(page):
    t = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', page, flags=re.S | re.I)
    t = html.unescape(re.sub(r'<[^>]+>', '\n', t))
    return [l.strip() for l in t.splitlines() if l.strip()]

def field(lines, label, stop_labels):
    if label not in lines:
        return []
    i, vals = lines.index(label) + 1, []
    while i < len(lines) and lines[i] not in stop_labels:
        vals.append(lines[i]); i += 1
    return vals

LABELS = {'Location:', 'Website:', 'Email:', 'Phone:', 'Contact methods:', 'Appointments accepted:', 'Counties served:',
          'Services Provided', 'Areas of immigration legal assistance:', 'Types of immigration legal services provided:',
          'Non-legal services:', 'Populations served:', 'Languages spoken:',
          'Access to a commercial interpreting service or language bank:', 'Fax:', 'Hours:', 'Other locations:'}

def out_of_time():
    return time.time() - start > minutes * 60

# 1. State result pages -> organization page paths.
for st in STATES:
    page_no, total = 1, state.get('last_page', {}).get(st)
    while total is None or page_no <= total:
        key = f'{st}:{page_no}'
        if key not in state['pages_done']:
            if out_of_time():
                save(); print('paused', file=sys.stderr); sys.exit(0)
            try:
                page = get(f'search?state={st}&page={page_no}')
            except Exception as e:
                state['errors'][key] = type(e).__name__; save(); break
            state['errors'].pop(key, None)
            for path in set(re.findall(r'href="/legaldirectory/(organization\.\d+[^"#?]*)"', page)):
                state['org_paths'][path.split('-')[0]] = path
            m = re.search(r'Page \d+ of (\d+)', ' '.join(lines_of(page)))
            total = int(m.group(1)) if m else 1
            state.setdefault('last_page', {})[st] = total
            state['pages_done'].append(key)
            save()
            print(f'{key}/{total} orgs so far {len(state["org_paths"])}', file=sys.stderr, flush=True)
        page_no += 1

# 2. Organization pages.
for oid, path in sorted(state['org_paths'].items()):
    if state['orgs'].get(oid):
        continue  # already read (a failed read is None and is tried again)
    if out_of_time():
        save(); print('paused', file=sys.stderr); sys.exit(0)
    try:
        lines = lines_of(get(path))
        state['errors'].pop(oid, None)
    except Exception as e:
        state['errors'][oid] = type(e).__name__; state['orgs'][oid] = None; save(); continue
    name = ''
    if 'Add Organization' in lines:
        i = lines.index('Add Organization') + 1
        name = lines[i] if i < len(lines) else ''
    clean = lambda vs: [EMAIL.sub('', v).strip() for v in vs if EMAIL.sub('', v).strip()]
    state['orgs'][oid] = {
        'id': oid, 'path': path, 'name': name,
        'location': clean(field(lines, 'Location:', LABELS)),
        'website': (clean(field(lines, 'Website:', LABELS)) or [''])[0],
        'phone': (clean(field(lines, 'Phone:', LABELS)) or [''])[0],
        'languages': ', '.join(clean(field(lines, 'Languages spoken:', LABELS))),
        'legal_areas': ', '.join(clean(field(lines, 'Areas of immigration legal assistance:', LABELS))),
    }
    save()
    if len(state['orgs']) % 25 == 0:
        print(f'orgs {len(state["orgs"])}/{len(state["org_paths"])}', file=sys.stderr, flush=True)

print('DONE', len(state['orgs']), 'organizations', file=sys.stderr)
