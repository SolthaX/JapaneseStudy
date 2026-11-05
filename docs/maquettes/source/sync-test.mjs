import { chromium, devices } from '/opt/node-tools/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
// Shared fake GitHub
const gists = {};
let nextId = 1;
const calls = [];
async function mockGitHub(ctx) {
  await ctx.route('https://api.github.com/**', async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    const auth = req.headers()['authorization'];
    calls.push(`${req.method()} ${u.pathname}`);
    if (auth !== 'Bearer TESTTOKEN') return route.fulfill({ status: 401, body: '{}' });
    let body;
    if (req.method() === 'GET' && u.pathname === '/gists') body = Object.values(gists).map((g) => ({ id: g.id, description: g.description, files: { 'benkyo.json': {} } }));
    else if (req.method() === 'POST' && u.pathname === '/gists') {
      const d = JSON.parse(req.postData());
      const g = { id: `g${nextId++}`, description: d.description, files: { 'benkyo.json': { content: d.files['benkyo.json'].content } } };
      gists[g.id] = g; body = g;
    } else if (u.pathname.startsWith('/gists/')) {
      const g = gists[u.pathname.split('/')[2]];
      if (!g) return route.fulfill({ status: 404, body: '{}' });
      if (req.method() === 'PATCH') g.files['benkyo.json'].content = JSON.parse(req.postData()).files['benkyo.json'].content;
      body = g;
    }
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
  });
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.abort());
  await ctx.route('https://api.wanikani.com/**', (r) => r.abort());
}
async function device(seed) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await mockGitHub(ctx);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.addInitScript((s) => { if (!localStorage.getItem('seeded')) { localStorage.setItem('benkyo-v1', JSON.stringify(s)); localStorage.setItem('seeded', '1'); } }, seed);
  await page.goto('http://localhost:8765/');
  return page;
}
const st = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('benkyo-v1')));
const sync = (p) => p.evaluate(() => import('./js/sync.js').then((m) => m.syncNow()));

const A = await device({ settings: { gistToken: 'TESTTOKEN', name: 'Martin' }, log: { '2026-10-10': { wk: 30, conj: true }, '2026-10-12': { bunpro: true } },
  books: { genki2: { 13: { steps: { vocab: true }, grammar: {} } } }, reading: [{ id: 'r1', title: 'よつばと！', pages: 200, current: 10, status: 'reading' }] });
await A.waitForTimeout(800); await sync(A);
const B = await device({ settings: { gistToken: 'TESTTOKEN' } });
await B.waitForTimeout(800); await sync(B);
let b = await st(B);
console.log('1. B received:', Object.keys(b.log), 'name', b.settings.name, 'genki13', JSON.stringify(b.books.genki2?.[13]?.steps), 'reading', b.reading.map((r) => r.title));

// B ticks a goal today and deletes the 10/12 day; A updates its book page.
await B.evaluate(() => import('./js/store.js').then((m) => { m.setActivity('textbook', true); m.setActivity('bunpro', false, '2026-10-12'); }));
await B.waitForTimeout(100); await sync(B);
await A.evaluate(() => import('./js/store.js').then((m) => { m.state.reading[0].current = 42; m.save(); }));
await A.waitForTimeout(100); await sync(A);
let a = await st(A);
console.log('2. A after merge: days', Object.keys(a.log).sort(), 'page', a.reading[0].current);
await sync(B); b = await st(B);
console.log('3. B after merge: days', Object.keys(b.log).sort(), 'page', b.reading[0].current, 'tokens in gist?', /TESTTOKEN|wkToken|gistToken/.test(Object.values(gists)[0].files['benkyo.json'].content));
console.log('gists created:', Object.keys(gists).length, 'calls:', calls.length);
await browser.close();
