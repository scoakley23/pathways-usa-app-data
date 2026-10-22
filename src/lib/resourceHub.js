// Resource Hub ("Help near you"): pure logic for the map and list of
// community resources (ESL classes, free legal help, USCIS offices, ...).
//
// Privacy: the learner's location (from the browser or a typed ZIP) is only
// ever an argument to these functions. It is never saved, never put in a URL
// or query, and never sent to the AI. Distances are worked out on the device.

export const RESOURCE_CATEGORIES = [
  { id: 'legal', label: 'Free legal help', tone: 'red' },
  { id: 'esl', label: 'English classes', tone: 'teal' },
  { id: 'citizenship_class', label: 'Citizenship classes', tone: 'green' },
  { id: 'uscis', label: 'USCIS offices', tone: 'blue' },
  { id: 'library', label: 'Libraries', tone: 'navy' },
  { id: 'other', label: 'Other help', tone: 'navy' },
];

export const CATEGORY_IDS = RESOURCE_CATEGORIES.map((c) => c.id);

// Map pin color per main category: the same colors as the category tags
// (tailwind pw tokens: red-ink, teal-ink, green-ink, blue-ink, navy).
export const PIN_COLORS = {
  legal: '#B53A32',
  esl: '#1E6B66',
  citizenship_class: '#2E7D4F',
  uscis: '#1F4C8F',
  library: '#14264A',
  other: '#14264A',
};

// National search tools for what the map doesn't list yet. Learners search
// on these sites directly; nothing from this app is sent to them.
export const DIRECTORY_LINKS = [
  {
    label: 'National Literacy Directory',
    url: 'https://www.nld.org/programs',
    description: 'English, citizenship, and adult education classes near you. Call 877-389-6874 for help.',
  },
  {
    label: 'ImmigrationLawHelp.org',
    url: 'https://www.immigrationlawhelp.org',
    description: 'Free and low-cost nonprofit immigration legal services, by state and language.',
  },
  {
    label: 'CareerOneStop — Find libraries',
    url: 'https://www.careeronestop.org/LocalHelp/CommunityServices/find-libraries.aspx',
    description: 'Public libraries near you. Many have free English classes, computers, and citizenship books.',
  },
  {
    label: 'USCIS — Find a field office',
    url: 'https://www.uscis.gov/about-us/find-a-uscis-office/field-offices',
    description: 'The official USCIS office list. Go only when you have an appointment notice.',
  },
];

export const COST_LABELS = { free: 'Free', low_cost: 'Low cost', varies: 'Cost varies' };

export function categoryById(id) {
  return RESOURCE_CATEGORIES.find((c) => c.id === id) || RESOURCE_CATEGORIES[RESOURCE_CATEGORIES.length - 1];
}

// "02138", "02138-1234", " 2138 " (leading zero dropped by a spreadsheet) -> "02138".
export function normalizeZip(value) {
  const digits = String(value ?? '').trim().split('-')[0].replace(/\D/g, '');
  if (digits.length < 3 || digits.length > 5) return '';
  return digits.padStart(5, '0');
}

