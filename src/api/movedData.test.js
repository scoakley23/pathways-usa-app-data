// Step 3: once an area moves to src/api, no screen may call its Base44
// entity directly any more (it would skip the Supabase switch). Each Step 3
// PR adds its entities here.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

export const MOVED = {
  'PR 1, content (src/api/content.js)': ['CivicsQuestion', 'InterviewQuestion', 'ReadingSentence', 'Sentence', 'VocabularyWord', 'Lesson', 'LessonFlashcard', 'CommunityResource'],
  'PR 2, profile and activity (src/api/profile.js)': ['PublicProfile', 'ActivityDay'],
  'PR 3, practice progress (src/api/progress.js)': ['UserProgress'],
  'PR 4, lessons (src/api/lessons.js)': ['LessonProgress', 'LessonNotes'],
  'PR 5, interview and N-400 (src/api/interview.js)': ['InterviewSession', 'N400SectionProgress'],
};

const SRC = path.resolve(__dirname, '..');

function sourceFiles(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) { if (name !== 'api') sourceFiles(full, out); continue; }
    if (/\.(js|jsx)$/.test(name) && !/\.test\.js$/.test(name)) out.push(full);
  }
  return out;
}

describe('moved data goes through src/api only', () => {
  const files = sourceFiles(SRC).map((f) => [path.relative(SRC, f), fs.readFileSync(f, 'utf8')]);
  for (const [pr, entities] of Object.entries(MOVED)) {
    it(pr, () => {
      const hits = [];
      for (const [rel, text] of files) {
        for (const entity of entities) {
          if (new RegExp(`entities\\.${entity}\\b`).test(text)) hits.push(`${rel}: ${entity}`);
        }
      }
      expect(hits).toEqual([]);
    });
  }
});
