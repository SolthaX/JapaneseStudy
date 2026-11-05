
const THEMES = {
  sakura: {},
  'sakura-accessible': { '--ink': '#241f2e', '--muted': '#5f5666', '--sakura-deep': '#c2185b', '--sakura': '#f4a7b9', '--sakura-soft': '#fde8ee', '--line': '#efe2e6' },
  washi: { '--bg': '#faf8f4', '--bg-grad': 'none', '--card': '#ffffff', '--card-2': '#fbfaf7', '--ink': '#141414', '--muted': '#5c5a57', '--line': '#e8e4dc',
    '--sakura': '#e7a1a1', '--sakura-deep': '#c8102e', '--sakura-soft': '#fbeaea', '--ai': '#1f2a44', '--heat-0': '#efece6', '--heat-1': '#f4cccc', '--heat-2': '#e99a9a', '--heat-3': '#d95252', '--heat-4': '#a50d24',
    '--shadow': '0 1px 2px rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.05)' },
  sumi: { '--bg': '#121212', '--bg-grad': 'none', '--card': '#1c1c1c', '--card-2': '#232323', '--ink': '#f2efe9', '--muted': '#b4aea4', '--line': '#2e2e2e',
    '--sakura': '#e9b44c', '--sakura-deep': '#ff5a36', '--sakura-soft': '#3a2620', '--ai': '#e9b44c', '--heat-0': '#262626', '--heat-1': '#4a2c22', '--heat-2': '#7a3b26', '--heat-3': '#c4492b', '--heat-4': '#ff6a3d',
    '--shadow': '0 1px 2px rgba(0,0,0,.4)' },
  ai: { '--bg': '#f3f5fa', '--bg-grad': 'none', '--card': '#ffffff', '--card-2': '#f7f9fd', '--ink': '#14213d', '--muted': '#4f5b75', '--line': '#e1e6f0',
    '--sakura': '#9db4e8', '--sakura-deep': '#2f4b9a', '--sakura-soft': '#e6ecfa', '--ai': '#2f4b9a', '--heat-0': '#e8ecf5', '--heat-1': '#c7d4f0', '--heat-2': '#91a9e2', '--heat-3': '#4f6fc4', '--heat-4': '#23397a' },
  matcha: { '--bg': '#f5f6f0', '--bg-grad': 'none', '--card': '#ffffff', '--card-2': '#f9faf5', '--ink': '#1f2a1c', '--muted': '#556052', '--line': '#e3e7da',
    '--sakura': '#b9d29a', '--sakura-deep': '#4f7a3a', '--sakura-soft': '#e9f1df', '--ai': '#4f7a3a', '--heat-0': '#eaede2', '--heat-1': '#cfe0b8', '--heat-2': '#a6c784', '--heat-3': '#6f9a4d', '--heat-4': '#3f6a2b' },
};
const css = (vars) => `:root{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')}}`;
for (const [name, vars] of Object.entries(THEMES)) {
  const m = await page({ ...devices['iPhone 15'], deviceScaleFactor: 2 });
  await m.addStyleTag({ content: css(vars) });
  await m.waitForTimeout(700);
  await m.screenshot({ path: `${OUT}/m-${name}.png` });
  await m.context().close();
}
// Proposed phone layout: compact hero so today's goals sit above the fold.
const focus = await page({ ...devices['iPhone 15'], deviceScaleFactor: 2 });
await focus.addStyleTag({ content: css(THEMES.washi) + '.tree-wrap{height:84px;margin-top:-6px}.tree-caption{display:none}.greeting{font-size:19px}.hero{padding-bottom:6px}.petal{display:none}.goal .sub{display:none}.goal{padding:7px 2px}' });
await focus.waitForTimeout(700);
await focus.screenshot({ path: `${OUT}/m-focus.png` });
for (const name of ['washi', 'sumi']) {
  const d = await page({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await d.addStyleTag({ content: css(THEMES[name]) });
  await d.waitForTimeout(700);
  await d.screenshot({ path: `${OUT}/d-${name}.png` });
  await d.context().close();
}
await browser.close();
console.log('done');
