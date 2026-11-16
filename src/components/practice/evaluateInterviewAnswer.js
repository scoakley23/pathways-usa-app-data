import { ai } from '@/api/ai';

// AI scoring of one spoken interview answer (shared by the mock interview and
// the quick check). The instructions are in src/lib/aiRequests.js
// (`interview`); the request goes through src/api/ai.js (on Supabase the
// server confirms the question and counts the daily limit).
// The response text is used only for this call and is never saved. Emails,
// phone numbers, A-numbers and Social Security numbers are removed first.
export function evaluateInterviewAnswer(q, response) {
  return ai.run('interview', {
    question: q.question,
    expected_response: q.expected_response || '',
    response_type: q.response_type || '',
    said: response,
  });
}

// Interview sections about the learner's own history (Personal information,
// Morals & ethics). Learners never answer these in practice: they say what
// the question is asking, and only their understanding is checked.
export const UNDERSTANDING_SECTIONS = ['personal_info', 'morals_ethics'];
export const isUnderstandingSection = (q) => !!q && UNDERSTANDING_SECTIONS.includes(q.section);

// AI check of "say what this question is asking" (`understanding` in
// src/lib/aiRequests.js). `meaning` is the team's plain meaning (N-400 Guide)
// when there is one. The AI judges only the learner's understanding, never
// facts about their life or how they should answer. Emails and phone numbers
// are removed first; nothing is saved. Returns the same fields as
// evaluateInterviewAnswer so reports keep working; corrected_version is a
// one-sentence explanation of the question.
export function evaluateUnderstanding(q, response, { meaning = '' } = {}) {
  return ai.run('understanding', { question: q.question, meaning, said: response });
}
