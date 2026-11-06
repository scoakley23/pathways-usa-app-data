import { describe, it, expect } from 'vitest';
import { locationFields, locationFromProfile, profileLocationPatch } from './learnerLocation';

// Fake profiles only.
describe('learner location', () => {
  it('reads the saved state and district', () => {
    expect(locationFromProfile({ representative_state: 'Texas', representative_district: '2' })).toEqual({ state: 'Texas', district: '2' });
    expect(locationFromProfile({ representative_state: 'Puerto Rico' })).toEqual({ state: 'Puerto Rico', district: 'At-large' });
    expect(locationFromProfile({ representative_state: 'Texas', representative_district: '99' })).toBe(null);
    expect(locationFromProfile({})).toBe(null);
  });

  it('saves only the state and district, and clears old names', () => {
    expect(locationFields({ state: 'Texas', district: '2' })).toEqual({
      representative_state: 'Texas', representative_district: '2', representative_data: null,
    });
  });

  it('keeps an old state and district, and drops the old names', () => {
    const old = { representative_data: { state: 'Texas', governor: 'Pat Example', senators: [{ name: 'Sam One' }], representative: { name: 'Robin Rep', district: 'TX-2' } } };
    expect(profileLocationPatch(old)).toEqual({ representative_data: null, representative_state: 'Texas', representative_district: '2' });
    const atLarge = { representative_data: { state: 'Wyoming', representative: { district: 'At-Large' } } };
    expect(profileLocationPatch(atLarge).representative_district).toBe('At-large');
  });

  it('clears everything when the old district was a guess or unknown', () => {
    expect(profileLocationPatch({ representative_data: { state: 'Texas', district_ambiguous: true, representative: { district: '2' } } }))
      .toEqual({ representative_data: null });
    expect(profileLocationPatch({ representative_data: { state: 'Atlantis' } })).toEqual({ representative_data: null });
  });

  it('leaves new profiles alone', () => {
    expect(profileLocationPatch({ representative_state: 'Texas', representative_district: '2' })).toBe(null);
    expect(profileLocationPatch({ representative_data: null })).toBe(null);
  });
});
