// The AI requests the app makes (Step 4), in one place so the phone (Base44,
// switch off) and the `ai` server function (Supabase, switch on) send the same
// words. Each kind takes plain data (the question, the learner's words, a few
// settings), checks it, and writes its own fixed instructions: nothing here
// accepts instructions from the caller. On Supabase the server also checks the
// question data against the content tables first (src/lib/aiServer.js).
//
// Personal identifiers (emails, phone numbers, A-numbers, SSNs) are removed
// from the learner's words before anything is built. Current officeholder and
// capital questions never reach the AI: they are graded on the device.
import { MAX_QUESTION_LENGTH, buildAskPrompt, redactIdentifiers } from './askTutor';
import { buildCivicsCheckPrompt } from './civicsCheckPrompt';
import { ENGLISH_MIX, TUTOR_TONES, buildTutorInstructions } from './tutorPersona';
import { validateLocation } from './officeholders';
import { officeholderKindFor } from './officeholderQuestions';
import { LANGUAGES } from './languages';

// Requests per learner per day, by group (enforced on the server by
// take_ai_request() in supabase/migrations/20261117000001_ai_usage.sql; a
// test keeps the two the same).
export const AI_LIMITS = { ask: 30, civics: 200, interview: 100, other: 50 };

// Shown when a learner reaches a limit (Ask Amio has its own translated line).
export const AI_LIMIT_MESSAGE = "You've used today's AI help. Try again tomorrow.";

// English name of an app language code, e.g. "es" -> "Spanish" (from the
// label "Español (Spanish)"). Unknown codes are English.
export function languageName(code) {
  const label = LANGUAGES.find((l) => l.value === code)?.label || 'English';
  return label.match(/\(([^)]+)\)/)?.[1] || label;
}

// A trimmed string no longer than `max`, or null.
const text = (v, max) => {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s && s.length <= max ? s : null;
};
const optionalText = (v, max) => (v == null || v === '' ? '' : text(v, max));
const bad = (error) => ({ ok: false, error });

// Only the tutor's tone and English mix (never a name; Amio is fixed).
const readTutor = (t) => ({
  tone: Object.hasOwn(TUTOR_TONES, t?.tone) ? t.tone : undefined,
  english_mix: Object.hasOwn(ENGLISH_MIX, t?.english_mix) ? t.english_mix : undefined,
});
const readLanguage = (code) => (LANGUAGES.some((l) => l.value === code) ? code : 'en');

// Strict structured-output schemas: every field required, nothing extra.
export const strictSchema = (properties) => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const S = { type: 'string' };
const N = { type: 'number' };
const B = { type: 'boolean' };

const ASK_SCHEMA = strictSchema({ is_personal_legal: B, answer_mine: S, answer_en: S });
const TEACH_FIELDS = { what_was_right_mine: S, what_was_right_en: S, tip_mine: S, tip_en: S };
const SCORE_FIELDS = {
  content_score: N, grammar_score: N, fluency_score: N, overall_score: N, is_acceptable: B,
  content_feedback: S, grammar_feedback: S, fluency_feedback: S,
};

const MAX_SAID = 1500;

