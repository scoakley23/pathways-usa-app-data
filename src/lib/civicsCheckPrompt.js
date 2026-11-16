// The prompt the app sends when a spoken civics answer couldn't be matched on
// the device (checkCivicsAnswer()). In its own module so the civics grading
// eval (scripts/evals/civics-grading/) sends exactly the same words.
import { redactIdentifiers } from './askTutor';

// The basic check: { prompt, properties } for "is this answer correct?".
// Emails, phone numbers, A-numbers and SSNs are removed from the answer first.
export function buildCivicsCheckPrompt(question, rawAnswer) {
  const userAnswer = redactIdentifiers(rawAnswer);
  const prompt = `You are a USCIS citizenship test examiner. Determine if the student's spoken answer is correct.

Question: ${question.question}
Official Answer: ${question.answer}
Student's Answer: ${userAnswer}

In the real USCIS interview, answers don't need to be word-for-word — as long as the meaning is correct, it counts. Determine if the student's answer conveys the correct meaning.`;
  const properties = {
    is_correct: { type: 'boolean' },
    feedback: { type: 'string' },
  };
  return { prompt, properties };
}
