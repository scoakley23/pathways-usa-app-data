// The server half of the AI requests (Step 4): what the `ai` Edge Function
// runs before it calls the model. Bundled into
// supabase/functions/_shared/aiServer.generated.js by
// `npm run ai:server` (a test fails when the bundle is out of date), so the
// server and the app use the very same code.
//
// The phone sends { kind, input }. Here the input is checked (aiRequests.js),
// the question data is confirmed against the app's own content, and the fixed
// instructions are built. The phone never sends instructions, and a request
// about a question the app doesn't have is refused.
import { buildRequest } from './aiRequests';
import { buildCivicsBankBlock, numbersCoverBank } from './civicsBank';
import { N400_SECTIONS } from '../components/n400/n400Content';
import questions2025 from '../../content/civics/questions-2025.json';
import numbers2025 from '../../content/civics/numbers-2025.json';

export { AI_LIMITS, AI_LIMIT_MESSAGE, readReply } from './aiRequests';

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();

// The official 2025 list for Ask Amio, built once.
export const CIVICS_BANK = {
  block: buildCivicsBankBlock(questions2025, numbers2025),
  numbered: numbersCoverBank(questions2025, numbers2025),
};

// N-400 guide questions the practice round asks (the officer's phrasings),
// with the team's plain meaning.
const N400_PHRASINGS = new Map(
  N400_SECTIONS.flatMap((s) => s.questions || [])
    .filter((q) => q.status === 'approved')
    .flatMap((q) => (q.officerPhrasings || []).map((p) => [clean(p), clean(q.meaning)])),
);
export const n400Meaning = (question) => N400_PHRASINGS.get(clean(question));

const refused = (status, error) => ({ ok: false, status, error });

// Swaps the phone's question data for the app's own copy, or refuses.
// lookup.civics(question) → rows { question, answer }; lookup.interview(question)
// → rows { question, expected_response, response_type, section }.
async function confirmContent(kind, input, lookup) {
  const question = clean(input?.question);
  if (!question) return refused(400, 'fields');
  if (kind === 'civics_check' || kind === 'explain') {
    const rows = await lookup.civics(question);
    const row = rows.find((r) => clean(r.answer) === clean(input.answer)) || rows[0];
    if (!row) return refused(404, 'unknown question');
    return { ok: true, input: { ...input, question: row.question, answer: row.answer } };
  }
  if (kind === 'interview') {
    const [row] = await lookup.interview(question);
    if (!row) return refused(404, 'unknown question');
    return { ok: true, input: { ...input, question: row.question, expected_response: row.expected_response || '', response_type: row.response_type || '' } };
  }
  if (kind === 'understanding') {
    const meaning = n400Meaning(question);
    if (meaning != null) return { ok: true, input: { ...input, question, meaning } };
    const [row] = await lookup.interview(question);
    if (!row) return refused(404, 'unknown question');
    return { ok: true, input: { ...input, question: row.question, meaning: '' } };
  }
  return { ok: true, input }; // ask: nothing to confirm
}

// body = { kind, input } from the phone → { ok, group, prompt, schema } or
// { ok: false, status, error }. Nothing here is logged.
export async function prepareRequest(body, { lookup, today = new Date() } = {}) {
  const kind = body?.kind;
  if (typeof kind !== 'string') return refused(400, 'kind');
  const confirmed = await confirmContent(kind, body.input, lookup);
  if (!confirmed.ok) return confirmed;
  const built = buildRequest(kind, confirmed.input, { civics: CIVICS_BANK, today });
  if (!built.ok) return refused(400, built.error);
  return { ok: true, kind, group: built.group, prompt: built.prompt, schema: built.schema };
}
