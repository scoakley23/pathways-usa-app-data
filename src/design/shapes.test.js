import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Amio v2 (docs/design-v2/tokens.css): 12px corners, nothing pill-shaped
// except the mic, and no all-caps text anywhere a learner sees. Admin,
// partner-staff and design-preview screens and shadcn's src/components/ui/
// are not learner screens.
const ROOT = path.resolve(__dirname, '..');
const NOT_LEARNER = [
  'components/ui/', 'components/admin/', 'components/pilot-admin/', 'pages/Admin', 'pages/Partner',
  'pages/DesignPreview', 'components/partners/ProgramSummary', 'components/partners/PartnersTab',
];
function learnerFiles(dir = ROOT) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return learnerFiles(p);
    const rel = path.relative(ROOT, p).split(path.sep).join('/');
    return /\.jsx$/.test(e.name) && !NOT_LEARNER.some((x) => rel.startsWith(x)) ? [rel] : [];
  });
}
const classStrings = (src) => [...src.matchAll(/(["'`])([^"'`\n]*)\1/g)].map((m) => m[2]);

describe('Amio v2 shapes and type', () => {
  const files = learnerFiles();

  it('has no pill shapes (rounded-full with side padding) on learner screens', () => {
    const pills = files.flatMap((f) => classStrings(fs.readFileSync(path.join(ROOT, f), 'utf8'))
      .filter((c) => /(^|\s)rounded-full(\s|$)/.test(c) && /(^|\s)(px|ps|pe)-/.test(c))
      .map((c) => `${f}: ${c.slice(0, 80)}`));
    expect(pills).toEqual([]);
  });

  // shadcn's shared pieces are used on learner screens too (amio-v2/leftovers):
  // the button, badge and switch keep 12px-family corners, never a pill.
  it('keeps the shared button, badge and switch free of pills', () => {
    for (const f of ['components/ui/button.jsx', 'components/ui/badge.jsx', 'components/ui/switch.jsx']) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      const pills = classStrings(src).filter((c) => /(^|\s)rounded-full(\s|$)/.test(c) && !/(^|\s)(h-11 w-11|w-11 h-11)(\s|$)/.test(c));
      expect(pills, f).toEqual([]);
    }
  });

  it('has no uppercase text on learner screens', () => {
    const caps = files.filter((f) => /(^|[\s"'`])uppercase(?![\w-])/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
    expect(caps).toEqual([]);
  });

  it('makes every rounded size 12px (cards, buttons, xl to 3xl)', async () => {
    const config = (await import('../../tailwind.config.js')).default;
    const r = config.theme.extend.borderRadius;
    for (const k of ['card', 'button', 'xl', '2xl', '3xl']) expect(r[k]).toBe('12px');
  });
});