export const AI_KINDS = {
  // Ask Amio: a question the app had no pre-written answer for.
  ask: {
    group: 'ask',
    read(input) {
      const question = text(input?.question, MAX_QUESTION_LENGTH);
      if (!question) return bad('question');
      const loc = input?.location ? validateLocation(input.location) : null;
      return {
        ok: true,
        value: {
          question: redactIdentifiers(question),
          language: readLanguage(input?.language),
          tutor: readTutor(input?.tutor),
          location: loc?.ok ? { state: loc.state, district: loc.district } : null,
        },
      };
    },
    // ctx.civics = { block, numbered } (the official 2025 list), ctx.today.
    build(v, ctx = {}) {
      return {
        prompt: buildAskPrompt(v.tutor, languageName(v.language), v.question, { location: v.location, civics: ctx.civics, ...(ctx.today ? { today: ctx.today } : {}) }),
        schema: ASK_SCHEMA,
      };
    },
  },

  // A spoken civics answer the device couldn't match. With `teach`, the tutor's
  // short feedback in the learner's language and in English.
  civics_check: {
    group: 'civics',
    read(input) {
      const question = text(input?.question, 500);
      const answer = text(input?.answer, 1000);
      const said = text(input?.said, MAX_SAID);
      if (!question || !answer || !said) return bad('fields');
      if (officeholderKindFor({ question })) return bad('officeholder');
      const teach = input?.teach ? { language: readLanguage(input.teach.language), tutor: readTutor(input.teach.tutor) } : null;
      return { ok: true, value: { question, answer, said: redactIdentifiers(said), teach } };
    },
    build(v) {
      const base = buildCivicsCheckPrompt({ question: v.question, answer: v.answer }, v.said);
      let prompt = base.prompt;
      let fields = { is_correct: B, feedback: S };
      if (v.teach) {
        const name = languageName(v.teach.language);
        prompt += `

Also give short teaching feedback, speaking as the tutor described below. Do not restate or change the official answer; the app shows it separately.
- what_was_right: one sentence on what the student got right (or, if nothing, one kind sentence about their attempt). Never just say "wrong".
- tip: one short, practical tip for answering this question next time.
Write each in ${name} (fields ending in _mine) and in simple English (fields ending in _en).

TUTOR:
${buildTutorInstructions(v.teach.tutor, name)}`;
        fields = { ...fields, ...TEACH_FIELDS };
      }
      return { prompt, schema: strictSchema(fields) };
    },
  },

  // One spoken answer in the practice interview (or the quick check).
  interview: {
    group: 'interview',
    read(input) {
      const question = text(input?.question, 500);
      const said = text(input?.said, MAX_SAID);
      const expected = optionalText(input?.expected_response, 1000);
      const type = optionalText(input?.response_type, 40);
      if (!question || !said || expected == null || type == null) return bad('fields');
      return { ok: true, value: { question, expected_response: expected, response_type: type, said: redactIdentifiers(said) } };
    },
    build(v) {
      return {
        prompt: `You are an experienced USCIS citizenship interview officer and ESL instructor evaluating a naturalization candidate.

INTERVIEW QUESTION: "${v.question}"
EXAMPLE RESPONSE: "${v.expected_response}"
CANDIDATE'S SPOKEN RESPONSE: "${v.said}"
RESPONSE TYPE: ${v.response_type}

Evaluate on 4 dimensions. Be honest but encouraging.

CONTENT (0-100): Does the answer address the question correctly and completely?
GRAMMAR (0-100): Are sentences grammatically correct? Note specific errors.
FLUENCY (0-100): Does it sound natural and conversational?
PRONUNCIATION NOTES: Based on the transcribed text, note any likely pronunciation issues for non-native speakers.

Also provide:
- A corrected/improved version of their response
- 2-3 specific, actionable improvement tips
- Whether this answer would pass the actual interview`,
        schema: strictSchema({ ...SCORE_FIELDS, pronunciation_notes: S, corrected_version: S, improvement_tips: S }),
      };
    },
  },

  // "Say what this question is asking" (questions about the learner's own
  // history): only understanding is judged, never an answer.
  understanding: {
    group: 'interview',
    read(input) {
      const question = text(input?.question, 500);
      const said = text(input?.said, MAX_SAID);
      const meaning = optionalText(input?.meaning, 1000);
      if (!question || !said || meaning == null) return bad('fields');
      return { ok: true, value: { question, meaning, said: redactIdentifiers(said) } };
    },
    build(v) {
      return {
        prompt: `You are an ESL instructor helping an adult prepare for the U.S. naturalization interview. They are practicing UNDERSTANDING an interview question about their Form N-400. They were asked to say, in their own words in English, what the question is asking. They were told NOT to answer it.

QUESTION: "${v.question}"
${v.meaning ? `PLAIN MEANING (written by our team): "${v.meaning}"\n` : ''}WHAT THE LEARNER SAID: "${v.said}"

Judge ONLY whether what they said shows they understand what the question is asking. The words don't need to be exact; the meaning counts.
Rules:
- Never repeat, judge, or comment on facts about the learner's own life, history, or case. Never say how they should answer the question, and never say anything about eligibility.
- If they answered the question (for example "yes", "no", or facts about themselves) instead of explaining what it asks, do not evaluate that answer: set is_acceptable to false and kindly remind them to say what the question means instead.

Return:
- content_score (0-100): how well they captured the meaning of the question.
- grammar_score and fluency_score (0-100): their English.
- overall_score (0-100) and is_acceptable (true if they understood the question).
- content_feedback: one or two kind sentences about their understanding.
- grammar_feedback and fluency_feedback: one sentence each.
- corrected_version: one simple sentence that explains what the question is asking, starting "The officer is asking". It explains the question; it never answers it.
- improvement_tips: one or two short tips for understanding questions like this one.`,
        schema: strictSchema({ ...SCORE_FIELDS, corrected_version: S, improvement_tips: S }),
      };
    },
  },

  // "Explain it simply" when a civics question has no reviewed explanation.
  explain: {
    group: 'other',
    read(input) {
      const question = text(input?.question, 500);
      const answer = text(input?.answer, 1000);
      if (!question || !answer) return bad('fields');
      if (officeholderKindFor({ question })) return bad('officeholder');
      return { ok: true, value: { question, answer } };
    },
    build(v) {
      return {
        prompt: `Explain clearly and simply why "${v.answer}" is the correct answer to the question: "${v.question}".
Context: US Civics Test.
Target audience: English language learners studying for US Citizenship.
Keep it concise (2-3 sentences). Never change, add, or invent official answers.`,
        schema: strictSchema({ explanation: S }),
      };
    },
  },
};

// A reply (object or JSON text) checked against the request's schema: only the
// schema's fields, each with the right type, or null.
export function readReply(schema, value) {
  let v = value;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v);
    } catch (e) {
      return null;
    }
  }
  if (!schema?.properties || !v || typeof v !== 'object' || Array.isArray(v)) return null;
  const out = {};
  for (const [key, { type }] of Object.entries(schema.properties)) {
    if (typeof v[key] !== type) return null;
    out[key] = v[key];
  }
  return out;
}

// Checks the input and builds { group, prompt, schema }, or { ok: false, error }.
export function buildRequest(kind, input, ctx = {}) {
  const spec = Object.hasOwn(AI_KINDS, kind) ? AI_KINDS[kind] : null;
  if (!spec) return bad('kind');
  const read = spec.read(input);
  if (!read.ok) return read;
  return { ok: true, group: spec.group, value: read.value, ...spec.build(read.value, ctx) };
}
