// Builds the app icons in public/icons/ from Amio's own shapes
// (src/design/appIcon.jsx → Amio.jsx). Run after Amio changes:
//   npm run icons
// Needs Playwright's Chromium (pre-installed in the cloud sessions; locally:
// `npx playwright install chromium`). Writes the SVG, the PNGs and
// scripts/icons/icons.lock.json, which appIcon.test.js checks.
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appIconSvg, ICON_FILES, ICON_SHAPES } from '../../src/design/appIcon.jsx';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'public/icons');
const LOCK = path.join(ROOT, 'scripts/icons/icons.lock.json');
const sha = (data) => createHash('sha256').update(data).digest('hex');

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Playwright is not installed. Run `npx playwright install chromium` (with playwright available) and try again.');
  process.exit(1);
}

const svgs = Object.fromEntries(Object.keys(ICON_SHAPES).map((shape) => [shape, appIconSvg(shape)]));
const lock = { shapes: {}, files: {} };
for (const [shape, svg] of Object.entries(svgs)) lock.shapes[shape] = sha(svg);

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [file, shape, size] of ICON_FILES) {
    const target = path.join(OUT, file);
    if (size === 'svg') {
      fs.writeFileSync(target, svgs[shape]);
    } else {
      const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
      const svg = svgs[shape].replace(/width="512" height="512"/, `width="${size}" height="${size}"`);
      await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`);
      await page.locator('svg').first().screenshot({ path: target, omitBackground: true });
      await page.close();
    }
    lock.files[file] = sha(fs.readFileSync(target));
    console.log(`wrote public/icons/${file}`);
  }
} finally {
  await browser.close();
}
fs.writeFileSync(LOCK, `${JSON.stringify(lock, null, 2)}\n`);
console.log('wrote scripts/icons/icons.lock.json');
