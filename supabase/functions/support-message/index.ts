// Supabase Edge Function `support-message` (Step 5): "Talk to a person".
// Signed-in learners only. Emails the learner's message to the team inbox
// through Resend, with the learner's own login email as Reply-To (read here,
// never sent by the phone). Emails, phone numbers, A-numbers and SSNs are
// removed from the message first. Nothing is saved except a count for the
// daily limit (3 a day: take_ai_request('support'), counts only).
//
// Setup (you run these; never paste a key into a chat):
//   supabase secrets set RESEND_API_KEY=...
//   supabase functions deploy support-message
//
// POST { message } → { ok: true } | { error } (429 { error: 'limit' })
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { sendEmail } from '../_shared/email.js';
import { readSupportMessage, supportEmail } from '../_shared/supportMessage.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  try {
    const asCaller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await asCaller.auth.getUser();
    const replyTo = (user?.email || '').toLowerCase().trim();
    if (!user || !replyTo) return json({ error: 'Please sign in.' }, 401);

    const raw = await req.text();
    if (raw.length > 8000) return json({ error: 'too long' }, 413);
    let body: unknown = {};
    try { body = JSON.parse(raw); } catch (_e) { return json({ error: 'bad request' }, 400); }
    const read = readSupportMessage(body);
    if (!read.ok) return json({ error: read.error }, 400);

    const key = Deno.env.get('RESEND_API_KEY');
    if (!key) return json({ error: 'Email is not set up yet.' }, 503);

    const { data: allowed, error: limitError } = await asCaller.rpc('take_ai_request', { p_kind: 'support' });
    if (limitError) {
      console.error('support-message: limit check failed', limitError.code);
      return json({ error: 'Something went wrong. Please try again.' }, 500);
    }
    if (!allowed) return json({ error: 'limit' }, 429);

    await sendEmail({ key, ...supportEmail({ text: read.text, replyTo }) });
    return json({ ok: true });
  } catch (error) {
    console.error('support-message failed', (error as Error)?.message?.slice(0, 40) ?? ''); // never the message or address
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
