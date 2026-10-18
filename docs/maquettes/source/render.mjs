import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const OUT = process.argv[2];
const b = await chromium.launch();
async function shot(query, file, w, h, scale = 1.5) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:8766/studio.html?${query}`);
  await p.waitForSelector('body[data-ready="1"]', { timeout: 10000 }).catch(() => errs.push('not ready'));
  await p.screenshot({ path: `${OUT}/${file}`, fullPage: true });
  if (errs.length) console.log(file, errs);
  await p.close();
}
const mode = process.argv[3] || 'boards';
if (mode === 'boards') {
  await shot('board=lineup', 'lineup.png', 1500, 800);
  await shot('board=sheet&char=shiba', 'sheet-shiba.png', 1500, 900);
  await shot('board=styles', 'styles.png', 1600, 620);
} else {
  const [board, n, w, h] = [process.argv[4], Number(process.argv[5]), Number(process.argv[6]), Number(process.argv[7])];
  for (let i = 0; i < n; i++) await shot(`board=${board}&t=${(i / n).toFixed(4)}`, `f-${board}-${String(i).padStart(3, '0')}.png`, w, h, 1);
}
await b.close();
console.log('done');
