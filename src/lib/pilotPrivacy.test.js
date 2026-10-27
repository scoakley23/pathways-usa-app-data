import { describe, it, expect } from 'vitest';
import outcomeEntity from '../../base44/entities/OutcomeCheckIn.jsonc?raw';
import activityEntity from '../../base44/entities/ActivityDay.jsonc?raw';
import reminderEntity from '../../base44/entities/CheckInReminder.jsonc?raw';
import remindersFunction from '../../base44/functions/pilot-reminders/entry.js?raw';

// Pilot answers are the learner's alone: tutors and partner staff never see
// them (docs/AI-Policy-updated.md, "Pilot Check-ins").
const appFiles = import.meta.glob(['../**/*.{js,jsx}', '!../**/*.test.js'], { query: '?raw', import: 'default', eager: true });
const functionFiles = import.meta.glob('../../base44/{functions,shared}/**/*.{js,ts}', { query: '?raw', import: 'default', eager: true });
const parse = (src) => JSON.parse(src.replace(/^\s*\/\/.*$/gm, ''));
const PILOT = /OutcomeCheckIn|ActivityDay|CheckInReminder|program_code|checkin_email_reminders|reminder_language|checkins_stopped|pilot_test_months_ago|pilot_id|pilot_intro_seen|pilot-reminders|pilotCheckIns|lib\/pilot|components\/pilot/;
// The pilot's own backend code; every other function (incl. student-progress
// for tutors) must stay away from pilot data.
const PILOT_FUNCTIONS = ['../../base44/functions/pilot-reminders/entry.js', '../../base44/shared/pilotCheckIns.js'];

const usersOf = (pattern) => Object.entries(appFiles).filter(([, src]) => pattern.test(src)).map(([file]) => file).sort();

describe('pilot privacy', () => {
  it('only the learner can read, change or delete their rows', () => {
    const ownerOnly = { 'data.user_email': '{{user.email}}' };
    for (const src of [outcomeEntity, activityEntity]) {
      expect(parse(src).rls).toEqual({ create: ownerOnly, read: ownerOnly, update: ownerOnly, delete: ownerOnly });
    }
  });

  it('check-ins have no free-text answers', () => {
    const { properties } = parse(outcomeEntity);
    for (const [name, def] of Object.entries(properties)) {
      if (name === 'user_email') continue;
      expect(def.enum, name).toBeDefined();
    }
    expect(Object.keys(parse(activityEntity).properties).sort()).toEqual(['date', 'user_email']);
  });

  it('no other backend function (incl. student-progress for tutors) touches pilot data', () => {
    const others = Object.entries(functionFiles).filter(([file]) => !PILOT_FUNCTIONS.includes(file));
    expect(others.length).toBeGreaterThan(1);
    for (const [file, src] of others) expect(src, file).not.toMatch(PILOT);
  });

  it('reminder records are admin-only', () => {
    const admin = { user_condition: { role: 'admin' } };
    expect(parse(reminderEntity).rls).toEqual({ create: admin, read: admin, update: admin, delete: admin });
  });

  it('only admins can send reminders; a learner can only forget their own', () => {
    const send = remindersFunction.slice(remindersFunction.indexOf('action !== "send"'));
    expect(send.indexOf('user.role !== "admin"')).toBeGreaterThan(0);
    expect(send.indexOf('user.role !== "admin"')).toBeLessThan(send.indexOf('db.User.filter'));
    expect(remindersFunction).toMatch(/CheckInReminder\.deleteMany\(\{ user_email: me \}\)/);
    // Counts only, never who.
    expect(remindersFunction).toMatch(/Response\.json\(\{ sent, skipped: [^}]*, failed \}\)/);
  });

  it('tutor screens, assignments and chat never touch pilot data', () => {
    const tutorFiles = Object.entries(appFiles).filter(([file]) =>
      /\/components\/(tutor|chat|notifications)\/|\/pages\/(Tutor|Messages)\.jsx$/.test(file));
    expect(tutorFiles.length).toBeGreaterThan(5);
    for (const [file, src] of tutorFiles) expect(src, file).not.toMatch(PILOT);
  });

  it('only these files read or write check-ins and activity days', () => {
    expect(usersOf(/entities\s*\.\s*OutcomeCheckIn|['"]OutcomeCheckIn['"]/)).toEqual(['../components/pilot/checkInData.js', './deleteMyData.js'].sort());
    expect(usersOf(/CheckInReminder/)).toEqual([]);
    expect(usersOf(/entities\s*\.\s*ActivityDay|['"]ActivityDay['"]/)).toEqual(['./activityDay.js', './deleteMyData.js'].sort());
  });
});
