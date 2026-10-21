# Usage: python3 scripts/resources/extract_occam.py page.html occam_offices.json
#   page.html = saved https://occamimmigration.com/resources/uscis-field-offices
# Pulls the USCIS field-office records (name, address, city, state, ZIP,
# phone) out of the page's embedded Next.js data.
import json, re, sys
src, out = sys.argv[1], sys.argv[2]
html = open(src).read()
chunks = re.findall(r'self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)', html)
payload = ''.join(json.loads(c) for c in chunks)
dec, offices = json.JSONDecoder(), {}
for m in re.finditer(r'\{"slug":"', payload):
    try:
        obj, _ = dec.raw_decode(payload, m.start())
    except ValueError:
        continue
    if 'address' in obj:
        offices.setdefault(obj['slug'], {k: obj.get(k) for k in ['slug', 'name', 'address', 'city', 'state', 'zip', 'phone']})
json.dump(list(offices.values()), open(out, 'w'), indent=1)
print(len(offices), 'field offices', file=sys.stderr)
