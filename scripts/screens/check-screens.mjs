// npm run screens: open the app's main screens at phone, tablet and desktop
// widths, in English and Arabic (right-to-left), and check that each one
// - never scrolls sideways,
// - has tap targets of at least 44 x 44 px (reported, see below),
// - has no axe accessibility violations (serious or critical).
// It saves a screenshot of every screen at every size and a page that shows
// them side by side: screens-out/index.html (not committed).
//
// The app runs with Vite in dev mode against a FAKE Supabase: every request
// to it is answered here with made-up data for one fake learner
// ("Test Learner", test.learner@example.com). Nothing leaves the machine.
//
// Options: --only=today,course   just those screens
//          --widths=360,1280      just those widths
//          --langs=en             just those languages
// Exit code 1 when a screen scrolls sideways or has an axe violation.
// Small tap targets are listed but don't fail the run yet (inline text links
// inside sentences are allowed to be smaller; check the list by eye).

import { createServer } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// Playwright as in scripts/icons (a global install works with require).
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Playwright is not installed. Install it (npx playwright install chromium) and try again.');
  process.exit(1);
}
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.join(ROOT, 'screens-out');
const FAKE_SUPABASE = 'http://fake-supabase.test';

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const WIDTHS = (arg('widths') || '360,390,768,1280,1440').split(',').map(Number);
const LANGS = (arg('langs') || 'en,ar').split(',');
const HEIGHT = 900;

// The screens. `signedIn: false` = a visitor; `guest` = guest mode (Start on Welcome).
export const SCREENS = [
  { id: 'welcome', path: '/', signedIn: false },
  { id: 'guest-today', path: '/', signedIn: false, guest: true },
  { id: 'today', path: '/' },
  { id: 'course', path: '/course' },
  { id: 'interview', path: '/interview' },
  { id: 'me', path: '/me' },
  { id: 'settings', path: '/settings' },
  { id: 'ask', path: '/ask' },
  { id: 'n400-guide', path: '/n400-guide' },
  { id: 'lawyer', path: '/lawyer-first' },
  { id: 'practice', path: '/study?tab=practice' },
  { id: 'practice-civics', path: '/study?tab=practice&mode=civics' },
  { id: 'practice-reading', path: '/study?tab=practice&mode=reading' },
  { id: 'speak-it', path: '/course/speak/u1-s1', clicks: [/^I’m ready$/] },
  { id: 'review-chest', path: '/review-chest' },
  { id: 'class', path: '/class', signedIn: false },
  { id: 'class-round', path: '/class', clicks: [/^Start$/, /^Show answer$/] },
  { id: 'lesson', path: '/course/lesson/u1-s1-l1' },
  { id: 'interview-day', path: '/interview-day' },
];
const only = arg('only')?.split(',');
const screens = only ? SCREENS.filter((s) => only.includes(s.id)) : SCREENS;

