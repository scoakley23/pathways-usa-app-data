import { describe, it, expect } from 'vitest';
import { UNITS } from './course';
import { HELP_KINDS, MAX_SAY, storyFor, storyPicture, storyProblems, storyTexts, wordsInLine } from './story';
import { DRAWING_FOCUS, DRAWING_PARTS } from '@/components/course/drawings';
import officeholders from '../data/officeholders.json';

// Every name in the official list (national and every state/district).
function allNames(node, out = []) {
  if (Array.isArray(node)) node.forEach((x) => allNames(x, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'name' && typeof v === 'string' && v.split(' ').length >= 2) out.push(v);
      else allNames(v, out);
    }
  }
  return out;
}

// Stories the owner approved in the story review (content/stories-review, Nov 27, 2026).
// Only these may be "reviewed" in Units 1–3 outside Congress; every other one stays a draft.
const OWNER_REVIEWED = new Set([
  'u1-s1-l1',
  'u1-s1-l2',
  'u1-s2-l1',
  'u1-s2-l2',
  'u1-s2-l3',
  'u1-s2-l4',
  'u1-s3-l1',
  'u1-s3-l2',
  'u1-s3-l3',
  'u2-s1-l1',
  'u2-s1-l2',
  'u2-s3-l1',
  'u2-s3-l2',
  'u2-s3-l3',
  'u2-s3-l4',
  'u2-s3-l5',
  'u2-s3-l6',
  'u2-s3-l7',
  'u2-s4-l1',
  'u2-s4-l2',
  'u2-s4-l3',
  'u2-s4-l4',
  'u2-s4-l5',
  'u2-s5-l1',
  'u2-s5-l2',
  'u2-s5-l3',
  'u3-s1-l1',
  'u3-s1-l2',
  'u3-s2-l1',
  'u3-s2-l2',
  'u3-s3-l1',
]);
const expectedStatus = (id) => (OWNER_REVIEWED.has(id) ? 'reviewed' : 'draft');

const congress = UNITS.flatMap((u) => u.sections).find((s) => s.id === 'u2-s2');

