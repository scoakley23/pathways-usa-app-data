# Usage: python3 scripts/resources/fetch_sites.py nld.json sites.json [--retry-errors]
#   --retry-errors: keep sites.json's good results and re-read only the failed sites.
# Reads the front page of each program's own website (one request per site,
# robots.txt respected, 15 s timeout, first 400 KB only) and keeps the page
# title, meta description and the start of the visible text, with emails
# removed. Used only to judge relevance and services (build_update.py).
import concurrent.futures as cf, html, json, os, re, sys, urllib.parse, urllib.request, urllib.robotparser

src, out = sys.argv[1], sys.argv[2]
retry_only = '--retry-errors' in sys.argv
# Send http:// through the same proxy as https:// when only one is configured.
proxy = os.environ.get('https_proxy') or os.environ.get('HTTPS_PROXY') or os.environ.get('http_proxy') or ''
if proxy:
    urllib.request.install_opener(urllib.request.build_opener(urllib.request.ProxyHandler({'http': proxy, 'https': proxy})))
UA = 'PathwaysUSA-resource-check (pathwaysusacitizenship@gmail.com)'
EMAIL = re.compile(r'[\w.+-]+@[\w-]+(\.[\w-]+)+')

def norm(url):
    url = (url or '').strip()
    if not url or '@' in url.split('/')[0]:
        return ''
    if not re.match(r'^https?://', url, re.I):
        url = 'http://' + url
    return url

def get(url, limit=400_000):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'text/html,*/*;q=0.5'})
    with urllib.request.urlopen(req, timeout=15) as r:
        ctype = r.headers.get('Content-Type', '')
        return r.geturl(), r.status, ctype, r.read(limit).decode('utf-8', 'replace')

def allowed(url):
    parts = urllib.parse.urlsplit(url)
    rp = urllib.robotparser.RobotFileParser()
    try:
        _, _, _, txt = get(f'{parts.scheme}://{parts.netloc}/robots.txt', 100_000)
        rp.parse(txt.splitlines())
    except Exception:
        return True  # no robots.txt
    return rp.can_fetch(UA, url)

def text_of(page):
    title = re.search(r'<title[^>]*>(.*?)</title>', page, re.S | re.I)
    meta = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']*)', page, re.I)
    body = re.sub(r'<(script|style|noscript|svg)[^>]*>.*?</\1>', ' ', page, flags=re.S | re.I)
    body = html.unescape(re.sub(r'<[^>]+>', ' ', body))
    clean = lambda s: EMAIL.sub('', re.sub(r'\s+', ' ', html.unescape(s or ''))).strip()
    return clean(title.group(1) if title else ''), clean(meta.group(1) if meta else ''), clean(body)[:6000]

def one(p):
    url = norm(p.get('website_url'))
    if not url:
        return p['id'], {'status': 'no_website'}
    try:
        if not allowed(url):
            return p['id'], {'status': 'robots_disallowed', 'url': url}
        try:
            final, code, ctype, page = get(url)
        except Exception:
            # Many small sites only answer on the other scheme.
            other = re.sub(r'^https?://', 'https://' if url.lower().startswith('http://') else 'http://', url, flags=re.I)
            final, code, ctype, page = get(other)
        if 'html' not in ctype.lower():
            return p['id'], {'status': 'not_html', 'url': final}
        title, meta, body = text_of(page)
        return p['id'], {'status': 'ok', 'url': final, 'title': title, 'meta': meta, 'text': body}
    except Exception as e:
        return p['id'], {'status': 'error', 'url': url, 'error': type(e).__name__}

progs = json.load(open(src))
results = {}
if retry_only:
    results = {k: v for k, v in json.load(open(out)).items() if v['status'] != 'error'}
    progs = [p for p in progs if str(p['id']) not in results]
    print(f'retrying {len(progs)} failed sites', file=sys.stderr, flush=True)
with cf.ThreadPoolExecutor(max_workers=8) as ex:
    for i, (pid, res) in enumerate(ex.map(one, progs), 1):
        results[str(pid)] = res
        if i % 200 == 0:
            print(f'{i}/{len(progs)}', file=sys.stderr, flush=True)
json.dump(results, open(out, 'w'))
from collections import Counter
print('DONE', Counter(r['status'] for r in results.values()), file=sys.stderr)