// ---- the fake learner ------------------------------------------------------
const NOW = Math.floor(Date.now() / 1000);
const USER = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test.learner@example.com',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: '2026-10-01T12:00:00Z',
};
const PROFILE = {
  user_id: USER.id,
  display_name: 'Test Learner',
  lessons_per_day: 2,
  write_level: 1,
  pilot_intro_seen: true,
  checkins_stopped: true,
  skill_levels: { civics: 'getting_there', reading: 'strong', writing: 'getting_there', speaking: 'start_here', date: '2026-11-01' },
};
const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const REVIEW_ITEMS = ['6ad16ecf6a9c603911f9de1f', '6ad16ecf6a9c603911f9de1e'].map((id) => ({ question_id: id, box: 1, next_due: yesterday }));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const FAKE_JWT = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: USER.id, role: 'authenticated', exp: NOW + 3600 * 24 })}.fake`;
const SESSION = {
  access_token: FAKE_JWT,
  refresh_token: 'fake-refresh',
  token_type: 'bearer',
  expires_in: 3600 * 24,
  expires_at: NOW + 3600 * 24,
  user: USER,
};

// Public content comes from the repo's own export files (the same rows the
// Supabase migration loads), so practice screens have real questions.
const readExport = (name) => JSON.parse(fs.readFileSync(path.join(ROOT, 'content/base44-export', name), 'utf8'));
const CONTENT = {
  civics_questions: () => [...readExport('civics-questions-2025.json'), ...readExport('civics-questions-2008.json')],
  reading_sentences: () => readExport('reading-sentences.json'),
  writing_sentences: () => readExport('writing-sentences.json'),
  vocabulary_words: () => readExport('vocabulary-words.json'),
  interview_questions: () => readExport('interview-questions.json'),
};

// PostgREST filters the app uses for content: col=eq.value, offset, limit.
function contentRows(table, params) {
  let rows = CONTENT[table]();
  for (const [key, value] of params) {
    if (['select', 'order', 'offset', 'limit'].includes(key) || !value.startsWith('eq.')) continue;
    rows = rows.filter((r) => String(r[key]) === value.slice(3));
  }
  const offset = Number(params.get('offset') || 0);
  const limit = params.has('limit') ? Number(params.get('limit')) : rows.length;
  return rows.slice(offset, offset + limit);
}

async function answerFakeSupabase(route) {
  const req = route.request();
  const url = new URL(req.url());
  const wantsObject = (req.headers().accept || '').includes('vnd.pgrst.object');
  const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  if (url.pathname.startsWith('/auth/v1/user')) return json(USER);
  if (url.pathname.startsWith('/auth/v1/')) return json({});
  if (url.pathname === '/rest/v1/profiles') return json(wantsObject ? PROFILE : [PROFILE]);
  // Two questions due for review, so the Review chest shows the Teach it back screen.
  if (url.pathname === '/rest/v1/review_items' && !wantsObject) return json(REVIEW_ITEMS);
  if (url.pathname.startsWith('/rest/v1/rpc/')) return json([]);
  const table = url.pathname.replace('/rest/v1/', '');
  if (CONTENT[table]) {
    const rows = contentRows(table, url.searchParams);
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': `0-${Math.max(rows.length - 1, 0)}/*` }, body: JSON.stringify(rows) });
  }
  if (url.pathname.startsWith('/rest/v1/')) {
    if (req.method() === 'HEAD') return route.fulfill({ status: 200, headers: { 'content-range': '*/0' }, body: '' });
    return json(wantsObject ? null : []);
  }
  if (url.pathname.startsWith('/functions/v1/')) return json({});
  return json({});
}

