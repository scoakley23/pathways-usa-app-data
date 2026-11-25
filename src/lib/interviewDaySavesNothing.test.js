import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Interview Day saves nothing (CLAUDE.md, AI policy): the day page and the
// whole-day call only read content, never write records or browser storage.
const ROOT = path.resolve(__dirname, '..');
const DAY_FILES = [
  'pages/InterviewDay.jsx',
  ...fs.readdirSync(path.join(ROOT, 'components/interview-day')).map((f) => `components/interview-day/${f}`),
];
const READ_ONLY_API = new Set(['@/api/content', '@/api/auth']);

describe('Interview Day saves nothing', () => {
  it('imports only read-only data modules', () => {
    for (const f of DAY_FILES) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      const apis = [...src.matchAll(/from '(@\/api\/[^']+)'/g)].map((m) => m[1]);
      expect(apis.filter((a) => !READ_ONLY_API.has(a)), f).toEqual([]);
    }
  });

  it('never writes browser storage', () => {
    for (const f of DAY_FILES) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      expect(/localStorage\.(setItem|removeItem|clear)|sessionStorage/.test(src), f).toBe(false);
    }
  });

  it('the N-400 part (the mock interview in rehearsal mode) hands results back instead of saving', () => {
    const src = fs.readFileSync(path.join(ROOT, 'components/practice/InterviewPractice.jsx'), 'utf8');
    expect(src).toMatch(/else if \(rehearsal\) \{\s*stopSpeaking\(\);\s*rehearsal\.onFinish\(results, questions\.length\);\s*\} else \{[^}]*saveSession\(results\)/);
  });
});
