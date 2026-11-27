import { describe, it, expect } from 'vitest';
import { OLD_LESSONS, courseLessonForOld, oldLessonsFor, olderNotesFor } from './oldLessons';
import { findLesson } from './course';
import exported from '../../content/base44-export/lessons.json';

describe('the old lessons map (content/course/old-lessons.json)', () => {
  it('covers every old lesson, each pointing to a real Course lesson', () => {
    expect(Object.keys(OLD_LESSONS).sort()).toEqual(exported.map((l) => l.id).sort());
    for (const [id, l] of Object.entries(OLD_LESSONS)) {
      expect(l.title).toBe(exported.find((e) => e.id === id).title);
      expect(findLesson(l.courseLessonId), `${l.title} → ${l.courseLessonId}`).toBeTruthy();
    }
  });

  it('finds the Course lesson for an old id, and the old lessons of a Course lesson', () => {
    const [id, l] = Object.entries(OLD_LESSONS)[0];
    expect(courseLessonForOld(id)).toBe(l.courseLessonId);
    expect(courseLessonForOld('nope')).toBeNull();
    expect(oldLessonsFor(l.courseLessonId).map((o) => o.id)).toContain(id);
  });

  it('shows only non-empty old notes that point to that Course lesson', () => {
    const [id, l] = Object.entries(OLD_LESSONS)[0];
    const notes = [
      { id: 'n1', lesson_id: id, lesson_title: 'Old title', content: 'My old note' },
      { id: 'n2', lesson_id: id, content: '   ' },
      { id: 'n3', lesson_id: l.courseLessonId, content: 'A Course note' },
      { id: 'n4', lesson_id: 'other', content: 'x' },
    ];
    expect(olderNotesFor(l.courseLessonId, notes)).toEqual([{ id: 'n1', title: 'Old title', content: 'My old note' }]);
  });
});

describe('lesson notes stay private', () => {
  it('the notes card never imports the AI, and no AI request reads notes', async () => {
    const fs = await import('node:fs');
    const card = fs.readFileSync('src/components/lesson/LessonNotes.jsx', 'utf8');
    expect(card).not.toMatch(/@\/api\/ai|askTutor|aiRequests|translateStrings/);
    for (const f of ['src/lib/aiRequests.js', 'src/api/ai.js', 'src/lib/aiServer.js']) {
      expect(fs.readFileSync(f, 'utf8'), f).not.toMatch(/lessonNotes|lesson_notes|LessonNotes/);
    }
  });
});
