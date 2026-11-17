// Supabase Edge Function `ai` (Step 4): every live AI request the app makes
// when the Supabase switch is on: Ask Amio, checking a spoken civics answer,
// scoring an interview answer, the "do you understand the question" check,
// and "Explain it simply". Signed-in learners only.
//
// The phone sends { kind, input }: plain data, never instructions. The shared
// code (aiServer.generated.js, built from src/lib/aiServer.js) confirms the
// question against the app's content and writes the fixed instructions; then
// one request is counted against the learner's daily limit
// (take_ai_request(), migration 20261117000001_ai_usage.sql) and sent to
// Claude. Only the checked result goes back. Questions, answers and what the
// learner said are never logged or saved here.
//
// Setup (you run these; never paste a key into a chat):
//   supabase secrets set ANTHROPIC_API_KEY=...
//   supabase secrets set AI_MODEL=claude-sonnet-5-5     (optional; the default)
//   supabase secrets set AI_EFFORT=low                  (optional; low|medium|high)
//   supabase functions deploy ai
// After the monthly officeholder update: npm run ai:server, then deploy again.
//
// POST { kind, input } → { result } | { error } (429 { error: 'limit', message })
import Anthropic from 'npm:@anthropic-ai/sdk@0.137.0';
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { AI_LIMIT_MESSAGE, prepareRequest, readReply } from '../_shared/aiServer.generated.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const DEFAULT_MODEL = 'claude-sonnet-5-5';
// Models whose refusals can be answered by a fallback model on the server
// (Haiku 5.5 has none).
const FALLBACK_MODELS = new Set(['claude-sonnet-5-5', 'claude-opus-5-5']);
type Effort = 'low' | 'medium' | 'high';
const EFFORTS = new Set<string>(['low', 'medium', 'high']);
const MAX_BODY = 8_000; // characters

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  try {
    const asCaller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await asCaller.auth.getUser();
    if (!user) return json({ error: 'Please sign in.' }, 401);

    const raw = await req.text();
    if (raw.length > MAX_BODY) return json({ error: 'too long' }, 413);
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch (_e) {
      return json({ error: 'bad request' }, 400);
    }

    // Content is public to read, so the learner's own client can look it up.
    const lookup = {
      civics: async (question: string) => {
        const { data, error } = await asCaller.from('civics_questions').select('question, answer').eq('question', question).limit(5);
        if (error) throw error;
        return data ?? [];
      },
      interview: async (question: string) => {
        const { data, error } = await asCaller.from('interview_questions').select('question, expected_response, response_type, section').eq('question', question).limit(1);
        if (error) throw error;
        return data ?? [];
      },
    };
    const prepared = await prepareRequest(body, { lookup, today: new Date() });
    if (!prepared.ok) return json({ error: prepared.error }, prepared.status);

    const { data: allowed, error: limitError } = await asCaller.rpc('take_ai_request', { p_kind: prepared.group });
    if (limitError) {
      console.error('ai: limit check failed', limitError.code);
      return json({ error: 'Something went wrong. Please try again.' }, 500);
    }
    if (!allowed) return json({ error: 'limit', message: AI_LIMIT_MESSAGE }, 429);

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) return json({ error: 'AI is not set up yet.' }, 503);
    const model = Deno.env.get('AI_MODEL') || DEFAULT_MODEL;
    const effortSetting = Deno.env.get('AI_EFFORT');
    const effort = effortSetting && EFFORTS.has(effortSetting) ? (effortSetting as Effort) : null;
    const client = new Anthropic({ apiKey, timeout: 60_000, maxRetries: 2 });

    const params = {
      model,
      max_tokens: 8000,
      messages: [{ role: 'user' as const, content: prepared.prompt }],
      output_config: {
        format: { type: 'json_schema' as const, schema: prepared.schema },
        ...(effort ? { effort } : {}),
      },
    };
    const message = FALLBACK_MODELS.has(model)
      ? await client.beta.messages.create({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
      : await client.messages.create(params);

    if (message.stop_reason === 'refusal' || message.stop_reason === 'max_tokens') {
      console.error('ai: no answer', prepared.kind, message.stop_reason);
      return json({ error: 'No answer this time. Please try again.' }, 502);
    }
    const textBlock = message.content.find((b: { type: string }) => b.type === 'text') as { text: string } | undefined;
    const result = readReply(prepared.schema, textBlock?.text ?? '');
    if (!result) {
      console.error('ai: unreadable reply', prepared.kind);
      return json({ error: 'No answer this time. Please try again.' }, 502);
    }
    return json({ result });
  } catch (error) {
    const status = (error as { status?: number })?.status;
    console.error('ai failed', status ?? 'no status'); // never the request text
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
