import { describe, it, expect } from 'vitest';
import { UNITS } from './course';
import { MAX_SAY, storyFor, storyPicture, storyProblems, storyTexts } from './story';
import { DRAWING_FOCUS } from '@/components/course/drawings';
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

const congress = UNITS.flatMap((u) => u.sections).find((s) => s.id === 'u2-s2');

describe('stories (Listen as a short video)', () => {
  it('have no problems: short lines, real pictures, a check every few scenes, no officeholder names', () => {
    expect(storyProblems(UNITS, { focusFor: DRAWING_FOCUS, officeholderNames: allNames(officeholders) })).toEqual([]);
  });

  it('the Congress trial: every lesson has a story, all draft for review', () => {
    for (const l of congress.lessons) {
      expect(l.steps.listen.story?.length, l.id).toBeGreaterThan(3);
      expect(l.steps.listen.storyStatus, l.id).toBe('draft');
    }
  });

  it('a draft story shows to admins only; learners keep the facts', () => {
    const lesson = congress.lessons[0];
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
    expect(storyTexts([{ say: 'A' }, { check: { kind: 'pick', prompt: 'B', choices: ['C', 'D', 'E'], answer: 0 } }])).toEqual(['A', 'B', 'C', 'D', 'E']);
  });
});
