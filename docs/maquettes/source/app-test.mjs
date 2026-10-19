import { chromium, devices } from '/opt/node-tools/node_modules/playwright/index.mjs';
const SP = process.argv[2];
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...(process.env.DESKTOP ? { viewport: { width: 1440, height: 900 } } : devices['iPhone 15']), colorScheme: 'light', permissions: ['clipboard-read', 'clipboard-write'] });
const PFX = process.env.DESKTOP ? 'd-' : '';
const page = await ctx.newPage();
const errors = [];
const KNOWN = '一二三四五六七八九十人大日月火水木金土本今上下中山川口学生先年時間行見書読花子女男友語外国前後午分半毎何円天気電車会社名';
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const now = Date.now();
const hour = (h) => new Date(Math.floor(now / 3600000) * 3600000 + h * 3600000).toISOString();
await page.route('https://api.wanikani.com/**', (route) => {
  const u = route.request().url();
  let body;
  if (u.includes('/user')) body = { data: { username: 'sakura_san', level: 14, started_at: '2025-01-01', subscription: { max_level_granted: 60 } } };
  else if (u.includes('/summary')) body = { data: { lessons: [{ available_at: hour(0), subject_ids: [1,2,3,4,5] }], next_reviews_at: hour(0), reviews: Array.from({length: 25}, (_, i) => ({ available_at: hour(i), subject_ids: Array.from({length: (i*7)%23}, (_, j) => j) })) } };
  else if (u.includes('/review_statistics')) body = { data: Array.from({length: 42}, () => ({})), pages: { next_url: null } };
  else if (u.includes('/assignments')) body = { data: [
      ...Array.from({length: 900}, (_, i) => ({ data: { srs_stage: (i % 9) + 1, subject_type: 'vocabulary', subject_id: 10000 + i } })),
      ...[...KNOWN].map((ch, i) => ({ data: { srs_stage: 6, subject_type: 'kanji', subject_id: 1 + i, passed_at: '2026-01-01' } })),
      { data: { srs_stage: 2, subject_type: 'kanji', subject_id: 999, passed_at: null } },
    ], pages: { next_url: null } };
  else if (u.includes('/subjects')) {
    const ids = new URL(u).searchParams.get('ids').split(',').map(Number);
    body = { data: ids.map((id) => ({ id, data: { characters: id === 999 ? '標' : [...KNOWN][id - 1] } })), pages: { next_url: null } };
  }
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
});
await page.route('https://fonts.googleapis.com/**', (r) => r.abort());
// Seed some history.
await page.addInitScript(() => {
  if (localStorage.getItem('seeded')) return;
  const log = {};
  const d = new Date();
  for (let i = 1; i < 40; i++) {
    const x = new Date(d); x.setDate(d.getDate() - i);
    if (i % 5 === 3) continue;
    const k = `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
    log[k] = { wk: 30, bunpro: i % 2 === 0, textbook: i % 3 === 0, conj: i % 4 === 0, reading: i % 2 ? 6 : undefined };
  }
  const books = { genki2: { 13: { steps: { vocab: true, video: true, grammar: true, dialogue: true, workbook: true, kanji: true, reading: true }, grammar: {0:true,1:true,2:true,3:true,4:true,5:true}, done: '2026-09-20' }, 14: { steps: { vocab: true, video: true }, grammar: { 0: true, 1: true } } } };
  localStorage.setItem('benkyo-v1', JSON.stringify({ settings: { wkToken: 'test', name: 'Martin', targets: { genki2: { start: '2026-09-01', end: '2027-03-31', baseline: 0 } } }, log, books,
    reading: [{ id: 'a', title: 'よつばと！ 1', pages: 220, current: 64, status: 'reading', started: '2026-10-01', url: 'https://learnnatively.com/' }] }));
  localStorage.setItem('seeded', '1');
});
await page.goto('http://localhost:8765/');
await page.waitForTimeout(1200);
await page.screenshot({ path: `${SP}/${PFX}today.png`, fullPage: !process.env.DESKTOP });
const fg = page.locator('.proverb .fg').first();
if (await fg.count()) { await fg.scrollIntoViewIfNeeded(); await fg.click(); await page.waitForTimeout(300); await page.screenshot({ path: `${SP}/${PFX}furigana.png` }); }
console.log('known in app', await page.evaluate(() => JSON.parse(localStorage.getItem('benkyo-v1')).cache.known));
// Toggle a goal
await page.click('[data-action="toggle-goal"][data-id="conj"]');
await page.waitForTimeout(300);
await page.click('.tabbar [data-tab="calendar"]'); await page.waitForTimeout(400);
await page.screenshot({ path: `${SP}/${PFX}calendar.png`, fullPage: !process.env.DESKTOP });
await page.click('.tabbar [data-tab="books"]'); await page.waitForTimeout(300);
await page.click('[data-action="pick-book"][data-book="genki2"]'); await page.waitForTimeout(200); await page.click('details[data-key="genki2-14"] summary'); await page.waitForTimeout(200);
await page.click('[data-action="grammar"][data-n="14"][data-i="2"]'); await page.waitForTimeout(300);
await page.screenshot({ path: `${SP}/${PFX}books.png`, fullPage: !process.env.DESKTOP });
await page.click('.tabbar [data-tab="reading"]'); await page.waitForTimeout(300);
await page.click('[data-action="page"][data-d="1"]');
await page.screenshot({ path: `${SP}/${PFX}reading.png`, fullPage: !process.env.DESKTOP });
await page.click('.tabbar [data-tab="news"]'); await page.waitForTimeout(500);
await page.screenshot({ path: `${SP}/${PFX}news.png`, fullPage: !process.env.DESKTOP });
await page.click('[data-action="open-settings"]'); await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector('[data-action="copy-widget"]').scrollIntoView({block:'center'})); await page.waitForTimeout(200); await page.screenshot({ path: `${SP}/${PFX}settings.png` });
await page.click('[data-action="close-sheet"]');
await page.emulateMedia({ colorScheme: 'dark' });
await page.click('.tabbar [data-tab="today"]'); await page.waitForTimeout(400);
await page.screenshot({ path: `${SP}/${PFX}today-dark.png` });
await page.click('.tabbar [data-tab="today"]'); await page.waitForTimeout(300);
await page.evaluate(() => { window.__nav = []; });
page.on('framenavigated', () => {});
await page.click('[data-action="update-widget"]').catch(() => {});
await page.waitForTimeout(500);
const clip = await page.evaluate(() => navigator.clipboard.readText()).catch((e) => 'ERR ' + e.message);
(await import('node:fs')).writeFileSync(SP + '/payload.json', clip);
console.log('payload bytes', clip.length);
await page.click('.tabbar [data-tab="today"]'); await page.waitForTimeout(300);
await page.route('https://icons.duckduckgo.com/**', (r) => r.abort());
await page.locator('.links-grid').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
await page.locator('.links-grid').screenshot({ path: `${SP}/${PFX}links.png` }).catch(() => {});
await page.click('[data-action="links-edit"]'); await page.waitForTimeout(200);
await page.fill('form[data-form="add-link"] [name="icon"]', '🎌');
await page.fill('form[data-form="add-link"] [name="title"]', 'Jisho');
await page.fill('form[data-form="add-link"] [name="url"]', 'jisho.org');
await page.click('form[data-form="add-link"] button[type="submit"]'); await page.waitForTimeout(200);
const added = await page.evaluate(() => JSON.parse(localStorage.getItem('benkyo-v1')).links.slice(-1)[0]);
console.log('added link', JSON.stringify(added));
await page.screenshot({ path: `${SP}/${PFX}links-edit.png`, fullPage: !process.env.DESKTOP });
await page.click('[data-action="links-edit"]');
const zipB64 = await page.evaluate(async () => { const m = await import('./js/obsidian.js'); const b = m.zip(m.buildNotes()); const buf = new Uint8Array(await b.arrayBuffer()); let s = ''; for (const x of buf) s += String.fromCharCode(x); return btoa(s); });
(await import('node:fs')).writeFileSync(SP + '/export.zip', Buffer.from(zipB64, 'base64'));
const st = await page.evaluate(() => JSON.parse(localStorage.getItem('benkyo-v1')));
console.log('today log', JSON.stringify(st.log[Object.keys(st.log).sort().pop()]), 'badges', Object.keys(st.badges));
console.log('errors', errors);
await browser.close();
