import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// The Base44 content export (content/base44-export/, made by
// scripts/content/import-base44-csv.mjs). The raw CSVs aren't in the repo;
// manifest.json records each one's row count and SHA-256.
const DIR = path.resolve(__dirname, '../../content/base44-export');
const read = (file) => JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
const manifest = read('manifest.json');

describe('Base44 content export', () => {
  it('has every content entity, and only content', () => {
    expect(Object.keys(manifest.entities).sort()).toEqual([
      'CivicsQuestion', 'CommunityResource', 'InterviewQuestion', 'Lesson', 'LessonFlashcard',
      'LessonQuiz', 'ReadingSentence', 'Sentence', 'VocabularyWord',
    ]);
  });

  it('has as many rows in each JSON file as its CSV had', () => {
    for (const [entity, info] of Object.entries(manifest.entities)) {
      let total = 0;
      for (const [file, count] of Object.entries(info.outputs)) {
        const rows = read(file);
        expect(rows.length, file).toBe(count);
        total += rows.length;
      }
      expect(total, entity).toBe(info.csv_rows - (info.merged_into_existing || 0));
    }
  });

  it('matches the counts Base44 reported for the export', () => {
    const rows = Object.fromEntries(Object.entries(manifest.entities).map(([e, i]) => [e, i.csv_rows]));
    expect(rows).toEqual({
      CivicsQuestion: 228, InterviewQuestion: 24, ReadingSentence: 76, Sentence: 49, VocabularyWord: 79,
      Lesson: 25, LessonQuiz: 178, LessonFlashcard: 115, CommunityResource: 5588,
    });
  });

  it('splits the civics questions by version: 100 for 2008, 128 for 2025', () => {
    const v2008 = read('civics-questions-2008.json');
    const v2025 = read('civics-questions-2025.json');
    expect(v2008).toHaveLength(100);
    expect(v2025).toHaveLength(128);
    expect(v2008.every((q) => q.version === '2008')).toBe(true);
    expect(v2025.every((q) => q.version === '2025')).toBe(true);
  });

  it('points every lesson_id at a real lesson', () => {
    const lessons = new Set(read('lessons.json').map((l) => l.id));
    for (const file of ['lesson-quizzes.json', 'lesson-flashcards.json']) {
      const broken = read(file).filter((r) => !lessons.has(r.lesson_id)).map((r) => r.id);
      expect(broken, file).toEqual([]);
    }
  });

  it('gives every quiz and flashcard whose lesson was deleted the lesson chosen for it', () => {
    // 34 quizzes and 20 flashcards pointed at 5 lessons deleted in Base44;
    // lesson-reassignments.json gives each one an existing lesson by subject.
    const moves = read('lesson-reassignments.json');
    expect(moves.LessonQuiz).toHaveLength(34);
    expect(moves.LessonFlashcard).toHaveLength(20);
    for (const [entity, file] of [['LessonQuiz', 'lesson-quizzes.json'], ['LessonFlashcard', 'lesson-flashcards.json']]) {
      const rows = new Map(read(file).map((r) => [r.id, r]));
      const merged = new Set(moves.merges[entity].map((m) => m.id));
      const moved = [...rows.values()].filter((r) => r.original_lesson_id);
      expect(moved.map((r) => r.id).sort(), entity).toEqual(moves[entity].map((m) => m.id).filter((id) => !merged.has(id)).sort());
      for (const m of moves[entity]) {
        if (merged.has(m.id)) continue;
        expect(rows.get(m.id), m.id).toMatchObject({ lesson_id: m.lesson_id, original_lesson_id: m.deleted_lesson_id });
      }
    }
    expect(fs.readdirSync(DIR).filter((f) => f.includes('orphan'))).toEqual([]);
  });

  it('merges a moved card that repeated one in its lesson into that card', () => {
    const { merges } = read('lesson-reassignments.json');
    expect(merges.LessonFlashcard).toHaveLength(13);
    expect(merges.LessonQuiz).toHaveLength(1);
    for (const [entity, file, key] of [['LessonFlashcard', 'lesson-flashcards.json', 'term'], ['LessonQuiz', 'lesson-quizzes.json', 'question']]) {
      const rows = read(file);
      const byId = new Map(rows.map((r) => [r.id, r]));
      for (const m of merges[entity]) {
        expect(byId.has(m.id), `${m.id} left out`).toBe(false);
        const kept = byId.get(m.into);
        expect(kept.merged_from).toContain(m.id);
        for (const [field, value] of Object.entries(m.set || {})) expect(kept[field]).toBe(value);
      }
      // No lesson has the same card or question twice.
      const seen = new Set();
      for (const r of rows) {
        const k = `${r.lesson_id}|${r[key].trim().toLowerCase()}`;
        expect(seen.has(k), `${entity} repeated: ${r[key]}`).toBe(false);
        seen.add(k);
      }
    }
  });

  it('keeps every id, once', () => {
    for (const info of Object.values(manifest.entities)) {
      const ids = Object.keys(info.outputs).flatMap((f) => read(f).map((r) => r.id));
      expect(ids.every(Boolean)).toBe(true);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('turns nested fields into real lists and objects', () => {
    for (const lesson of read('lessons.json')) {
      expect(Array.isArray(lesson.key_points)).toBe(true);
      for (const point of lesson.key_points) expect(typeof point.text).toBe('string');
    }
    for (const quiz of read('lesson-quizzes.json')) expect(Array.isArray(quiz.options)).toBe(true);
    for (const place of read('community-resources.json')) {
      expect(place.services === null || Array.isArray(place.services)).toBe(true);
      expect(Array.isArray(place.languages)).toBe(true);
      expect(typeof place.latitude).toBe('number');
      expect(typeof place.is_active).toBe('boolean');
    }
  });

  it('holds no Base44 bookkeeping and no email addresses', () => {
    // Not image file names like "logo@2x.png" (in logo links).
    const EMAIL = /[A-Za-z0-9._%+-]+@(?![0-9]+x\.|[0-9]+px\.)[A-Za-z0-9.-]+\.(?!png\b|jpe?g\b|svg\b|webp\b|gif\b)[A-Za-z]{2,}\b/;
    for (const info of Object.values(manifest.entities)) {
      for (const file of Object.keys(info.outputs)) {
        const text = fs.readFileSync(path.join(DIR, file), 'utf8');
        for (const col of manifest.dropped_columns) expect(text.includes(`"${col}"`), `${file}: ${col}`).toBe(false);
        expect(EMAIL.test(text), `${file}: email`).toBe(false);
      }
    }
  });
});
