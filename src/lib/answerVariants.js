// Checking a civics answer on the device (Step 4), before anything goes to
// the AI. Uses the official accepted answers, the fixed matching rules in
// practiceChecks.js, and the reviewed variants in
// content/civics/answer-variants.json (other ways to say an official answer;
// only "reviewed" ones are used, and learners never see them). Questions that
// ask for several answers ("Name three…") need that many.
import VARIANTS_FILE from '../../content/civics/answer-variants.json';
import { matchOfficialAnswer, answersNeeded } from '@/lib/practiceChecks';

export function reviewedVariants(questionId, file = VARIANTS_FILE) {
  return (file?.questions?.[questionId]?.variants || [])
    .filter((v) => v?.status === 'reviewed' && v.text && v.answer)
    .map(({ text, answer }) => ({ text, answer }));
}

// question = { id, question, answer }. Returns { isCorrect, sure, matched,
// found }: use `sure` where the AI can judge the rest (spoken answers), and
// `isCorrect` where the device is the only check (typed answers in lessons).
export function matchCivicsAnswer(said, question, { file = VARIANTS_FILE } = {}) {
  return matchOfficialAnswer(said, question?.answer, {
    extra: reviewedVariants(question?.id, file),
    needed: answersNeeded(question?.question),
    questionText: question?.question || '',
  });
}
