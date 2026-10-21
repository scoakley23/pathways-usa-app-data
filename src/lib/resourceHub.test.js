import { describe, it, expect } from 'vitest';
import {
  normalizeZip, zipToLatLng, distanceMiles, formatDistance, nearestResources,
  directionsUrl, safeWebsite, telHref, parseCsv, cleanResourceRow, resourceKey, isValidLatLng, isPoBoxOnly,
  placeServices, safeLogoUrl, planImport,
} from './resourceHub';

// Fake test places only.
const ZIPS = { '02138': [42.38, -71.134], '10001': [40.751, -73.997], '00601': [18.18, -66.75] };
const BOSTON = { lat: 42.3601, lng: -71.0589 };
const place = (over) => ({ name: 'Test Place', category: 'legal', latitude: 42.37, longitude: -71.1, is_active: true, ...over });

describe('normalizeZip', () => {
  it('keeps 5 digits, drops +4, restores lost leading zeros', () => {
    expect(normalizeZip('02138')).toBe('02138');
    expect(normalizeZip('02138-1234')).toBe('02138');
    expect(normalizeZip(2138)).toBe('02138');
    expect(normalizeZip(' 601 ')).toBe('00601');
  });
  it('rejects junk', () => {
    expect(normalizeZip('')).toBe('');
    expect(normalizeZip('12')).toBe('');
    expect(normalizeZip('1234567')).toBe('');
    expect(normalizeZip(null)).toBe('');
  });
});

describe('zipToLatLng', () => {
  it('looks up the table', () => {
    expect(zipToLatLng('02138', ZIPS)).toEqual({ lat: 42.38, lng: -71.134 });
    expect(zipToLatLng('99999', ZIPS)).toBeNull();
  });
  it('falls back to the nearest ZIP in the same area for P.O.-box ZIPs', () => {
    expect(zipToLatLng('02140', ZIPS)).toEqual({ lat: 42.38, lng: -71.134 });
    expect(zipToLatLng('02238', ZIPS)).toBeNull(); // different first three digits
    expect(zipToLatLng('02138', null)).toBeNull();
  });
});

describe('distance', () => {
  it('Boston to New York is about 190 miles', () => {
    const d = distanceMiles(BOSTON, { lat: 40.7128, lng: -74.006 });
    expect(d).toBeGreaterThan(185);
    expect(d).toBeLessThan(195);
  });
  it('formats', () => {
    expect(formatDistance(0.05)).toBe('Less than 0.1 mi');
    expect(formatDistance(3.456)).toBe('3.5 mi');
    expect(formatDistance(42.6)).toBe('43 mi');
    expect(formatDistance(undefined)).toBe('');
  });
});

describe('isValidLatLng', () => {
  it('rejects null island and out-of-range values', () => {
    expect(isValidLatLng(0, 0)).toBe(false);
    expect(isValidLatLng(91, 0)).toBe(false);
    expect(isValidLatLng('42', -71)).toBe(false);
    expect(isValidLatLng(42, -71)).toBe(true);
  });
});

describe('nearestResources', () => {
  const list = [
    place({ name: 'Far', latitude: 40.75, longitude: -73.99 }),
    place({ name: 'Near', latitude: 42.361, longitude: -71.06 }),
    place({ name: 'Mid', latitude: 42.4, longitude: -71.2 }),
    place({ name: 'Hidden', is_active: false, latitude: 42.36, longitude: -71.06 }),
    place({ name: 'Class', category: 'esl', latitude: 42.36, longitude: -71.06 }),
    place({ name: 'No coords', latitude: null, longitude: null }),
  ];
  it('sorts nearest first, inside the radius, skipping hidden and coordinate-less places', () => {
    const out = nearestResources(list, BOSTON, { categories: ['legal'], radiusMiles: 50 });
    expect(out.map((r) => r.name)).toEqual(['Near', 'Mid']);
    expect(out[0].distance).toBeLessThan(1);
  });
  it('filters by category and limit', () => {
    expect(nearestResources(list, BOSTON, { categories: ['esl'] }).map((r) => r.name)).toEqual(['Class']);
    expect(nearestResources(list, BOSTON, { categories: ['legal', 'esl'], radiusMiles: 500, limit: 2 })).toHaveLength(2);
  });
  it('returns nothing without a location', () => {
    expect(nearestResources(list, null)).toEqual([]);
  });
});

