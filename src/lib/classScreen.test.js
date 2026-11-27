import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { UNITS } from './course.js';
import { officeholderKindFor } from './officeholderQuestions.js';
import { splitOfficialAnswers } from './practiceChecks.js';
import { CLASS_ROUND, DEPENDS_ON_PLACE, classAnswers, classPool, classRound } from './classScreen.js';
import questions2025 from '../../content/civics/questions-2025.json';

const OFFICIAL = new Map(questions2025.map((q) => [q.question, q.answer]));

describe('Class screen questions', () => {
  it('uses only official 2025 questions, word for word, with their official answers', () => {
    const pool = classPool('all');
    expect(pool.length).toBeGreaterThan(100);
    for (const q of pool) {
      expect(OFFICIAL.has(q.question), q.question).toBe(true);
      expect(q.answer).toBe(OFFICIAL.get(q.question));
    }
  });

  it('leaves out the questions that depend on where you live', () => {
    for (const q of classPool('all')) expect(DEPENDS_ON_PLACE.has(officeholderKindFor(q)), q.question).toBe(false);
  });

  it('keeps each topic to its own unit and rounds to 10, without repeats', () => {
    for (const unit of UNITS) {
      const round = classRound(unit.id);
      expect(round.length).toBe(Math.min(CLASS_ROUND, classPool(unit.id).length));
      expect(new Set(round.map((q) => q.id)).size).toBe(round.length);
      const pool = new Set(classPool(unit.id).map((q) => q.id));
      for (const q of round) expect(pool.has(q.id)).toBe(true);
    }
  });

  it('shows official answers; officeholders come from the official list', () => {
    const plain = classPool('all').find((q) => !officeholderKindFor(q));
    expect(classAnswers(plain).answers).toEqual(splitOfficialAnswers(plain.answer));
    const president = classPool('all').find((q) => officeholderKindFor(q) === 'president');
    expect(president).toBeTruthy();
    const shown = classAnswers(president);
    expect(shown.answers.length).toBeGreaterThan(0);
    expect(shown.checkedOn).toBeTruthy();
  });
});

// The Class screen saves nothing (desktop vision D): no data modules, no
// browser storage.
const ROOT = path.resolve(__dirname, '..');
const CLASS_FILES = fs.readdirSync(path.join(ROOT, 'components/class')).map((f) => `components/class/${f}`);

describe('Class screen saves nothing', () => {
  it('imports no data modules', () => {
    for (const f of CLASS_FILES) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      expect(src.match(/from '@\/api\/[^']+'/g), f).toBe(null);
    }
  });

  it('never touches browser storage', () => {
    for (const f of [...CLASS_FILES, 'lib/classScreen.js']) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      expect(/localStorage|sessionStorage|indexedDB/.test(src), f).toBe(false);
    }
  });
});
