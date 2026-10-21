import { base44 } from '@/api/base44Client';
import { redactIdentifiers } from '@/lib/askTutor';

export const isChangingAnswer = (question) => (question?.answer || '').startsWith('Answers change');
export const isLocationAnswer = (question) => (question?.answer || '').startsWith('Answers vary');

// AI check of a spoken civics answer against the official answer (shared by
// the civics quiz and tutor lessons). The official answer is never rewritten.
// With `teach` ({ instructions, languageName }), the AI also returns short
// teaching feedback in the tutor's voice: what was right and one tip, in the
// learner's language and in English.
// Emails and phone numbers are removed from the answer before it is sent.
export async function checkCivicsAnswer(question, rawAnswer, { personalizedAnswer = null, teach = null } = {}) {
  const userAnswer = redactIdentifiers(rawAnswer);
  const isChanging = isChangingAnswer(question);
  const isLocation = isLocationAnswer(question);

  let prompt;
  if (isChanging) {
    prompt = `You are a USCIS citizenship test examiner. The official answer to this question changes over time (for example, the current President, Vice President, Speaker of the House of Representatives, or Chief Justice).
Question: ${question.question}
Student's Answer: ${userAnswer}

Use current information from the web to determine if the student's answer correctly names the current officeholder or current fact asked about. In the real USCIS interview, answers don't need to be word-for-word — as long as the meaning is correct, it counts.`;
  } else if (isLocation && !personalizedAnswer) {
    prompt = `You are a USCIS citizenship test examiner. The official answer to this question depends on where the student lives (their state's U.S. senators, their U.S. representative, their governor, or their state capital).
Question: ${question.question}
Student's Answer: ${userAnswer}

Use current information from the web to determine if the student's answer plausibly names a currently serving U.S. official of the right kind, or a real U.S. state capital. Since the student's location is unknown, accept any currently valid answer of the right kind.`;
  } else {
    prompt = `You are a USCIS citizenship test examiner. Determine if the student's spoken answer is correct.

Question: ${question.question}
Official Answer: ${personalizedAnswer || question.answer}
Student's Answer: ${userAnswer}

In the real USCIS interview, answers don't need to be word-for-word — as long as the meaning is correct, it counts. Determine if the student's answer conveys the correct meaning.`;
  }

  const properties = {
    is_correct: { type: "boolean" },
    feedback: { type: "string" }
  };
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

  const needsWeb = isChanging || (isLocation && !personalizedAnswer);
  return base44.integrations.Core.InvokeLLM({
    prompt,
    ...(needsWeb ? { add_context_from_internet: true, model: 'gemini_3_flash' } : {}),
    response_json_schema: { type: "object", properties }
  });
}