describe('links', () => {
  it('directions use only the place address', () => {
    const url = directionsUrl({ name: 'X', address: '1 Main St', city: 'Testville', state: 'MA', zip: '02138' });
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=1%20Main%20St%2C%20Testville%2C%20MA%2002138');
  });
  it('only allows http(s) websites', () => {
    expect(safeWebsite('example.org')).toBe('https://example.org/');
    expect(safeWebsite('javascript:alert(1)')).toBe('');
    expect(safeWebsite('someone@example.org')).toBe('');
    expect(safeWebsite('')).toBe('');
  });
  it('builds tel links', () => {
    expect(telHref('(555) 010-0000')).toBe('tel:5550100000');
    expect(telHref('n/a')).toBe('');
  });
});

describe('import', () => {
  it('parses CSV with quotes and commas', () => {
    const rows = parseCsv('Name,Category,ZIP\r\n"Test, Center",legal,02138\n"Say ""hi""",esl,10001\n\n');
    expect(rows).toEqual([
      { name: 'Test, Center', category: 'legal', zip: '02138' },
      { name: 'Say "hi"', category: 'esl', zip: '10001' },
    ]);
  });
  it('cleans a row and fills coordinates from the ZIP', () => {
    const { record } = cleanResourceRow(
      { name: ' Test Clinic ', category: 'Legal', zip: '2138', languages: 'English; Spanish', cost: 'Low cost', website: 'example.org' },
      ZIPS,
    );
    expect(record).toMatchObject({
      name: 'Test Clinic', category: 'legal', zip: '02138', latitude: 42.38, longitude: -71.134,
      location_precision: 'zip', languages: ['English', 'Spanish'], cost: 'low_cost', website: 'https://example.org/', is_active: true,
    });
  });
  it('keeps given coordinates', () => {
    const { record } = cleanResourceRow({ name: 'A', category: 'uscis', latitude: '42.1', longitude: '-71.2' }, ZIPS);
    expect(record).toMatchObject({ latitude: 42.1, longitude: -71.2, location_precision: 'exact' });
  });
  it('explains bad rows', () => {
    expect(cleanResourceRow({ category: 'legal', zip: '02138' }, ZIPS).error).toMatch(/name/);
    expect(cleanResourceRow({ name: 'A', category: 'bank', zip: '02138' }, ZIPS).error).toMatch(/category/);
    expect(cleanResourceRow({ name: 'A', category: 'legal', zip: '55555' }, ZIPS).error).toMatch(/coordinates/);
  });
  it('matches duplicates by name, address and ZIP', () => {
    expect(resourceKey({ name: 'Test  Clinic', address: '1 Main St.', zip: '2138' }))
      .toBe(resourceKey({ name: 'test clinic', address: '1 main st', zip: '02138-0001' }));
    expect(resourceKey({ name: 'Test Clinic', address: '1 Main St', zip: '02138' }))
      .not.toBe(resourceKey({ name: 'Test Clinic', address: '2 Oak Ave', zip: '02138' }));
  });
  it('spots P.O. box addresses', () => {
    expect(isPoBoxOnly('P.O. Box 12')).toBe(true);
    expect(isPoBoxOnly('PO Box 12')).toBe(true);
    expect(isPoBoxOnly('12 Box Elder St')).toBe(false);
  });
});

