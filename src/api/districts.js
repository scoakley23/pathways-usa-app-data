// "Who Represents Me?" street-address lookup (Step 4), for a ZIP the Census
// table (src/lib/zipDistricts.js) can't settle on its own: one that spans
// districts, or isn't in the table. Returns { state, district } only; the
// screen checks it with validateLocation() and saves only those two.
//
// Switch on (Supabase): the Edge Function `district-lookup` (Geocodio; the
// key stays on the server). Switch off (Base44): the AI with a web search,
// as before. The ZIP and address are used for this lookup only, never saved.
import { DATA_PROVIDER } from '@/api/db';
import { base44 } from '@/api/base44Client';
import { getSupabase } from '@/api/supabaseClient';

export const LOCATION_SCHEMA = {
  type: 'object',
  properties: {
    state: { type: 'string', description: 'Two-letter USPS code of the state, D.C. or territory' },
    district: { type: 'string', description: 'Congressional district number, or "At-large"' },
    district_ambiguous: { type: 'boolean' },
  },
  required: ['state', 'district', 'district_ambiguous'],
};

export function locationPrompt(zip, address) {
  return `Find the state (or D.C. / U.S. territory) and the U.S. congressional district for the U.S. street address "${address}, ${zip}".
Use only official sources (census.gov, house.gov).
Use the full street address to find the exact congressional district. If you can't tell, set district_ambiguous to true. Do not guess.
Return ONLY:
- state: the two-letter USPS code (for example TX, DC, PR)
- district: the district number (for example "2"), or "At-large" for a state, D.C. or territory with one seat
- district_ambiguous: true or false
Do not return any names of people. Do not repeat the ZIP code or address.`;
}

export const NOT_CONFIRMED = "We couldn't confirm your district. Please check the address and try again.";

export function createDistrictsApi({ provider = DATA_PROVIDER, base44: b44 = base44, supabase = getSupabase } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);
  return {
    // → { state, district } or throws Error(NOT_CONFIRMED).
    async lookupAddress({ zip, address }) {
      if (provider === 'supabase') {
        const { data, error } = await sb().functions.invoke('district-lookup', { body: { zip, address } });
        if (error || !data?.state || !data?.district) throw new Error(NOT_CONFIRMED);
        return { state: data.state, district: data.district };
      }
      const data = await b44.integrations.Core.InvokeLLM({
        prompt: locationPrompt(zip, address),
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: LOCATION_SCHEMA,
      });
      if (!data?.state || !data?.district || data.district_ambiguous) throw new Error(NOT_CONFIRMED);
      return { state: data.state, district: data.district };
    },
  };
}

export const districts = createDistrictsApi();
