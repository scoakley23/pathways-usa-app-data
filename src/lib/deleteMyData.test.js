import { describe, it, expect } from 'vitest';
import { deleteSteps, FUNCTION_STEPS, ACCOUNT_RESET } from './deleteMyData';
import remindersFunction from '../../base44/functions/pilot-reminders/entry.js?raw';
import userEntity from '../../base44/entities/User.jsonc?raw';

// Every entity that holds a learner's records. A new learner entity must be
// added here and to deleteSteps().
const entityFiles = import.meta.glob('../../base44/entities/*.jsonc', { query: '?raw', import: 'default', eager: true });
const parse = (src) => JSON.parse(src.replace(/^\s*\/\/.*$/gm, ''));
const CONTENT = ['CivicsQuestion', 'CommunityResource', 'Partner', 'InterviewQuestion', 'Lesson', 'LessonFlashcard', 'LessonQuiz', 'ReadingSentence', 'Sentence', 'VocabularyWord', 'User'];

describe('Delete all my data', () => {
  const steps = deleteSteps('Test@Example.com');
  // Admin-only records the learner can't delete themselves go through a
  // backend function.
  const VIA_FUNCTION = { CheckInReminder: 'pilot-reminders' };
  const covered = [
    ...steps.map(([, entity]) => entity),
    ...Object.entries(VIA_FUNCTION).filter(([, fn]) => FUNCTION_STEPS.some(([, f]) => f === fn)).map(([entity]) => entity),
  ];

  it('covers every learner entity', () => {
    const learnerEntities = Object.values(entityFiles).map((src) => parse(src).name).filter((n) => !CONTENT.includes(n));
    expect(learnerEntities.length).toBeGreaterThan(10);
    for (const name of learnerEntities) expect(covered).toContain(name);
  });

  it('deletes pilot check-ins and activity days by the learner\'s email', () => {
    for (const name of ['OutcomeCheckIn', 'ActivityDay']) {
      const [, , filter] = steps.find(([, entity]) => entity === name);
      expect(filter).toEqual({ user_email: { $in: ['test@example.com', 'Test@Example.com'] } });
    }
  });

  it('the reminder records are forgotten by the learner\'s own email', () => {
    expect(FUNCTION_STEPS).toContainEqual(['reminder email records', 'pilot-reminders', { action: 'forget' }]);
    expect(remindersFunction).toMatch(/action === "forget"[\s\S]*CheckInReminder\.deleteMany\(\{ user_email: me \}\)/);
  });

  it('resets the pilot fields on the account', () => {
    expect(ACCOUNT_RESET).toMatchObject({
      state: null, checkin_email_reminders: false, reminder_language: null,
      checkins_stopped: false, pilot_test_months_ago: null, pilot_id: null, pilot_intro_seen: false,
    });
    // ...and every extra field the User entity holds.
    const fields = Object.keys(parse(userEntity).properties);
    for (const field of fields) expect(ACCOUNT_RESET).toHaveProperty(field);
  });
});
