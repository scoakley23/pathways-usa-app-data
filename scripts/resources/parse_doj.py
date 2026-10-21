# Usage: python3 scripts/resources/parse_doj.py roster.txt doj.json
#   roster.txt = `pdftotext -layout` of "Organizations and Representatives, Listed by State"
#   from https://www.justice.gov/eoir/recognition-accreditation-roster-reports
# Parse the DOJ EOIR "Recognized Organizations ... by State and City" roster
# (pdftotext -layout output) into office records. Organizations only; the
# accredited-representative section (individual people) is ignored.
import re, json, sys
src, out = sys.argv[1], sys.argv[2]
lines = open(src).read().replace('\f', '\n').split('\n')
DATES = re.compile(r'\s{2,}\d\d/\d\d/\d\d\s+\d\d/\d\d/\d\d\*?.*$')
CSZ = re.compile(r'^(.+?),\s*([A-Z]{2})\s+(\d{4,5})(?:-?\d{4})?\s*$')
PHONE = re.compile(r'^\(?\d{3}\)?[\s.-]*\d{3}[\s.-]*\d{4}(\s*(x|ext\.?)\s*\d+)?\s*$', re.I)
SKIP = re.compile(r'^(Recognized|Organization|Date|Disclaimer|•)', re.I)
recs, name_buf, state, city_hdr, i = [], [], '', '', 0
while i < len(lines):
    raw = lines[i]; s = raw.strip()
    if 'Accredited Representative' in raw and 'Expiration' in raw:
        break  # start of the individual-representative section
    indent = len(raw) - len(raw.lstrip())
    if not s or SKIP.match(s) or s.startswith('(Pending') or 'Report Last Updated' in s or 'Roster' in s and indent > 10:
        i += 1; continue
    if indent >= 25:  # centered state / city headers
        if s.isupper(): state = s
        else: city_hdr = s
        name_buf = [] if s.isupper() else name_buf
        i += 1; continue
    if re.search(r'Office\s*$', s) and name_buf:
        name = re.sub(r'\s+', ' ', re.sub(r'\(Pending Renewal\)', '', ' '.join(name_buf))).strip()
        label = s
        addr, j, csz = [], i + 1, None
        while j < len(lines) and j < i + 8:
            t = lines[j].strip()
            if not t: j += 1; continue
            m = CSZ.match(t)
            if m: csz = m; j += 1; break
            addr.append(t); j += 1
        phone = ''
        while j < len(lines) and not lines[j].strip(): j += 1
        if j < len(lines) and PHONE.match(lines[j].strip()):
            phone = lines[j].strip(); j += 1
        if csz:
            recs.append({'org': name, 'office': label, 'address': ', '.join(addr), 'city': csz.group(1).strip(),
                         'state': csz.group(2), 'zip': csz.group(3).zfill(5), 'phone': phone, 'state_header': state, 'city_header': city_hdr})
        else:
            print('NO CSZ:', name, '|', label, '|', addr, file=sys.stderr)
        name_buf = []; i = j; continue
    m = DATES.search(raw)
    if m:
        name_buf = [raw[:m.start()].strip()]
    elif indent == 0 and not CSZ.match(s) and not PHONE.match(s):
        # wrapped name line, or an org repeated without dates for another office
        if name_buf and not DATES.search(lines[i-1] if i else '') and lines[i-1].strip() == '':
            name_buf = [s]
        else:
            name_buf.append(s)
    i += 1
json.dump(recs, open(out, 'w'), indent=1)
print(len(recs), 'offices;', len({r['org'] for r in recs}), 'orgs', file=sys.stderr)
