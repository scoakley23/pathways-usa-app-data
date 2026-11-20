// Wording for the checkpoint screens (Prompt 8): Speak it!, the review chest,
// Read and write stops and Unit complete. In the translation pack
// (src/lib/translationSources.js, set "checkpoints"). Test questions and
// sentences are never in here: they stay in English, word for word.
export const CHECKPOINT_LINES = {
  close: 'Close',
  back_to_road: 'Back to the road',
  not_found: 'This stop isn’t ready yet.',
  practice_only: 'Practice only: nothing is saved yet.',
  next: 'Next',
  checking: 'Checking…',

  // Speak it! · start (R33SpeakIntro)
  section_checkpoint: 'Section {n} checkpoint',
  speak_it: 'Speak it!',
  speak_sub_1: '{section} · 1 question',
  speak_sub_n: '{section} · {n} questions',
  speak_rules: 'This time, no hints and no help. Answer out loud, like the real interview.',
  youll_be_asked: 'You’ll be asked',
  to_pass: '{need} of {n} to pass',
  im_ready: 'I’m ready',

  // Speak it! · question (R33SpeakAsk)
  question_of: 'Speak it! · Question {n} of {total}',
  officer_asks: 'The officer asks',
  repeat_please: '“Could you repeat that, please?”',
  asked_again: 'Sure. Here’s the question again.',
  no_hints: 'No hints in a checkpoint. You can ask the officer to repeat, just like on the real day.',
  answer_in_english: 'Answer out loud, in English',
  listening: 'Listening… take your time',
  type_instead: 'Type instead',
  type_answer: 'Type your answer in English',
  check: 'Check',
  progress_label: 'Question {n} of {total}',

  // Speak it! · result (R33SpeakResult)
  passed_title: '{section}, out loud!',
  not_yet_title: 'Not yet. Almost there!',
  score_only: '{correct} of {total}',
  need_to_pass: 'You need {need} of {total} to pass. Try it again when you’re ready.',
  practice_again: 'Practice again: it’s in your review chest',
  cant_check: 'We can’t check this one yet',
  amio_missed_1: 'I’ll bring back that question in your review chest.',
  amio_missed_n: 'I’ll bring back those questions in your review chest.',
  amio_all_right: 'Every answer right. You sound ready!',
  continue_journey: 'Continue the journey',
  try_again: 'Try again',
  answer_right: 'Right',
  answer_missed: 'Not yet',

  // Review chest
  chest_title: 'Review chest',
  chest_sub_n: '{n} questions to bring back',
  chest_sub_1: '1 question to bring back',
  chest_empty: 'Nothing due today. Come back tomorrow.',
  chest_of: 'Review chest · {n} of {total}',
  chest_done: 'Chest done!',
  chest_done_sub: '{right} of {total} right. Each one moves to its next review day.',
  back_home: 'Back to home',

  // Read and write (R30ReadAloud, R30Writing)
  rw_title: 'Read and write',
  rw_sub: '{read} to read · {write} to write',
  rw_read_of: 'Read it out loud · {n} of {total}',
  rw_write_of: 'Listen and write · {n} of {total}',
  rw_done: 'Read and write done!',
  rw_done_sub: '{n} sentences read and written.',

  // Unit complete (R33UnitDone)
  unit_complete: 'Unit {n} complete',
  unit_done_title: '{unit}: done!',
  stat_lessons: 'lessons',
  stat_questions: 'test questions',
  stat_sentences: 'sentences read and written',
  unlocked: 'Unlocked:',
  unit_interview: 'Unit {n} practice interview',
  try_interview: 'Try the practice interview',
  see_journey: 'See my journey',

  // Unit practice interview
  civics_part: 'Civics',
};
