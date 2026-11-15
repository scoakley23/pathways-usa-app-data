// "Who Represents Me?" on the device (Step 4): a ZIP code → its state and
// congressional district, from the Census table in src/data/zipDistricts.json
// (built by scripts/districts/build-zip-districts.mjs). Nothing is sent
// anywhere. The table is loaded only when someone looks up a ZIP.
//
// Results:
//   { state: 'TX', district: '24' }  one district (or "At-large")
//   { state: 'TX', split: true }     the ZIP spans districts: ask for the street address
//   { split: true }                  spans states (rare): ask for the street address
//   null                             not a ZIP area the Census lists (e.g. PO boxes only)

// { "TX": { "24": "75001 75002 …" } } → Map(zip → [[state, district], …]).
export function buildZipIndex(table) {
  const index = new Map();
  for (const [state, districts] of Object.entries(table?.states || {})) {
    for (const [district, list] of Object.entries(districts)) {
      for (const zip of list.split(' ')) {
        if (!zip) continue;
        if (!index.has(zip)) index.set(zip, []);
        index.get(zip).push([state, district]);
      }
    }
  }
  return index;
}

export function districtFromIndex(index, zip) {
  const five = String(zip || '').trim().slice(0, 5);
  if (!/^\d{5}$/.test(five)) return null;
  const parts = index.get(five);
  if (!parts?.length) return null;
  if (parts.length === 1) return { state: parts[0][0], district: parts[0][1] };
  const states = new Set(parts.map(([s]) => s));
  return states.size === 1 ? { state: parts[0][0], split: true } : { split: true };
}

let indexPromise = null;
function loadIndex() {
  if (!indexPromise) {
    indexPromise = import('@/data/zipDistricts.json')
      .then((m) => buildZipIndex(m.default || m))
      .catch((err) => { indexPromise = null; throw err; });
  }
  return indexPromise;
}

export async function districtForZip(zip) {
  return districtFromIndex(await loadIndex(), zip);
}

export async function zipTableInfo() {
  const m = await import('@/data/zipDistricts.json');
  return (m.default || m).meta;
}
