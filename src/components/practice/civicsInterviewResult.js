// A civics question in a unit practice interview (Prompt 8), graded like a
// lesson: officeholder questions on the device from the official list, then
// the device match, then the AI for meaning. Returns the interview's result
// shape; the suggested wording is always an official answer, never AI text.
import { gradeCivics, acceptedAnswers } from '@/components/lesson/lessonParts';

export async function civicsInterviewResult(question, response, { location = null } = {}) {
  let correct = false;
  let graded = null;
  try { ({ correct, graded } = await gradeCivics(question, response, { location })); } catch (e) { correct = false; }
  const right = correct === true;
  const accepted = acceptedAnswers(question, graded);
  return {
    civics: true,
    is_acceptable: right,
    content_score: right ? 100 : 0,
    grammar_score: null,
    fluency_score: null,
    overall_score: right ? 100 : 0,
    corrected_version: accepted[0] || '',
    content_feedback: accepted.length > 1 ? `Other accepted answers: ${accepted.slice(1, 4).join('; ')}` : '',
    improvement_tips: '',
  };
}
