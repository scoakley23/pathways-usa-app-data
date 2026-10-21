import { base44 } from '@/api/base44Client';

// AI evaluation of one spoken interview answer (shared by the mock interview
// and the pretest). `extra` adds instructions, e.g. the practice-person facts.
// The response text is used only for this call and is never saved.
export function evaluateInterviewAnswer(q, response, extra = '') {
  const personaBlock = extra;
  return base44.integrations.Core.InvokeLLM({
    prompt: `You are an experienced USCIS citizenship interview officer and ESL instructor evaluating a naturalization candidate.

INTERVIEW QUESTION: "${q.question}"
EXAMPLE RESPONSE: "${q.expected_response}"
CANDIDATE'S SPOKEN RESPONSE: "${response}"
RESPONSE TYPE: ${q.response_type}
${personaBlock}
Evaluate on 4 dimensions. Be honest but encouraging.

CONTENT (0-100): Does the answer address the question correctly and completely?
GRAMMAR (0-100): Are sentences grammatically correct? Note specific errors.
FLUENCY (0-100): Does it sound natural and conversational?
PRONUNCIATION NOTES: Based on the transcribed text, note any likely pronunciation issues for non-native speakers.

Also provide:
- A corrected/improved version of their response
- 2-3 specific, actionable improvement tips
- Whether this answer would pass the actual interview`,
    response_json_schema: {
      type: "object",
      properties: {
        content_score: { type: "number" },
        grammar_score: { type: "number" },
        fluency_score: { type: "number" },
        overall_score: { type: "number" },
        is_acceptable: { type: "boolean" },
        content_feedback: { type: "string" },
        grammar_feedback: { type: "string" },
        fluency_feedback: { type: "string" },
        pronunciation_notes: { type: "string" },
        corrected_version: { type: "string" },
        improvement_tips: { type: "string" }
      },
      required: ["content_score", "grammar_score", "fluency_score", "overall_score", "is_acceptable", "content_feedback", "grammar_feedback", "fluency_feedback", "corrected_version", "improvement_tips"]
    }
  });
}
