// Supabase Edge Function `district-lookup` (Step 4): "Who Represents Me?"
// for a ZIP that spans more than one congressional district. Signed-in
// learners only. Sends the street address and ZIP to Geocodio once and
// returns ONLY { state, district }. The address is never logged or saved,
// and Geocodio's names, photos and contacts are dropped here.
//
// Setup (you run these; never paste the key into a chat):
//   supabase secrets set GEOCODIO_API_KEY=...
//   supabase functions deploy district-lookup
//
// POST { zip, address } → { state, district } | { error }
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { checkInput, geocodioUrl, readGeocodio } from '../_shared/districtLookup.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const NOT_CONFIRMED = "We couldn't confirm your district. Please check the address and try again.";

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const asCaller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await asCaller.auth.getUser();
    if (!user) return json({ error: 'Please sign in.' }, 401);

    const input = checkInput(await req.json().catch(() => ({})));
    if (!input.ok) return json({ error: input.error }, 400);

    const key = Deno.env.get('GEOCODIO_API_KEY');
    if (!key) return json({ error: NOT_CONFIRMED }, 503);

    const res = await fetch(geocodioUrl({ zip: input.zip, address: input.address, key }));
    if (!res.ok) {
      console.error('district-lookup: Geocodio status', res.status); // never the address
      return json({ error: NOT_CONFIRMED }, 502);
    }
    const found = readGeocodio(await res.json());
    return found ? json(found) : json({ error: NOT_CONFIRMED }, 404);
  } catch (_error) {
    console.error('district-lookup failed'); // never the address
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