describe('stories (Listen as a short video)', () => {
  it('have no problems: short lines, real pictures, a check every few scenes, no officeholder names', () => {
    expect(storyProblems(UNITS, { focusFor: DRAWING_FOCUS, tapParts: DRAWING_PARTS, officeholderNames: allNames(officeholders) })).toEqual([]);
  });

  it('the Congress trial: every lesson has a reviewed story', () => {
    for (const l of congress.lessons) {
      expect(l.steps.listen.story?.length, l.id).toBeGreaterThan(3);
      expect(l.steps.listen.storyStatus, l.id).toBe('reviewed');
    }
  });

  it('Your senators shows the learner\'s senators; the new drawings are used', () => {
    const story = (id) => congress.lessons.find((l) => l.id === id).steps.listen.story;
    expect(story('u2-s2-l5').some((x) => x.picture?.senators)).toBe(true);
    expect(story('u2-s2-l6')[0].picture).toEqual({ drawing: 'stateDistricts', focus: 'state' });
    expect(story('u2-s2-l7').some((x) => x.picture?.focus === 'district')).toBe(true);
    expect(story('u2-s2-l8').some((x) => x.picture?.drawing === 'greatCompromise')).toBe(true);
  });

  it('Unit 1: draft stories (until the owner approves them), help for every scene, and tap-the-picture checks', () => {
    const lessons = UNITS.find((u) => u.id === 'u1').sections.flatMap((sec) => sec.lessons);
    expect(lessons).toHaveLength(9);
    let taps = 0;
    for (const l of lessons) {
      const story = l.steps.listen.story;
      expect(l.steps.listen.storyStatus, l.id).toBe(expectedStatus(l.id));
      for (const item of story.filter((x) => x.say)) {
        for (const k of HELP_KINDS) expect(item.help?.[k], `${l.id}: ${item.say}`).toBeTruthy();
      }
      if (story.some((x) => x.check?.kind === 'tap')) taps++;
    }
    expect(taps).toBeGreaterThanOrEqual(6);
  });

  it('Unit 2: help for every scene; new stories are drafts, Congress stays reviewed', () => {
    const sections = UNITS.find((u) => u.id === 'u2').sections;
    let taps = 0;
    for (const sec of sections) {
      for (const l of sec.lessons) {
        const story = l.steps.listen.story;
        expect(story?.length, l.id).toBeGreaterThan(3);
        expect(l.steps.listen.storyStatus, l.id).toBe(sec.id === 'u2-s2' ? 'reviewed' : expectedStatus(l.id));
        for (const item of story.filter((x) => x.say)) {
          for (const k of HELP_KINDS) expect(item.help?.[k], `${l.id}: ${item.say}`).toBeTruthy();
        }
        if (story.some((x) => x.check?.kind === 'tap')) taps++;
      }
    }
    expect(taps).toBeGreaterThanOrEqual(8);
    const yourState = sections.find((sec) => sec.id === 'u2-s5').lessons.find((l) => l.id === 'u2-s5-l3');
    expect(yourState.steps.listen.story.some((x) => x.picture?.yourState)).toBe(true);
    expect(storyPicture({ yourState: true })).toEqual({ kind: 'yourState' });
  });

  it('Unit 3: draft stories (until the owner approves them), help for every scene, tap checks, and a lawyer line on Becoming a citizen', () => {
    const lessons = UNITS.find((u) => u.id === 'u3').sections.flatMap((sec) => sec.lessons);
    expect(lessons).toHaveLength(6);
    let taps = 0;
    for (const l of lessons) {
      const story = l.steps.listen.story;
      expect(l.steps.listen.storyStatus, l.id).toBe(expectedStatus(l.id));
      for (const item of story.filter((x) => x.say)) {
        for (const k of HELP_KINDS) expect(item.help?.[k], `${l.id}: ${item.say}`).toBeTruthy();
      }
      if (story.some((x) => x.check?.kind === 'tap')) taps++;
    }
    expect(taps).toBeGreaterThanOrEqual(5);
    const citizen = lessons.find((l) => l.id === 'u3-s3-l1').steps.listen.story;
    expect(citizen.some((x) => x.say?.includes('talk to a lawyer first'))).toBe(true);
  });

  it('help lines and tap checks go into the translation sources', () => {
    const texts = storyTexts([
      { say: 'Line', help: { simpler: 'A', example: 'B', why: 'C' } },
      { check: { kind: 'tap', prompt: 'Tap it.', picture: { drawing: 'checksBalances' }, answer: 'president' } },
    ]);
    expect(texts).toEqual(['Line', 'A', 'B', 'C', 'Tap it.']);
  });

  it('finds the lesson\'s new words in a line, with simple plurals', () => {
    const words = [{ word: 'colony' }, { word: 'amendment' }, { word: 'Bill of Rights' }, { word: 'self-government' }];
    expect(wordsInLine('Long ago, the American colonies were ruled by Britain.', words).map((w) => w.word)).toEqual(['colony']);
    expect(wordsInLine('The Constitution has 27 amendments.', words).map((w) => w.word)).toEqual(['amendment']);
    expect(wordsInLine('These are called the Bill of Rights.', words).map((w) => w.word)).toEqual(['Bill of Rights']);
    expect(wordsInLine('This is called self-government.', words).map((w) => w.word)).toEqual(['self-government']);
    expect(wordsInLine('Nothing here.', words)).toEqual([]);
  });

  it('catches a bad tap check and bad help', () => {
    const bad = [{ sections: [{ lessons: [{ id: 'x', steps: { listen: { storyStatus: 'draft', story: [
      { say: 'One', help: { simpler: 'a'.repeat(MAX_SAY + 1), joke: 'no' } },
      { check: { kind: 'tap', prompt: 'Tap', picture: { drawing: 'checksBalances' }, answer: 'moon' } },
      { say: 'Two' },
      { say: 'Three' },
      { check: { kind: 'tap', prompt: 'Tap', picture: { drawing: 'electorsMap' }, answer: 'x' } },
    ] } } }] }] }];
    const problems = storyProblems(bad, { focusFor: DRAWING_FOCUS, tapParts: DRAWING_PARTS });
    expect(problems.some((p) => p.includes('help.simpler is too long'))).toBe(true);
    expect(problems.some((p) => p.includes('unknown help "joke"'))).toBe(true);
    expect(problems.some((p) => p.includes('no part "moon" to tap'))).toBe(true);
    expect(problems.some((p) => p.includes('needs a drawing with parts to tap'))).toBe(true);
  });

  it('every tappable part is a real part of its drawing', () => {
    for (const [drawing, parts] of Object.entries(DRAWING_PARTS)) {
      for (const part of Object.keys(parts)) expect(DRAWING_FOCUS[drawing], drawing).toContain(part);
    }
  });

  it('a draft story shows to admins only; learners keep the facts', () => {
    const reviewedLesson = congress.lessons[0];
    const lesson = { ...reviewedLesson, steps: { ...reviewedLesson.steps, listen: { ...reviewedLesson.steps.listen, storyStatus: 'draft' } } };
    expect(storyFor(lesson)).toBe(null);
    expect(storyFor(lesson, { showDrafts: true })).toMatchObject({ draft: true });
    const reviewed = { ...lesson, steps: { ...lesson.steps, listen: { ...lesson.steps.listen, storyStatus: 'reviewed' } } };
    expect(storyFor(reviewed)).toMatchObject({ draft: false });
    expect(storyFor({ steps: { listen: { facts: ['x'] } } }, { showDrafts: true })).toBe(null);
  });

  it('catches a long line, a missing check, an unknown part and a name', () => {
    const bad = [{ sections: [{ lessons: [{ id: 'x', steps: { listen: { storyStatus: 'draft', story: [
      { say: 'a'.repeat(MAX_SAY + 1) },
      { say: 'Two', picture: { drawing: 'congressNumbers', focus: 'moon' } },
      { say: 'Three' },
      { say: 'Jane Example leads it.' },
    ] } } }] }] }];
    const problems = storyProblems(bad, { focusFor: DRAWING_FOCUS, officeholderNames: ['Jane Example'] });
    expect(problems.some((p) => p.includes('too long'))).toBe(true);
    expect(problems.some((p) => p.includes('no part "moon"'))).toBe(true);
    expect(problems.some((p) => p.includes('every 3 scenes'))).toBe(true);
    expect(problems.some((p) => p.includes('officeholder'))).toBe(true);
  });

  it('pictures and texts', () => {
    expect(storyPicture({ drawing: 'threeBranches', focus: 'legislative' })).toEqual({ kind: 'drawing', drawing: 'threeBranches', focus: 'legislative' });
    expect(storyPicture({ officeholder: 'speaker' })).toEqual({ kind: 'officeholder', office: 'speaker' });
    expect(storyPicture({ senators: true })).toEqual({ kind: 'senators' });
    expect(storyTexts([{ say: 'A' }, { check: { kind: 'pick', prompt: 'B', choices: ['C', 'D', 'E'], answer: 0 } }])).toEqual(['A', 'B', 'C', 'D', 'E']);
  });
});
