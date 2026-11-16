import { base44 } from '@/api/base44Client';
import { buildCivicsCheckPrompt } from '@/lib/civicsCheckPrompt';
import { gradeCivicsOfficeholder } from '@/lib/officeholderQuestions';


// AI check of a spoken civics answer against the official answer (shared by
// the civics quiz and tutor lessons). The official answer is never rewritten.
// With `teach` ({ instructions, languageName }), the AI also returns short
// teaching feedback in the tutor's voice: what was right and one tip, in the
// learner's language and in English.
// Emails and phone numbers are removed from the answer before it is sent.
//
// Current officeholder and capital questions (President, senators, governor,
// "the capital of your state"...) never go to the AI or the web: they are
// graded from src/data/officeholders.json with the learner's saved place
// (`location` = { state, district } or null). The result then carries
// `officeholder` (accepted names, date checked, notes) and `is_correct` may be
// null: "can't grade", counted neither right nor wrong.
export function officeholderCheck(question, rawAnswer, location = null) {
  const r = gradeCivicsOfficeholder(question, rawAnswer, location);
  if (!r) return null;
  return { is_correct: r.correct, feedback: '', officeholder: r };
}

export async function checkCivicsAnswer(question, rawAnswer, { location = null, teach = null } = {}) {
  const local = officeholderCheck(question, rawAnswer, location);
  if (local) return local;

  // The basic prompt lives in src/lib/civicsCheckPrompt.js, shared with the
  // civics grading eval (scripts/evals/civics-grading/).
  const base = buildCivicsCheckPrompt(question, rawAnswer);
  let prompt = base.prompt;
  const properties = { ...base.properties };
  if (teach) {
    prompt += `

Also give short teaching feedback, speaking as the tutor described below. Do not restate or change the official answer; the app shows it separately.
- what_was_right: one sentence on what the student got right (or, if nothing, one kind sentence about their attempt). Never just say "wrong".
- tip: one short, practical tip for answering this question next time.
Write each in ${teach.languageName} (fields ending in _mine) and in simple English (fields ending in _en).

TUTOR:
${teach.instructions}`;
    Object.assign(properties, {
      what_was_right_mine: { type: "string" },
      what_was_right_en: { type: "string" },
      tip_mine: { type: "string" },
      tip_en: { type: "string" },
    });
  }

  return base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: { type: "object", properties }
  });
}
