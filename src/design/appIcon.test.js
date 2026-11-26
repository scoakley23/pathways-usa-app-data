import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { appIconSvg, ICON_FILES, ICON_SHAPES } from './appIcon.jsx';

// The app icon must be today's Amio. If this fails after Amio changes, run
// `npm run icons` and commit public/icons/ and scripts/icons/icons.lock.json.
const ROOT = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(ROOT, file));
const sha = (data) => createHash('sha256').update(data).digest('hex');
const lock = JSON.parse(read('scripts/icons/icons.lock.json'));
const FIX = 'run `npm run icons`';

describe('app icon', () => {
  it('is drawn from the current Amio', () => {
    for (const shape of Object.keys(ICON_SHAPES)) {
      expect(sha(appIconSvg(shape)), `${shape} icon is stale: ${FIX}`).toBe(lock.shapes[shape]);
    }
  });

  it('has every file the script writes, unchanged since it wrote them', () => {
    for (const [file] of ICON_FILES) {
      expect(sha(read(`public/icons/${file}`)), `public/icons/${file} differs: ${FIX}`).toBe(lock.files[file]);
    }
    const onDisk = fs.readdirSync(path.join(ROOT, 'public/icons')).sort();
    expect(onDisk).toEqual(ICON_FILES.map(([file]) => file).sort());
  });

  it('is what index.html and the manifest point at', () => {
    const html = read('index.html').toString();
    const manifest = JSON.parse(read('public/manifest.json'));
    const used = [
      ...[...html.matchAll(/(?:href|content)="(\/icons\/[^"]+)"/g)].map((m) => m[1]),
      ...manifest.icons.map((icon) => icon.src),
    ];
    expect(used.length).toBeGreaterThan(0);
    for (const src of used) expect(fs.existsSync(path.join(ROOT, 'public', src)), src).toBe(true);
    expect(html).toContain('rel="apple-touch-icon" sizes="180x180" href="/icons/amio-180.png"');
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });
});
