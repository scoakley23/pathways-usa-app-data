// "Who Represents Me?" for a split ZIP (Step 4): the street address → state
// and congressional district, through Geocodio. Pure logic shared by the
// Edge Function supabase/functions/district-lookup (tested in
// src/api/districts.test.js). Only the state and district number are read
// from Geocodio's reply: never the names, photos or contacts it also sends.

export const GEOCODIO_URL = 'https://api.geocod.io/v2.1/geocode';

// Matches good enough to trust a district (a whole city or county is not).
const PRECISE = new Set(['rooftop', 'point', 'range_interpolation', 'nearest_rooftop_match', 'intersection', 'street_center']);

export function checkInput({ zip, address } = {}) {
  const z = String(zip || '').trim();
  const a = String(address || '').trim();
  if (!/^\d{5}(-\d{4})?$/.test(z)) return { ok: false, error: 'Please enter a valid 5-digit zip code.' };
  if (a.length < 3 || a.length > 200) return { ok: false, error: 'Please enter your street address.' };
  return { ok: true, zip: z.slice(0, 5), address: a };
}

export function geocodioUrl({ zip, address, key }) {
  const q = new URLSearchParams({ q: `${address}, ${zip}`, fields: 'cd', limit: '1', api_key: key });
  return `${GEOCODIO_URL}?${q.toString()}`;
}

// Geocodio's JSON → { state: 'VA', district: '8' | 'At-large' } or null when
// the address isn't matched precisely or sits on a district line.
export function readGeocodio(body) {
  const result = body?.results?.[0];
  if (!result || !PRECISE.has(result.accuracy_type)) return null;
  const state = String(result.address_components?.state || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(state)) return null;
  const districts = (result.fields?.congressional_districts || []).filter((d) => d && d.district_number !== undefined);
  const sure = districts.length === 1 ? districts[0] : districts.find((d) => Number(d.proportion) === 1);
  if (!sure) return null;
  const n = Number(sure.district_number);
  if (!Number.isInteger(n) || n < 0) return null;
  return { state, district: n === 0 || n === 98 ? 'At-large' : String(n) };
}
