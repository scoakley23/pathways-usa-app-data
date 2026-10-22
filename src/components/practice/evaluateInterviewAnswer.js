import { base44 } from '@/api/base44Client';
import { redactIdentifiers } from '@/lib/askTutor';

// AI evaluation of one spoken interview answer (shared by the mock interview
// and the pretest). `extra` adds scoring instructions.
// The response text is used only for this call and is never saved.
export function evaluateInterviewAnswer(q, response, extra = '') {
  return base44.integrations.Core.InvokeLLM({
    prompt: `You are an experienced USCIS citizenship interview officer and ESL instructor evaluating a naturalization candidate.

INTERVIEW QUESTION: "${q.question}"
EXAMPLE RESPONSE: "${q.expected_response}"
CANDIDATE'S SPOKEN RESPONSE: "${response}"
RESPONSE TYPE: ${q.response_type}
${extra}
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

// Interview sections about the learner's own history (Personal information,
// Morals & ethics). Learners never answer these in practice: they say what
// the question is asking, and only their understanding is checked.
export const UNDERSTANDING_SECTIONS = ['personal_info', 'morals_ethics'];
export const isUnderstandingSection = (q) => !!q && UNDERSTANDING_SECTIONS.includes(q.section);

// AI check of "say what this question is asking". `meaning` is the team's
// plain meaning (N-400 Guide) when there is one. The AI judges only the
// learner's understanding, never facts about their life or how they should
// answer. Emails and phone numbers are removed first; nothing is saved.
// Returns the same fields as evaluateInterviewAnswer so reports keep working;
// corrected_version is a one-sentence explanation of the question.
export function evaluateUnderstanding(q, response, { meaning = '' } = {}) {
  const said = redactIdentifiers(response);
  return base44.integrations.Core.InvokeLLM({
    prompt: `You are an ESL instructor helping an adult prepare for the U.S. naturalization interview. They are practicing UNDERSTANDING an interview question about their Form N-400. They were asked to say, in their own words in English, what the question is asking. They were told NOT to answer it.

QUESTION: "${q.question}"
${meaning ? `PLAIN MEANING (written by our team): "${meaning}"\n` : ''}WHAT THE LEARNER SAID: "${said}"

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
        corrected_version: { type: "string" },
        improvement_tips: { type: "string" }
      },
      required: ["content_score", "grammar_score", "fluency_score", "overall_score", "is_acceptable", "content_feedback", "corrected_version", "improvement_tips"]
    }
  });
}
