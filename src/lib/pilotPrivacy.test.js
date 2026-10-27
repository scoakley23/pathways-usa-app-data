import { describe, it, expect } from 'vitest';
import outcomeEntity from '../../base44/entities/OutcomeCheckIn.jsonc?raw';
import activityEntity from '../../base44/entities/ActivityDay.jsonc?raw';

// Pilot answers are the learner's alone: tutors and partner staff never see
// them (docs/AI-Policy-updated.md, "Pilot Check-ins").
const appFiles = import.meta.glob(['../**/*.{js,jsx}', '!../**/*.test.js'], { query: '?raw', import: 'default', eager: true });
const functionFiles = import.meta.glob('../../base44/{functions,shared}/**/*.{js,ts}', { query: '?raw', import: 'default', eager: true });
const parse = (src) => JSON.parse(src.replace(/^\s*\/\/.*$/gm, ''));
const PILOT = /OutcomeCheckIn|ActivityDay|program_code|checkin_email_reminders|pilot_id|pilot_intro_seen|lib\/pilot|components\/pilot/;

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

  it('no backend function (incl. student-progress for tutors) touches pilot data', () => {
    expect(Object.keys(functionFiles).length).toBeGreaterThan(0);
    for (const src of Object.values(functionFiles)) expect(src).not.toMatch(PILOT);
  });

  it('tutor screens, assignments and chat never touch pilot data', () => {
    const tutorFiles = Object.entries(appFiles).filter(([file]) =>
      /\/components\/(tutor|chat|notifications)\/|\/pages\/(Tutor|Messages)\.jsx$/.test(file));
    expect(tutorFiles.length).toBeGreaterThan(5);
    for (const [file, src] of tutorFiles) expect(src, file).not.toMatch(PILOT);
  });

  it('only these files read or write check-ins and activity days', () => {
    expect(usersOf(/entities\s*\.\s*OutcomeCheckIn|['"]OutcomeCheckIn['"]/)).toEqual(['../components/pilot/HelpUsImprove.jsx', './deleteMyData.js'].sort());
    expect(usersOf(/entities\s*\.\s*ActivityDay|['"]ActivityDay['"]/)).toEqual(['./activityDay.js', './deleteMyData.js'].sort());
  });
});
