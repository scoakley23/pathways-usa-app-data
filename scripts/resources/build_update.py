# Usage (from the repo root):
#   python3 scripts/resources/build_update.py nld.json sites.json \
#       content/resources/update-2026-10.json content/resources/review-2026-10.csv
#
# Builds one Admin -> Places import file that UPDATES the places already
# imported from seed-resources.json and seed-nld-classes.json:
#   - every place gets a source id (external_id) and a services list;
#   - NLD programs get hours, logo, website, languages and a relevance
#     verdict: K-12 / youth / family-only programs are hidden (not deleted),
#     with the reason in relevance_note;
#   - a DOJ legal organization and an NLD program at the same place (same
#     phone, or same street address and ZIP) become one listing: the DOJ
#     place gains the class services, website and logo, the NLD copy is hidden.
# Inputs: nld.json from harvest_nld.py (public fields only) and sites.json
# from fetch_sites.py (front-page text of each program's website).
# Rules are keyword rules, not AI: every hide/flag reason is listed in the
# review CSV so a person can check it.
import csv, html, json, re, sys, urllib.parse

nld_path, sites_path, out_path, review_path = sys.argv[1:5]
seed_main = json.load(open('content/resources/seed-resources.json'))
seed_nld = json.load(open('content/resources/seed-nld-classes.json'))
nld = {p['slug']: p for p in json.load(open(nld_path)) if p.get('slug')}
sites = json.load(open(sites_path))

def text(v):
    v = html.unescape(re.sub(r'<[^>]+>', ' ', str(v or '')))
    v = re.sub(r'[\w.+-]+@[\w-]+(\.[\w-]+)+', '', v)  # never keep emails
    return re.sub(r'\s+', ' ', v).strip()

YOUTH = re.compile(r"\b(k-?12|kindergarten|elementary|middle school|junior high|high school students|grades? (k|pre-?k|\d)|"
                   r"after[- ]?school|summer (camp|reading)|preschool|pre-?k\b|head start|kids|children'?s? (program|literacy|reading|tutoring)|"
                   r"youth ?build|youth|teens?\b|juvenile|early (childhood|literacy)|homework help|school-age|boys (&|and) girls club|"
                   r"ages? (3|4|5|6|7|8|9|10|11|12) ?(-|to|through) ?(1[0-8]|[5-9])\b|students in grades)", re.I)
ADULT = re.compile(r"\b(adults?|esol|esl|english as a (second|new) language|english language learners?|english learners?|"
                   r"english (classes|conversation|for speakers)|conversation (group|class|circle)s?|immigrants?|refugees?|newcomers?|"
                   r"citizenship|naturali[sz]ation|civics test|ged|hiset|high school equivalency|adult (education|literacy|basic)|"
                   r"literacy (council|volunteers)|18 (years )?(and|or) (older|over)|ages? 1[68]\+|ages? 1[68] and (up|older)|workforce)\b", re.I)
FAMILY = re.compile(r'\bfamily literacy\b|\bparents? and (their )?children\b', re.I)
PARENT_ENGLISH = re.compile(r'\bparents?\b.{0,80}\b(english|esl|esol)\b|\b(english|esl|esol)\b.{0,80}\bparents?\b', re.I)
CITIZEN = re.compile(r'\b(citizenship|naturali[sz]ation|civics test|n-?400)\b', re.I)
ESL = re.compile(r'\b(esol|esl|english as a (second|new) language|english language (learners?|classes)|learn english|english classes)\b', re.I)
CONSULTANT = re.compile(r'\b(immigration consult(ant|ants|ation|ing)|notari[oa]s?|notary public|tax and immigration)\b', re.I)
LANGS = ['Spanish', 'Arabic', 'Chinese', 'Mandarin', 'Cantonese', 'Vietnamese', 'Korean', 'Tagalog', 'French', 'Haitian Creole',
         'Portuguese', 'Russian', 'Ukrainian', 'Polish', 'Somali', 'Amharic', 'Tigrinya', 'Swahili', 'Nepali', 'Burmese', 'Karen',
         'Dari', 'Pashto', 'Farsi', 'Persian', 'Urdu', 'Hindi', 'Bengali', 'Punjabi', 'Gujarati', 'Japanese', 'Hmong', 'Khmer',
         'Lao', 'Thai', 'Italian', 'German', 'Greek', 'Turkish', 'Hebrew', 'Kinyarwanda', 'Kirundi', 'Oromo']
LANG_RX = '|'.join(re.escape(l) for l in LANGS)
# Only explicit statements about teaching or staff, e.g. "classes taught in
# Spanish and Arabic", "bilingual Hmong/English", "staff speak Somali".
LANG_STMT = re.compile(rf"\b(?:taught in|instruction in|offered in|classes in|tutoring in|bilingual(?: in)?|"
                       rf"staff (?:also )?speaks?|we (?:also )?speak|se habla)\s+((?:(?:{LANG_RX})(?:,? (?:and|or|&) |, |/)?)+)", re.I)

def languages_in(t):
    found = []
    for m in LANG_STMT.finditer(t):
        for l in LANGS:
            if re.search(rf'\b{re.escape(l)}\b', m.group(1), re.I) and l not in found:
                found.append(l)
    return found