export function isValidLatLng(lat, lng) {
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

// Coordinates for a ZIP from the bundled Census ZIP table (on device).
// P.O.-box and single-building ZIPs (e.g. 44199) aren't in the Census table,
// so those fall back to the numerically nearest ZIP with the same first three
// digits, which is almost always the same town.
export function zipToLatLng(zip, table) {
  const z = normalizeZip(zip);
  if (!z || !table) return null;
  let hit = table[z];
  if (!hit) {
    const n = Number(z);
    let best = Infinity;
    for (let d = 1; d < 100 && best === Infinity; d++) {
      for (const c of [n - d, n + d]) {
        const key = String(c).padStart(5, '0');
        if (key.slice(0, 3) === z.slice(0, 3) && table[key]) { hit = table[key]; best = d; break; }
      }
    }
  }
  return hit ? { lat: hit[0], lng: hit[1] } : null;
}

// The ZIP table is ~250 KB gzipped, so it is loaded only when needed.
let zipTablePromise = null;
export function loadZipTable() {
  if (!zipTablePromise) {
    zipTablePromise = import('@/data/zipCentroids.json')
      .then((m) => m.default || m)
      .catch((err) => {
        zipTablePromise = null;
        throw err;
      });
  }
  return zipTablePromise;
}

const EARTH_RADIUS_MILES = 3958.8;
const toRad = (deg) => (deg * Math.PI) / 180;

export function distanceMiles(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(miles) {
  if (miles == null || !Number.isFinite(miles)) return '';
  if (miles < 0.1) return 'Less than 0.1 mi';
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

// Everything a place offers: its main category first, then any other
// services (e.g. a legal clinic that also teaches English).
export function placeServices(r) {
  const all = [r?.category, ...(Array.isArray(r?.services) ? r.services : [])];
  return [...new Set(all.filter((s) => CATEGORY_IDS.includes(s)))];
}

// Active resources with usable coordinates, offering any of the chosen
// categories, within `radiusMiles` of `origin`, nearest first. Each result
// gets `distance`.
export function nearestResources(resources, origin, { categories = CATEGORY_IDS, radiusMiles = 50, limit = 30 } = {}) {
  if (!origin || !isValidLatLng(origin.lat, origin.lng)) return [];
  const wanted = new Set(categories);
  return (resources || [])
    .filter((r) => r && r.is_active !== false && placeServices(r).some((s) => wanted.has(s)) && isValidLatLng(r.latitude, r.longitude))
    .map((r) => ({ ...r, distance: distanceMiles(origin, { lat: r.latitude, lng: r.longitude }) }))
    .filter((r) => r.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance || String(a.name).localeCompare(String(b.name)))
    .slice(0, limit);
}

export function fullAddress(r) {
  const cityLine = [r.city, [r.state, r.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return [r.address, cityLine].filter(Boolean).join(', ');
}

// Directions are looked up by the place's public address only — never the
// learner's location — so the maps app asks for the starting point itself.
export function directionsUrl(r) {
  const destination = fullAddress(r) || r.name;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function telHref(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  return digits.length >= 7 ? `tel:${digits}` : '';
}

// Only http(s) links are shown, so an imported row can't add a javascript: link.
export function safeWebsite(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(withScheme);
    // An email typed as a website ("name@example.org") parses as a URL with
    // a user name; drop it rather than link to it.
    if (parsed.username || parsed.password) return '';
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '';
  } catch {
    return '';
  }
}

// ---- Admin import -------------------------------------------------------

export const IMPORT_COLUMNS = [
  'name', 'category', 'services', 'address', 'city', 'state', 'zip', 'latitude', 'longitude',
  'phone', 'website', 'logo_url', 'hours', 'languages', 'cost', 'description', 'source', 'source_url',
  'last_verified', 'external_id', 'relevance_note', 'is_active',
];

// Logos are shown as images, so only https links are kept.
export function safeLogoUrl(url) {
  const value = safeWebsite(url);
  return value.startsWith('https://') ? value : '';
}

const splitList = (v) => (Array.isArray(v) ? v : String(v || '').split(/[;|,]/)).map((x) => String(x).trim()).filter(Boolean);

// Small CSV parser (quotes, escaped quotes, commas and newlines in quotes).
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const src = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ''));
  if (!nonEmpty.length) return [];
  const header = nonEmpty[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return nonEmpty.slice(1).map((cells) => Object.fromEntries(header.map((h, i) => [h, (cells[i] ?? '').trim()])));
}

const toNumber = (v) => {
  if (v === '' || v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

// Turns one imported row (CSV or JSON) into a clean record, or explains why
// it can't be used. Coordinates come from the row, or else from its ZIP
// (marked location_precision "zip" so admins know the pin is approximate).
export function cleanResourceRow(row, zipTable) {
  const r = row || {};
  const name = String(r.name || '').trim();
  const category = String(r.category || '').trim().toLowerCase();
  if (!name) return { error: 'Missing name' };
  if (!CATEGORY_IDS.includes(category)) return { error: `Unknown category "${r.category || ''}"` };

  const zip = normalizeZip(r.zip);
  let latitude = toNumber(r.latitude);
  let longitude = toNumber(r.longitude);
  let location_precision = 'exact';
  if (!isValidLatLng(latitude, longitude)) {
    const fromZip = zipToLatLng(zip, zipTable);
    if (!fromZip) return { error: 'No coordinates and no known ZIP' };
    latitude = fromZip.lat;
    longitude = fromZip.lng;
    location_precision = 'zip';
  }

  const languages = splitList(r.languages);
  const services = [...new Set([category, ...splitList(r.services).map((s) => s.toLowerCase())])]
    .filter((s) => CATEGORY_IDS.includes(s));
  const cost = String(r.cost || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

  return {
    record: {
      name,
      category,
      services,
      address: String(r.address || '').trim(),
      city: String(r.city || '').trim(),
      state: String(r.state || '').trim().toUpperCase().slice(0, 2),
      zip,
      latitude,
      longitude,
      location_precision: r.location_precision === 'zip' ? 'zip' : location_precision,
      phone: String(r.phone || '').trim(),
      website: safeWebsite(r.website),
      logo_url: safeLogoUrl(r.logo_url),
      hours: String(r.hours || '').trim().slice(0, 300),
      languages,
      cost: COST_LABELS[cost] ? cost : '',
      description: String(r.description || '').trim(),
      source: String(r.source || '').trim(),
      source_url: safeWebsite(r.source_url),
      last_verified: String(r.last_verified || '').trim(),
      external_id: String(r.external_id || '').trim(),
      relevance_note: String(r.relevance_note || '').trim().slice(0, 300),
      is_active: r.is_active === false || String(r.is_active).toLowerCase() === 'false' ? false : true,
    },
  };
}

// Same place = same name, street address and ZIP (case, spacing and
// punctuation ignored). One organization can have two offices in one ZIP.
const keyPart = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export function resourceKey(r) {
  return `${keyPart(r.name)}|${keyPart(r.address)}|${normalizeZip(r.zip)}`;
}

// Compares an import file with the places already saved. A row matches an
// existing place by its source id (external_id) or, for places saved before
// ids existed, by name + street address + ZIP. Matched places get only the
// fields that changed; unmatched rows are new. Nothing is saved here.
const UPDATABLE = [
  'name', 'category', 'services', 'address', 'city', 'state', 'zip', 'latitude', 'longitude', 'location_precision',
  'phone', 'website', 'logo_url', 'hours', 'languages', 'cost', 'description', 'source', 'source_url',
  'last_verified', 'external_id', 'relevance_note', 'is_active',
];
const sameValue = (a, b) => {
  const norm = (v) => (v === undefined || v === null ? '' : Array.isArray(v) ? JSON.stringify(v) : String(v));
  return norm(a) === norm(b) || (Array.isArray(b) && b.length === 0 && (a === undefined || a === null));
};
export function planImport(rows, existing, zipTable) {
  const byId = new Map();
  const byKey = new Map();
  for (const e of existing || []) {
    if (e.external_id) byId.set(e.external_id, e);
    byKey.set(resourceKey(e), e);
  }
  const plan = { creates: [], updates: [], unchanged: 0, hiding: 0, problems: [], duplicates: 0 };
  const seen = new Set();
  (rows || []).forEach((row, i) => {
    const { record, error } = cleanResourceRow(row, zipTable);
    if (error) { plan.problems.push(`Row ${i + 2}: ${error}`); return; }
    const match = (record.external_id && byId.get(record.external_id)) || byKey.get(resourceKey(record));
    const seenKey = match ? `id:${match.id}` : record.external_id || resourceKey(record);
    if (seen.has(seenKey)) { plan.duplicates++; return; }
    seen.add(seenKey);
    if (!match) { plan.creates.push(record); return; }
    const changes = {};
    // An admin's check ("Checked: ...") wins over the file's show/hide call.
    const checked = /^Checked:/.test(match.relevance_note || '');
    for (const f of UPDATABLE) {
      if (checked && (f === 'is_active' || f === 'relevance_note')) continue;
      if (!sameValue(match[f], record[f])) changes[f] = record[f];
    }
    if (!Object.keys(changes).length) { plan.unchanged++; return; }
    if (changes.is_active === false && match.is_active !== false) plan.hiding++;
    plan.updates.push({ id: match.id, ...changes });
  });
  return plan;
}

// A P.O. box has no door to give directions to.
export function isPoBoxOnly(address) {
  return /^\s*(p\.?\s*o\.?\s*box|post office box)\b/i.test(String(address || ''));
}
