# Add exact coordinates to seed-resources.json with the U.S. Census batch
# geocoder (public business addresses only). Run from the repo root:
#   python3 scripts/resources/geocode_census.py content/resources/seed-resources.json
# A match more than 25 miles from the listing's ZIP is ignored (usually a
# typo in the source), and that place keeps its approximate ZIP-center pin.
import csv, io, json, math, re, sys, urllib.request, uuid
path = sys.argv[1]
recs = json.load(open(path))
zips = json.load(open('src/data/zipCentroids.json'))

buf = io.StringIO(); w = csv.writer(buf)
for i, x in enumerate(recs):
    parts = [p.strip() for p in x['address'].split(',')]
    street = next((p for p in parts if re.match(r'\d', p) and not re.match(r'(?i)p\.?\s*o\.?\s*box', p)), '')
    if street:
        street = re.sub(r'(?i)\s+(suite|ste\.?|room|rm\.?|unit|#|floor|fl\.?)\b.*$', '', street)
        w.writerow([i, street, x['city'], x['state'], x['zip']])

boundary = uuid.uuid4().hex
body = (f'--{boundary}\r\nContent-Disposition: form-data; name="benchmark"\r\n\r\nPublic_AR_Current\r\n'
        f'--{boundary}\r\nContent-Disposition: form-data; name="addressFile"; filename="a.csv"\r\n'
        f'Content-Type: text/csv\r\n\r\n{buf.getvalue()}\r\n--{boundary}--\r\n').encode()
req = urllib.request.Request('https://geocoding.geo.census.gov/geocoder/locations/addressbatch', data=body,
                             headers={'Content-Type': f'multipart/form-data; boundary={boundary}'})
result = urllib.request.urlopen(req, timeout=600).read().decode()

def miles(a, b):
    la1, lo1, la2, lo2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 7917.6 * math.asin(math.sqrt(h))

used = 0
for row in csv.reader(io.StringIO(result)):
    if len(row) < 6 or row[2] != 'Match':
        continue
    x = recs[int(row[0])]
    lng, lat = map(float, row[5].split(','))
    ref = zips.get(x['zip'])
    if ref and miles(ref, (lat, lng)) > 25:
        print('ignored far match:', x['name'], x['zip'], file=sys.stderr)
        continue
    x.update(latitude=round(lat, 6), longitude=round(lng, 6), location_precision='exact')
    used += 1
json.dump(recs, open(path, 'w'), indent=1, ensure_ascii=False)
print(f'{used} exact pins, {len(recs) - used} ZIP-area pins', file=sys.stderr)
