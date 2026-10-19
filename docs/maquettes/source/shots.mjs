import { chromium, devices } from '/opt/node-tools/node_modules/playwright/index.mjs';
const OUT = process.argv[2];
const KNOWN = '一二三四五六七八九十人大日月火水木金土本今上下中山川口学生先年時間行見書読花子女男友語外国前後午分半毎何円天気電車会社名';
const browser = await chromium.launch();
const now = Date.now();
const hour = (h) => new Date(Math.floor(now / 3600000) * 3600000 + h * 3600000).toISOString();
function seed() {
  const log = {}; const d = new Date();
  for (let i = 1; i < 45; i++) { const x = new Date(d); x.setDate(d.getDate() - i); if (i % 6 === 4) continue;
    const k = `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
    log[k] = { wk: 25 + (i % 7) * 5, bunpro: i % 2 === 0, textbook: i % 3 === 0, conj: i % 4 === 0, reading: i % 2 ? 8 : undefined }; }
  const tk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  log[tk] = { wk: 42, textbook: true };
  const full = { vocab: true, video: true, grammar: true, dialogue: true, workbook: true, kanji: true, reading: true };
  const g1 = {}; for (let n = 1; n <= 12; n++) g1[n] = { steps: full, grammar: Object.fromEntries([...Array(8)].map((_, i) => [i, true])), done: '2026-08-01' };
  return { settings: { wkToken: 'demo', name: 'Martin', targets: { genki2: { start: '2026-09-01', end: '2027-03-31', baseline: 0 } } }, log,
    books: { genki1: g1, genki2: { 13: { steps: full, grammar: {0:true,1:true,2:true,3:true,4:true,5:true}, done: '2026-09-20' }, 14: { steps: { vocab: true, video: true }, grammar: { 0: true, 1: true } } } },
    reading: [{ id: 'a', title: 'よつばと！ 1', pages: 220, current: 64, status: 'reading', started: '2026-10-01', url: 'https://learnnatively.com/' }, { id: 'b', title: 'こねこのぴっち', pages: 48, current: 48, status: 'finished', started: '2026-09-01', finished: '2026-09-20' }],
    badges: { 'first-day': '2026-09-01', 'streak-7': '2026-09-10', genki1: '2026-08-01', 'wk-10': '2026-09-01', 'book-1': '2026-09-20' } };
}
async function page(ctxOpts) {
  const ctx = await browser.newContext({ ...ctxOpts, colorScheme: 'light' });
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.abort());
  await ctx.route('https://icons.duckduckgo.com/**', (r) => r.abort());
  await ctx.route('https://api.wanikani.com/**', (route) => {
    const u = route.request().url(); let body;
    if (u.includes('/user')) body = { data: { username: 'martin', level: 18, subscription: { max_level_granted: 60 } } };
    else if (u.includes('/summary')) body = { data: { lessons: [{ available_at: hour(0), subject_ids: [1,2,3,4,5,6,7] }], reviews: Array.from({ length: 25 }, (_, i) => ({ available_at: hour(i), subject_ids: Array.from({ length: [24,0,4,12,0,0,8,22,3,0,0,15,30,6,0,2,9,0,0,18,5,0,11,4,7][i] }) })) } };
    else if (u.includes('/review_statistics')) body = { total_count: 42, data: [], pages: {} };
    else if (u.includes('/assignments')) body = { data: [...Array.from({ length: 900 }, (_, i) => ({ data: { srs_stage: (i % 9) + 1, subject_type: 'vocabulary', subject_id: 9000 + i } })), ...[...KNOWN].map((c, i) => ({ data: { srs_stage: 6, subject_type: 'kanji', subject_id: i + 1, passed_at: 'x' } }))], pages: {} };
    else if (u.includes('/subjects')) { const ids = new URL(u).searchParams.get('ids').split(',').map(Number); body = { data: ids.map((id) => ({ id, data: { characters: [...KNOWN][id - 1] } })), pages: {} }; }
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const p = await ctx.newPage();
  await p.addInitScript((s) => { if (!localStorage.getItem('seeded')) { localStorage.setItem('benkyo-v1', JSON.stringify(s)); localStorage.setItem('seeded', '1'); } }, seed());
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1500);
  return p;
}
const m = await page({ ...devices['iPhone 15'], deviceScaleFactor: 2 });
await m.screenshot({ path: `${OUT}/m-today.png` });
await m.addStyleTag({ content: '.tabbar{display:none!important}' });
await m.locator('.links-grid').scrollIntoViewIfNeeded(); await m.waitForTimeout(200);
await m.locator('.links-grid').screenshot({ path: `${OUT}/m-links.png` });
await m.evaluate(() => { location.hash = '#books'; }); await m.waitForTimeout(300);
await m.click('[data-action="pick-book"][data-book="genki2"]'); await m.waitForTimeout(200);
await m.click('details[data-key="genki2-14"] summary'); await m.waitForTimeout(200);
await m.locator('details[data-key="genki2-14"]').screenshot({ path: `${OUT}/m-chapter.png` });
await m.evaluate(() => window.scrollTo(0, 0)); await m.waitForTimeout(150);
await m.locator('.dash .col').first().locator('.card').first().screenshot({ path: `${OUT}/m-book.png` });
await m.evaluate(() => { location.hash = '#calendar'; }); await m.waitForTimeout(300);
await m.locator('.cal-grid').locator('xpath=..').screenshot({ path: `${OUT}/m-calendar.png` });
await m.addStyleTag({ content: '.tabbar{display:flex!important}' });
await m.click('[data-action="open-settings"]'); await m.waitForTimeout(300);
await m.evaluate(() => document.querySelector('[data-setting="gistToken"]').closest('label').previousElementSibling.previousElementSibling.scrollIntoView({ block: 'start' })); await m.waitForTimeout(200);
await m.screenshot({ path: `${OUT}/m-settings.png` });
const d = await page({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
await d.screenshot({ path: `${OUT}/d-today.png` });
await browser.close();
console.log('done');
