import { describe, it, expect } from 'vitest';
import studyBuddy from '../components/ai/StudyBuddy.jsx?raw';
import aiStudyLogEntity from '../../base44/entities/AIStudyLog.jsonc?raw';

// Ask Vía chats are private to the learner: never emailed or sent to a tutor,
// and only the learner can read their AIStudyLog records.
const appFiles = import.meta.glob(['../**/*.{js,jsx}', '!../**/*.test.js'], { query: '?raw', import: 'default', eager: true });
const functionFiles = import.meta.glob('../../base44/{functions,shared}/**/*.{js,ts}', { query: '?raw', import: 'default', eager: true });

// The only app files allowed to touch AIStudyLog: saving (Ask Vía), the
// learner's own History, and "Delete my data".
const ALLOWED = ['../components/ai/StudyBuddy.jsx', '../pages/StudyHistory.jsx', '../components/profile/DeleteMyData.jsx'];

describe('Ask Vía privacy', () => {
  it('Ask Vía never emails or notifies anyone', () => {
    expect(studyBuddy).not.toMatch(/SendEmail/);
    expect(studyBuddy).not.toMatch(/Notification\s*\.\s*create/);
    expect(studyBuddy).not.toMatch(/TutorRelationship/);
  });

  it('only the learner can read, change, or delete their AIStudyLog records', () => {
    const { rls } = JSON.parse(aiStudyLogEntity.replace(/^\s*\/\/.*$/gm, ''));
    const ownerOnly = { 'data.user_email': '{{user.email}}' };
    expect(rls).toEqual({ create: ownerOnly, read: ownerOnly, update: ownerOnly, delete: ownerOnly });
  });

  it('no other app code reads AIStudyLog', () => {
    const users = Object.entries(appFiles)
      .filter(([, src]) => /entities\s*\.\s*AIStudyLog|['"]AIStudyLog['"]/.test(src))
      .map(([file]) => file);
    expect(users.sort()).toEqual([...ALLOWED].sort());
  });

  it('no backend function reads AIStudyLog', () => {
    expect(Object.keys(functionFiles).length).toBeGreaterThan(0);
    for (const src of Object.values(functionFiles)) expect(src).not.toMatch(/AIStudyLog/);
  });
});