def phone10(p):
    d = re.sub(r'\D', '', str(p or ''))
    return d[-10:] if len(d) >= 10 else ''

def street_key(r):
    a = str(r.get('address') or '').lower().split(',')[0]
    a = re.sub(r'\b(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|suite|ste|floor|fl)\b\.?', '', a)
    return re.sub(r'[^a-z0-9]', '', a) + '|' + str(r.get('zip') or '')

STOP = set('inc the of and for at in a an on to llc corp co services service center centre program programs project '
           'english esl esol literacy learning education class classes community international institute office '
           'immigration immigrant legal ministry ministries church catholic charities'.split())

STATES = ('alabama alaska arizona arkansas california colorado connecticut delaware florida georgia hawaii idaho illinois '
          'indiana iowa kansas kentucky louisiana maine maryland massachusetts michigan minnesota mississippi missouri '
          'montana nebraska nevada hampshire jersey mexico york carolina dakota ohio oklahoma oregon pennsylvania rhode '
          'island tennessee texas utah vermont virginia washington wisconsin wyoming puerto rico guam').split()
GEO = set(STATES + 'north south east west northern southern eastern western central new county valley city greater '
                   'metro metropolitan area region bay lake river mountain high country upper lower'.split())

def same_org(a, b, place=''):
    # Two listings are the same organization only if their names share a
    # distinctive word: not a stop word, place name, or "(... office)" label,
    # so two groups in one building or one town aren't merged.
    skip = STOP | GEO | set(re.findall(r'[a-z0-9]+', place.lower()))
    words = lambda s: {w for w in re.findall(r'[a-z0-9]+', re.sub(r'\([^)]*\)', ' ', s).lower()) if len(w) > 2 and w not in skip}
    return bool(words(a) & words(b))

def verdict(name, desc, site, services):
    """Returns (keep, note). note is '' for a clear keep."""
    keep, note = _verdict(name, desc, site, services)
    # Public libraries and family centers listed for English usually serve
    # adults too, even when their description leads with children's programs:
    # flag them for a person instead of hiding them.
    if not keep and re.search(r'\b(library|libraries|family (resource|center))\b', name, re.I) and \
            not re.search(r'\b(imagination library|kids|children|preschool|early)\b', name, re.I):
        return True, note.replace('program', 'program?') + ' - check'
    return keep, note

def _verdict(name, desc, site, services):
    n_youth = bool(YOUTH.search(name))
    n_adult = bool(ADULT.search(name)) or bool(re.search(r'\b(college|adult|community education|continuing education)\b', name, re.I))
    d_youth, d_adult = len(YOUTH.findall(desc)), len(ADULT.findall(desc))
    s_youth, s_adult = len(YOUTH.findall(site)), len(ADULT.findall(site))
    adult_explicit = re.search(r'\badults?\b|\besol\b|\besl\b|\bell\b|\bimmigrants?\b|\brefugees?\b|\bcitizenship\b|'
                               r'speakers of other languages|english language learners?|english as a (second|new) language', desc + ' ' + name, re.I)
    family_only = bool(FAMILY.search(name + ' ' + desc)) and not PARENT_ENGLISH.search(desc + ' ' + site) and not adult_explicit
    if n_youth and not n_adult:
        # A school name is often just where an adult class meets.
        if adult_explicit or s_adult >= 2:
            return True, 'Name sounds like a youth program, but it mentions serving adults - check'
        return False, "Children's / youth program (name)"
    if n_adult:
        return True, ''
    if family_only:
        return False, 'Family literacy program without adult English classes'
    if d_youth and not d_adult and not adult_explicit:
        return False, "Children's / youth program (description)"
    if adult_explicit or d_adult > d_youth:
        return True, ''
    if not desc and not site:
        return True, 'No description or website to confirm it serves adults - check'
    # A website front page alone (e.g. a public library's) often talks about
    # children's programs, so it can only flag a place, never hide it.
    if s_youth > 2 * max(1, s_adult) and not d_adult:
        return True, "Website talks mostly about children's programs - check"
    if s_adult or d_adult:
        return True, ''
    return True, 'Could not confirm it serves adults - check'

TODAY = '2026-10-21'
rows, review = [], []

# USCIS and DOJ places, as first imported, plus ids and services.
doj_by_phone, doj_by_street = {}, {}
for r in seed_main:
    row = dict(r)
    if r['category'] == 'uscis':
        slug = r['source_url'].rstrip('/').rsplit('/', 1)[-1]
        row['external_id'] = f'uscis:{slug}'
    else:
        row['external_id'] = 'doj:' + re.sub(r'[^a-z0-9]+', '-', f"{r['name']} {r['address']} {r['zip']}".lower()).strip('-')[:120]
        if phone10(r['phone']):
            doj_by_phone.setdefault(phone10(r['phone']), row)
        doj_by_street.setdefault(street_key(r), row)
    row['services'] = [r['category']]
    rows.append(row)