// ---- checks run inside the page -------------------------------------------
function pageChecks() {
  const vw = window.innerWidth;
  const sideways = document.scrollingElement.scrollWidth > vw + 1;
  const small = [];
  for (const el of document.querySelectorAll('a[href], button, [role="button"], input:not([type="hidden"]), select, summary')) {
    const r = el.getBoundingClientRect();
    // Skip hidden and screen-reader-only (1 x 1) elements.
    if (r.width <= 1 || r.height <= 1) continue;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') continue;
    // A link inside a sentence may be smaller (WCAG's inline exception).
    if (el.tagName === 'A' && style.display === 'inline' && el.parentElement?.closest('p')) continue;
    if (r.width < 44 - 0.5 || r.height < 44 - 0.5) {
      small.push(`${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
  }
  return { sideways, scrollWidth: document.scrollingElement.scrollWidth, small };
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  process.env.VITE_AUTH_PROVIDER = 'supabase';
  process.env.VITE_SUPABASE_URL = FAKE_SUPABASE;
  process.env.VITE_SUPABASE_ANON_KEY = 'fake-anon-key';
  const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: 5199, strictPort: false } });
  await server.listen();
  const base = server.resolvedUrls.local[0].replace(/\/$/, '');
  const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

  const browser = await chromium.launch();
  const results = [];
  let failed = false;

  for (const lang of LANGS) {
    for (const screen of screens) {
      for (const width of WIDTHS) {
        const context = await browser.newContext({ viewport: { width, height: HEIGHT }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
        await context.addInitScript(({ lang: l, signedIn, guest, session }) => {
          try {
            if (sessionStorage.getItem('screens_ready')) return;
            sessionStorage.setItem('screens_ready', '1');
            localStorage.clear();
            localStorage.setItem('pathways_language', l);
            localStorage.setItem('pathways_onboarded', '1');
            if (guest) localStorage.setItem('pathways_guest', '1');
            if (signedIn) localStorage.setItem('pathways_auth', JSON.stringify(session));
          } catch { /* storage blocked */ }
        }, { lang, signedIn: screen.signedIn !== false, guest: !!screen.guest, session: SESSION });
        await context.route(`${FAKE_SUPABASE}/**`, answerFakeSupabase);
        // Nothing else leaves the machine (Base44, maps, videos).
        await context.route(/^https?:\/\/(?!localhost|127\.0\.0\.1|fake-supabase\.test)/, (r) => r.abort());

        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e.message || e).slice(0, 160)));
        await page.goto(base + screen.path, { waitUntil: 'networkidle' }).catch(() => {});
        await page.waitForTimeout(600);
        // Some screens need a tap or two to reach the part to check (English
        // button names; Arabic has no translation pack yet, so they match).
        for (const name of screen.clicks || []) {
          await page.getByRole('button', { name }).first().click({ timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(500);
        }

        const name = `${screen.id}-${lang}-${width}.png`;
        await page.screenshot({ path: path.join(OUT, name), fullPage: true });
        const check = await page.evaluate(pageChecks);
        await page.addScriptTag({ content: axeSource });
        const axe = await page.evaluate(async () => {
          const r = await window.axe.run(document, { resultTypes: ['violations'] });
          return r.violations
            .filter((v) => v.impact === 'serious' || v.impact === 'critical')
            .map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target?.join(' ')}`);
        });
        const bad = check.sideways || axe.length > 0;
        if (bad) failed = true;
        results.push({ screen: screen.id, lang, width, file: name, ...check, axe, errors, bad });
        process.stdout.write(bad ? 'x' : '.');
        await context.close();
      }
    }
  }
  process.stdout.write('\n');
  await browser.close();
  await server.close();

  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(OUT, 'index.html'), gridPage(results));

  for (const r of results.filter((x) => x.bad || x.small.length)) {
    const parts = [];
    if (r.sideways) parts.push(`scrolls sideways (${r.scrollWidth}px wide)`);
    if (r.axe.length) parts.push(`axe: ${r.axe.join('; ')}`);
    if (r.small.length) parts.push(`${r.small.length} small tap target(s): ${r.small.slice(0, 3).join(', ')}${r.small.length > 3 ? ', …' : ''}`);
    console.log(`${r.bad ? 'FAIL' : 'note'} ${r.screen} ${r.lang} ${r.width}px: ${parts.join(' · ')}`);
  }
  console.log(`\n${results.length} screens checked, ${results.filter((r) => r.bad).length} failed. Screenshots: screens-out/index.html`);
  process.exit(failed ? 1 : 0);
}

function gridPage(results) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rows = [...new Set(results.map((r) => `${r.screen}|${r.lang}`))].map((key) => {
    const [screen, lang] = key.split('|');
    const cells = results.filter((r) => r.screen === screen && r.lang === lang).map((r) => `
      <figure class="${r.bad ? 'bad' : ''}"><a href="${esc(r.file)}"><img src="${esc(r.file)}" alt="${esc(`${screen} ${lang} ${r.width}px`)}" style="width:${Math.round(r.width / 4)}px" loading="lazy"></a>
      <figcaption>${r.width}px${r.bad ? ' · problem' : ''}${r.small.length ? ` · ${r.small.length} small` : ''}</figcaption></figure>`).join('');
    return `<section><h2>${esc(screen)} · ${esc(lang)}</h2><div class="row">${cells}</div></section>`;
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Screen check</title>
<style>body{font-family:system-ui,sans-serif;margin:24px;background:#FBF7EE;color:#1E2B45}
.row{display:flex;gap:16px;align-items:flex-start;overflow-x:auto;padding-bottom:8px}
figure{margin:0}img{border:1px solid #E2D8C3;display:block}figure.bad img{outline:3px solid #1E2B45}
figcaption{font-size:13px;margin-top:4px}h2{font-size:16px;margin:24px 0 8px}</style></head>
<body><h1>Screen check</h1><p>Fake learner, fake data. Click a screenshot for full size.</p>${rows}</body></html>`;
}

main().catch((e) => { console.error(e); process.exit(1); });
