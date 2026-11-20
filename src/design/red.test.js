import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// "Red means Amio or a celebration. Never a button, tab, border, tag,
// warning or wrong answer." (docs/design-v2/tokens.css, CLAUDE.md)
// Amio red may appear only in these files:
const ALLOWED = {
  'components/pathways/Amio.jsx': 'Amio and AmioSays (the bubble outline)',
  'lib/theme.js': 'the confetti colours',
  'components/pathways/RedStop.jsx': "a celebration headline's full stop",
  'components/today/WeekSquares.jsx': "today's square once today's goal is met",
  'components/progress/ThisWeekCard.jsx': "today's circle once today's goal is met",
  'components/shell/MePage.jsx': 'the reached milestones on the Me path',
  'components/course/drawings.jsx': 'the Civil War map (the owner’s choice; red-text)',
  'design/tokens.js': 'the token itself',
};
const ROOT = path.resolve(__dirname, '..');
const RED = /(?<![\w-])(?:bg|text|border|ring|fill|stroke|from|to|via|decoration|outline|shadow)-(?:amio-red|red|red-text)(?![\w-])|COLORS\.(?:amioRed|red|redText)\b|COLORS\[['"](?:amio-red|red|red-text)['"]\]/;

function files(dir = ROOT) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return files(p);
    return /\.(jsx?|css)$/.test(e.name) && !/\.test\.js$/.test(e.name) ? [path.relative(ROOT, p).split(path.sep).join('/')] : [];
  });
}

describe('red means Amio or a celebration', () => {
  it('uses Amio red only in the allowed places', () => {
    const found = files().filter((f) => RED.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
    expect(found.filter((f) => !ALLOWED[f])).toEqual([]);
  });
});
