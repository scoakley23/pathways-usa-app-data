import { describe, it, expect } from 'vitest';
import { deleteSteps, ACCOUNT_RESET } from './deleteMyData';
import userEntity from '../../base44/entities/User.jsonc?raw';

// Every entity that holds a learner's records. A new learner entity must be
// added here and to deleteSteps().
const entityFiles = import.meta.glob('../../base44/entities/*.jsonc', { query: '?raw', import: 'default', eager: true });
const parse = (src) => JSON.parse(src.replace(/^\s*\/\/.*$/gm, ''));
const CONTENT = ['CivicsQuestion', 'CommunityResource', 'Partner', 'InterviewQuestion', 'Lesson', 'LessonFlashcard', 'LessonQuiz', 'ReadingSentence', 'Sentence', 'VocabularyWord', 'User'];

describe('Delete all my data', () => {
  const steps = deleteSteps('Test@Example.com');
  const covered = steps.map(([, entity]) => entity);

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

  it('resets the pilot fields on the account', () => {
    expect(ACCOUNT_RESET).toMatchObject({
      state: null, checkin_email_reminders: false, pilot_id: null, pilot_intro_seen: false,
    });
    // ...and every extra field the User entity holds.
    const fields = Object.keys(parse(userEntity).properties);
    for (const field of fields) expect(ACCOUNT_RESET).toHaveProperty(field);
  });
});
