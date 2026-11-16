import { ai } from '@/api/ai';
import { gradeCivicsOfficeholder } from '@/lib/officeholderQuestions';


// AI check of a spoken civics answer against the official answer (shared by
// the civics quiz and tutor lessons). The official answer is never rewritten.
// With `teach` ({ language, tutor }: the app language code and the tutor's
// tone and English mix), the AI also returns short teaching feedback in the
// tutor's voice: what was right and one tip, in the learner's language and in
// English. The request and its instructions are in src/lib/aiRequests.js
// (`civics_check`); it goes through src/api/ai.js, which counts the daily
// limit on Supabase. Emails and phone numbers are removed before it is sent.
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
  return ai.run('civics_check', {
    question: question.question,
    answer: question.answer,
    said: rawAnswer,
    teach: teach ? { language: teach.language, tutor: { tone: teach.tutor?.tone, english_mix: teach.tutor?.english_mix } } : null,
  });
}
