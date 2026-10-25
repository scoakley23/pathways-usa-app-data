# Usage (from the repo root):
#   python3 scripts/resources/find_logos.py content/resources/update-2026-10.json logos.json
#
# Finds a logo for each place that has a website but no logo. Resumable: sites
# already in logos.json are skipped (add --retry-errors to re-read failed ones).
# One page per site (plus the site's home page if the given page has no logo),
# robots.txt respected, 15 s timeouts. Keyword rules, not AI. A logo is, in order:
#   1. the logo the page declares for its organization (schema.org JSON-LD "logo")
#   2. the first <img> marked "logo" (class, id, alt or file name), not in the
#      footer and not a social, partner, funder, award or seal image
#   3. the site's app icon (apple-touch-icon, or an icon of 96 px or more)
# It is kept only if it loads over https as an image at least 32 px on its
# shorter side (SVG accepted). Government sites (.gov, .mil) and images named
# "seal" are skipped: the app shows no seals.
# Output: {"<website>": {"logo": url, "how": "jsonld"|"img"|"icon"} | {"logo": "", "error": "..."}}
import concurrent.futures as cf, html, io, json, os, re, sys, threading, urllib.parse, urllib.request, urllib.robotparser

from PIL import Image

src, out = sys.argv[1], sys.argv[2]
retry = '--retry-errors' in sys.argv
proxy = os.environ.get('https_proxy') or os.environ.get('HTTPS_PROXY') or ''
if proxy:
    urllib.request.install_opener(urllib.request.build_opener(urllib.request.ProxyHandler({'https': proxy})))
UA = 'PathwaysUSA-resource-check (pathwaysusacitizenship@gmail.com)'
SKIP_IMG = re.compile(r'facebook|twitter|instagram|linkedin|youtube|tiktok|social|partner|sponsor|funder|donor|badge|award|'
                      r'guidestar|candid|charity-?navigator|seal|united-?way|bbb|accredit|footer|google|apple-pay|paypal|'
                      r'loader|spinner|placeholder|pixel|blank|spacer|share|og-?image|hero|banner|featured|'
                      r'white|revers|\brev\b|inverse|knockout', re.I)
# Image hosts that serve sites' own uploads.
CDN = re.compile(r'(wixstatic|squarespace(-cdn)?|sqspcdn|website-files|webflow|wp\.com|cloudfront|amazonaws|googleusercontent|'
                 r'imgix|ctfassets|cdn-website|godaddysites|img1\.wsimg|weebly|editmysite|shopify|cloudinary|hubspot|'
                 r'b-cdn|azureedge|akamaized|fbcdn-x|finalsite|edlio|schoolwires|blackboard|thrillshare|cdn\.)', re.I)


def https(url):
    url = (url or '').strip()
    if not url or '@' in url.split('/')[0]:
        return ''
    if not re.match(r'^https?://', url, re.I):
        url = 'https://' + url
    return re.sub(r'^http://', 'https://', url, flags=re.I)


def get(url, limit=600_000, accept='text/html,*/*;q=0.5'):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': accept})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.geturl(), r.headers.get('Content-Type', '').lower(), r.read(limit)


robots, robots_lock = {}, threading.Lock()


def allowed(url):
    p = urllib.parse.urlsplit(url)
    key = p.netloc.lower()
    with robots_lock:
        rp = robots.get(key)
    if rp is None:
        rp = urllib.robotparser.RobotFileParser()
        try:
            rp.parse(get(f'https://{p.netloc}/robots.txt', 200_000)[2].decode('utf-8', 'replace').splitlines())
        except Exception:
            rp.parse([])
        with robots_lock:
            robots[key] = rp
    return rp.can_fetch(UA, url)


def attrs(tag):
    return {k.lower(): html.unescape(v) for k, _, v in re.findall(r'([\w:-]+)\s*=\s*(["\'])(.*?)\2', tag, re.S)}


