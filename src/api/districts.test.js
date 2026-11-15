// The street-address lookup for split ZIPs (src/api/districts.js) and the
// Edge Function's Geocodio logic (supabase/functions/_shared/districtLookup.js).
// Fake addresses and fake replies only.
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/base44Client', () => ({ base44: { integrations: { Core: {} } } }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => null }));
vi.mock('@/api/auth', () => ({ auth: {}, AUTH_PROVIDER: 'base44' }));

const { createDistrictsApi, NOT_CONFIRMED } = await import('./districts');
const { checkInput, geocodioUrl, readGeocodio } = await import('../../supabase/functions/_shared/districtLookup.js');

const ADDRESS = { zip: '75001', address: '100 Fake St' };

describe('lookupAddress, switch on (Supabase Edge Function)', () => {
  it('sends only the zip and address, returns only state and district', async () => {
    const invoke = vi.fn(async () => ({ data: { state: 'TX', district: '24', extra: 'ignored' }, error: null }));
    const api = createDistrictsApi({ provider: 'supabase', supabase: { functions: { invoke } } });
    expect(await api.lookupAddress(ADDRESS)).toEqual({ state: 'TX', district: '24' });
    expect(invoke).toHaveBeenCalledWith('district-lookup', { body: ADDRESS });
  });

  it('a failed lookup is "not confirmed"', async () => {
    const invoke = vi.fn(async () => ({ data: null, error: new Error('404') }));
    const api = createDistrictsApi({ provider: 'supabase', supabase: { functions: { invoke } } });
    await expect(api.lookupAddress(ADDRESS)).rejects.toThrow(NOT_CONFIRMED);
  });
});

describe('lookupAddress, switch off (Base44 AI, as before)', () => {
  it('asks the AI for state and district only; an unsure answer is not confirmed', async () => {
    const InvokeLLM = vi.fn(async () => ({ state: 'TX', district: '32', district_ambiguous: false }));
    const api = createDistrictsApi({ provider: 'base44', base44: { integrations: { Core: { InvokeLLM } } } });
    expect(await api.lookupAddress(ADDRESS)).toEqual({ state: 'TX', district: '32' });
    expect(InvokeLLM.mock.calls[0][0].prompt).toMatch(/Do not return any names/);
    InvokeLLM.mockResolvedValueOnce({ state: 'TX', district: '32', district_ambiguous: true });
    await expect(api.lookupAddress(ADDRESS)).rejects.toThrow(NOT_CONFIRMED);
  });
});

describe('district-lookup Edge Function logic', () => {
  const reply = (over = {}) => ({
    results: [{
      accuracy_type: 'rooftop',
      address_components: { state: 'VA' },
      fields: { congressional_districts: [{ district_number: 8, proportion: 1, current_legislators: [{ bio: { last_name: 'Someone' } }] }] },
      ...over,
    }],
  });

  it('checks the input', () => {
    expect(checkInput({ zip: '75001', address: '100 Fake St' })).toEqual({ ok: true, zip: '75001', address: '100 Fake St' });
    expect(checkInput({ zip: '7500', address: '100 Fake St' }).ok).toBe(false);
    expect(checkInput({ zip: '75001', address: '' }).ok).toBe(false);
    expect(checkInput({ zip: '75001', address: 'x'.repeat(201) }).ok).toBe(false);
  });

  it('asks Geocodio for the district field only', () => {
    const url = new URL(geocodioUrl({ zip: '75001', address: '100 Fake St', key: 'test-key' }));
    expect(url.origin + url.pathname).toBe('https://api.geocod.io/v2.1/geocode');
    expect(url.searchParams.get('fields')).toBe('cd');
    expect(url.searchParams.get('q')).toBe('100 Fake St, 75001');
  });

  it('returns only state and district, never names', () => {
    expect(readGeocodio(reply())).toEqual({ state: 'VA', district: '8' });
    expect(readGeocodio(reply({ fields: { congressional_districts: [{ district_number: 0, proportion: 1 }] } }))).toEqual({ state: 'VA', district: 'At-large' });
    expect(readGeocodio(reply({ address_components: { state: 'DC' }, fields: { congressional_districts: [{ district_number: 98, proportion: 1 }] } }))).toEqual({ state: 'DC', district: 'At-large' });
  });

  it('a vague match or an address on a district line is not confirmed', () => {
    expect(readGeocodio(reply({ accuracy_type: 'place' }))).toBeNull();
    expect(readGeocodio(reply({ fields: { congressional_districts: [{ district_number: 8, proportion: 0.6 }, { district_number: 11, proportion: 0.4 }] } }))).toBeNull();
    expect(readGeocodio({ results: [] })).toBeNull();
    expect(readGeocodio(null)).toBeNull();
  });
});