describe('services', () => {
  it('lists the main category first, then other valid services', () => {
    expect(placeServices({ category: 'legal', services: ['esl', 'legal', 'bogus'] })).toEqual(['legal', 'esl']);
    expect(placeServices({ category: 'esl' })).toEqual(['esl']);
  });
  it('a place shows up under any of its services', () => {
    const both = place({ name: 'Both', category: 'legal', services: ['legal', 'esl'], latitude: 42.361, longitude: -71.06 });
    expect(nearestResources([both], BOSTON, { categories: ['esl'] }).map((r) => r.name)).toEqual(['Both']);
    expect(nearestResources([both], BOSTON, { categories: ['uscis'] })).toEqual([]);
  });
  it('cleans services, logo, hours and id on import', () => {
    const { record } = cleanResourceRow({
      name: 'Test', category: 'legal', zip: '02138', services: 'esl; citizenship_class; nope',
      logo_url: 'http://example.org/logo.png', hours: ' Mon-Fri 9-5 ', external_id: 'test:1',
    }, ZIPS);
    expect(record).toMatchObject({ services: ['legal', 'esl', 'citizenship_class'], logo_url: '', hours: 'Mon-Fri 9-5', external_id: 'test:1' });
    expect(safeLogoUrl('https://example.org/logo.png')).toBe('https://example.org/logo.png');
  });
});

describe('planImport', () => {
  const saved = [
    { id: 'a', name: 'Test Clinic', category: 'legal', address: '1 Main St', zip: '02138', latitude: 42.38, longitude: -71.134, location_precision: 'zip', is_active: true },
    { id: 'b', name: 'Kids Club', category: 'esl', address: '2 Oak Ave', zip: '02138', latitude: 42.38, longitude: -71.134, location_precision: 'zip', is_active: true, external_id: 'test:kids' },
  ];
  it('updates matched places with only the changed fields, and adds new ones', () => {
    const plan = planImport([
      { name: 'Test Clinic', category: 'legal', services: 'legal;esl', address: '1 Main St', zip: '02138', website: 'example.org' },
      { name: 'Renamed Kids Club', category: 'esl', address: '2 Oak Ave', zip: '02138', external_id: 'test:kids', is_active: false },
      { name: 'New Place', category: 'esl', zip: '02138' },
      { name: 'New Place', category: 'esl', zip: '02138' },
      { name: '', category: 'esl', zip: '02138' },
    ], saved, ZIPS);
    expect(plan.creates.map((r) => r.name)).toEqual(['New Place']);
    expect(plan.duplicates).toBe(1);
    expect(plan.problems).toHaveLength(1);
    expect(plan.hiding).toBe(1);
    const a = plan.updates.find((u) => u.id === 'a');
    expect(a).toMatchObject({ services: ['legal', 'esl'], website: 'https://example.org/' });
    expect(a).not.toHaveProperty('name');
    expect(plan.updates.find((u) => u.id === 'b')).toMatchObject({ name: 'Renamed Kids Club', is_active: false });
  });
  it("keeps an admin's check over the file's show/hide", () => {
    const plan = planImport(
      [{ name: 'Kids Club', category: 'esl', address: '2 Oak Ave', zip: '02138', external_id: 'test:kids', is_active: false, relevance_note: 'Could not confirm - check', hours: '9-5' }],
      [{ ...saved[1], is_active: true, relevance_note: 'Checked: shown' }], ZIPS);
    expect(plan.hiding).toBe(0);
    expect(plan.updates[0]).toMatchObject({ hours: '9-5' });
    expect(plan.updates[0]).not.toHaveProperty('is_active');
    expect(plan.updates[0]).not.toHaveProperty('relevance_note');
  });
  it('counts unchanged places', () => {
    const plan = planImport([{ name: 'Test Clinic', category: 'legal', services: ['legal'], address: '1 Main St', zip: '02138', external_id: '' }],
      [{ ...saved[0], services: ['legal'], languages: [], phone: '', website: '', logo_url: '', hours: '', cost: '', description: '', source: '', source_url: '', last_verified: '', city: '', state: '', external_id: '' }], ZIPS);
    expect(plan).toMatchObject({ unchanged: 1, updates: [], creates: [] });
  });
});