counts = {'kept': 0, 'hidden': 0, 'flagged': 0, 'merged': 0, 'logo': 0, 'languages': 0, 'hours': 0}
for r in seed_nld:
    slug = r['source_url'].rstrip('/').rsplit('/', 1)[-1]
    p = nld.get(slug)
    row = dict(r)
    if not p:
        row.update(is_active=False, relevance_note='No longer listed in the National Literacy Directory')
        rows.append(row); counts['hidden'] += 1
        review.append([r['name'], r['city'], r['state'], 'hidden', row['relevance_note'], r['source_url'], r.get('website', '')])
        continue
    site_info = sites.get(str(p['id']), {})
    site = text(' '.join([site_info.get('title', ''), site_info.get('meta', ''), site_info.get('text', '')])) if site_info.get('status') == 'ok' else ''
    desc = text(p.get('other_information'))
    services_cb = set(str(p.get('education_services_cb') or '').replace(' ', '').split(','))
    keep, note = verdict(r['name'], desc, site, services_cb)

    services = [r['category']]
    if '14' in services_cb or CITIZEN.search(desc):
        services.append('citizenship_class')
    if '6' in services_cb or ESL.search(desc):
        services.append('esl')
    # "Free legal help" is only for DOJ-recognized organizations (from the DOJ
    # roster, or merged with one below), never inferred from website text.
    if CONSULTANT.search(desc) or CONSULTANT.search(site):
        note = (note + '; ' if note else '') + 'Mentions immigration consulting or notario services - check it is not a notario'
    if re.search(r'\blibrary\b', r['name'], re.I):
        services.append('library')
    services = list(dict.fromkeys(services))

    langs = languages_in(desc) or languages_in(site)
    if 'Instruction in Spanish' in str(p.get('instruction_type_cb') or '') and 'Spanish' not in langs:
        langs.insert(0, 'Spanish')
    hours = text(p.get('hours_of_operation'))[:300]
    logo = f"https://www.nld.org/uploads/programs/logo/{p['id']}/{urllib.parse.quote(p['logo'])}" if p.get('logo') else ''
    website = r.get('website') or (site_info.get('url', '') if site_info.get('status') == 'ok' else '')

    offers = [x for x in ['citizenship classes' if 'citizenship_class' in services else '',
                          'English classes' if 'esl' in services else '',
                          'immigration legal help' if 'legal' in services else ''] if x]
    description = 'Offers ' + (', '.join(offers[:-1]) + ' and ' + offers[-1] if len(offers) > 1 else offers[0]) + '.'
    if 'Distance learning' in str(p.get('instruction_type_cb') or ''):
        description += ' Online classes available.'
    if langs:
        description += f" Some teaching in {', '.join(langs)}."
    description += ' Call to ask about class times.'
    row.update(external_id=f"nld:{p['id']}", services=services, languages=langs, hours=hours, logo_url=logo, description=description,
               website=website, is_active=keep, relevance_note=note)
    counts['logo'] += bool(logo); counts['languages'] += bool(langs); counts['hours'] += bool(hours)

    # Same place as a DOJ-recognized organization? Merge into the DOJ listing.
    doj = (phone10(r['phone']) and doj_by_phone.get(phone10(r['phone'])))
    doj = doj if doj and doj['zip'] == r['zip'] else doj_by_street.get(street_key(r))
    if doj and not same_org(doj['name'], r['name'], f"{r['city']} {doj['city']}"):
        doj = None
    if keep and doj:
        doj['services'] = list(dict.fromkeys(doj['services'] + [s for s in services if s != 'library']))
        doj['website'] = doj.get('website') or website
        doj['logo_url'] = doj.get('logo_url') or logo
        doj['hours'] = doj.get('hours') or hours
        doj['languages'] = list(dict.fromkeys((doj.get('languages') or []) + langs))
        doj['description'] = 'DOJ-recognized organization. Its accredited representatives can give immigration legal help. Also offers ' + \
            ' and '.join(x for x in ['citizenship classes' if 'citizenship_class' in services else '', 'English classes' if 'esl' in services else ''] if x) + \
            '. Call to ask about services, class times, and cost.'
        row.update(is_active=False, relevance_note=f"Same place as the DOJ listing \"{doj['name']}\"; merged there")
        counts['merged'] += 1
        review.append([r['name'], r['city'], r['state'], 'merged', row['relevance_note'], r['source_url'], website])
    elif not keep:
        counts['hidden'] += 1
        review.append([r['name'], r['city'], r['state'], 'hidden', note, r['source_url'], website])
    elif note:
        counts['flagged'] += 1
        review.append([r['name'], r['city'], r['state'], 'shown, check', note, r['source_url'], website])
    else:
        counts['kept'] += 1
    rows.append(row)

for row in rows:
    row.setdefault('relevance_note', '')
    row.setdefault('last_verified', TODAY)

json.dump(rows, open(out_path, 'w'), indent=1, ensure_ascii=False)
with open(review_path, 'w', newline='') as f:
    w = csv.writer(f)
    w.writerow(['name', 'city', 'state', 'result', 'reason', 'nld_page', 'website'])
    w.writerows(sorted(review, key=lambda x: (x[3], x[2], x[1])))
print(json.dumps(counts), len(rows), 'rows', file=sys.stderr)