def jsonld_logos(page):
    found = []
    for block in re.findall(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>', page, re.S | re.I):
        try:
            data = json.loads(block.strip())
        except Exception:
            continue
        stack = [data]
        while stack:
            d = stack.pop()
            if isinstance(d, list):
                stack.extend(d)
            elif isinstance(d, dict):
                types = d.get('@type', '')
                types = ' '.join(types) if isinstance(types, list) else str(types)
                logo = d.get('logo')
                if logo and re.search(r'Organization|NGO|LocalBusiness|Library|School|Corporation|GovernmentOrganization|Place', types):
                    if isinstance(logo, dict):
                        logo = logo.get('url') or logo.get('contentUrl') or ''
                    if isinstance(logo, str):
                        found.append(logo)
                stack.extend(v for v in d.values() if isinstance(v, (list, dict)))
    return found


def img_logos(page):
    # Drop the footer, where funder and partner logos live.
    page = re.sub(r'<footer\b.*?</footer>', ' ', page, flags=re.S | re.I)
    found = []
    for tag in re.findall(r'<img\b[^>]*>', page, re.I):
        a = attrs(tag)
        url = a.get('src', '')
        if not url or url.startswith('data:'):
            url = a.get('data-src') or a.get('data-lazy-src') or (a.get('srcset') or a.get('data-srcset') or '').split(' ')[0]
        marks = ' '.join([a.get('class', ''), a.get('id', ''), a.get('alt', ''), url.rsplit('/', 1)[-1]])
        if url and 'logo' in marks.lower() and not SKIP_IMG.search(marks + ' ' + url):
            found.append(url)
    return found


def icon_logos(page):
    found = []
    for tag in re.findall(r'<link\b[^>]*>', page, re.I):
        a = attrs(tag)
        rel, href = a.get('rel', '').lower(), a.get('href', '')
        if not href:
            continue
        if 'apple-touch-icon' in rel:
            found.insert(0, href)
        elif 'icon' in rel:
            sizes = [int(n) for n in re.findall(r'(\d+)x\d+', a.get('sizes', ''))]
            if (sizes and max(sizes) >= 96) or href.lower().endswith('.svg'):
                found.append(href)
    return found


def base(host):
    parts = host.lower().split(':')[0].removeprefix('www.').split('.')
    return '.'.join(parts[-3:] if len(parts) > 2 and len(parts[-2]) <= 3 and len(parts[-1]) == 2 else parts[-2:])


def image_ok(url, page_url):
    if not url.startswith('https://') or SKIP_IMG.search(url.rsplit('/', 1)[-1]):
        return False
    host = urllib.parse.urlsplit(url).netloc.lower()
    if re.search(r'\.(gov|mil)$', host):
        return False
    # Only the site's own images (or its image CDN), never another organization's.
    if base(host) != base(urllib.parse.urlsplit(page_url).netloc) and not CDN.search(host):
        return False
    try:
        final, ctype, data = get(url, 3_000_000, 'image/*')
    except Exception:
        return False
    if not final.startswith('https://') or len(data) < 200:
        return False
    if 'svg' in ctype or data.lstrip()[:200].lower().find(b'<svg') >= 0:
        return b'<svg' in data[:2000].lower()
    if not ctype.startswith('image/'):
        return False
    try:
        im = Image.open(io.BytesIO(data))
        if min(im.size) < 32:
            return False
        # A white logo made for a dark header would vanish on the white card.
        rgba = im.convert('RGBA').resize((48, 48))
        seen = [(r, g, b) for r, g, b, a in rgba.get_flattened_data() if a > 128]
        if len(seen) < 48 * 48 * 0.1:
            return False
        light = sum(1 for r, g, b in seen if min(r, g, b) > 225) / len(seen)
        return not (light > 0.9 and len(seen) < 48 * 48 * 0.95)
    except Exception:
        return False


def find(site):
    url = https(site)
    if not url:
        return {'logo': '', 'error': 'no website'}
    host = urllib.parse.urlsplit(url).netloc.lower().split(':')[0]
    if re.search(r'\.(gov|mil)$', host):
        return {'logo': '', 'error': 'government site'}
    pages = [url]
    root = f'https://{urllib.parse.urlsplit(url).netloc}/'
    if url.rstrip('/') != root.rstrip('/'):
        pages.append(root)
    error = ''
    for page_url in pages:
        try:
            if not allowed(page_url):
                error = 'robots.txt'
                continue
            final, ctype, body = get(page_url)
        except Exception as e:
            error = str(e)[:80]
            continue
        page = body.decode('utf-8', 'replace')
        cands = [('jsonld', c) for c in jsonld_logos(page) if not SKIP_IMG.search(c.rsplit('/', 1)[-1])]
        cands += [('img', c) for c in img_logos(page)[:3]] + [('icon', c) for c in icon_logos(page)[:2]]
        for how, c in cands:
            logo = https(urllib.parse.urljoin(final, c.strip()))
            if image_ok(logo, final):
                return {'logo': logo, 'how': how}
        error = 'no logo found'
    return {'logo': '', 'error': error}


rows = json.load(open(src))
sites = sorted({r['website'] for r in rows if r.get('is_active', True) and r.get('website') and not r.get('logo_url')
                and not str(r.get('external_id', '')).startswith('uscis:')})
result = json.load(open(out)) if os.path.exists(out) else {}
todo = [s for s in sites if s not in result or (retry and not result[s].get('logo'))]
print(f'{len(todo)} sites to read', file=sys.stderr)
lock = threading.Lock()
with cf.ThreadPoolExecutor(8) as ex:
    for i, (site, res) in enumerate(zip(todo, ex.map(find, todo)), 1):
        with lock:
            result[site] = res
            if i % 50 == 0 or i == len(todo):
                json.dump(result, open(out, 'w'), indent=0)
                print(f'{i}/{len(todo)}', file=sys.stderr)
ok = sum(1 for s in sites if result.get(s, {}).get('logo'))
print(f'logos for {ok} of {len(sites)} sites', file=sys.stderr)
