// Chibi companion generator (mockup only). Every character is built from the same
// rounded parts so the cast feels like one family; options vary ears, tail, markings.

export const CAST = {
  shiba: { name: 'Shiba', ja: '柴犬', body: '#e9a25b', belly: '#fff3e2', inner: '#c97b3b', ears: 'pointy', tail: 'curl', mask: 'muzzle', unlock: 'Starter companion' },
  neko: { name: 'Maneki-neko', ja: '招き猫', body: '#fffaf3', belly: '#ffffff', inner: '#f6b4b4', ears: 'pointy', tail: 'thin', patches: true, maneki: true, unlock: '3-day streak' },
  tanuki: { name: 'Tanuki', ja: '狸', body: '#8b6b50', belly: '#ecd9bb', inner: '#5c4636', ears: 'round', tail: 'bushy', mask: 'bandit', leaf: true, unlock: '7-day streak' },
  panda: { name: 'Red panda', ja: 'レッサーパンダ', body: '#c9582e', belly: '#3d2b25', inner: '#fff2e6', ears: 'round', tail: 'striped', mask: 'panda', unlock: '14-day streak' },
  kitsune: { name: 'Kitsune', ja: '狐', body: '#fffaf4', belly: '#ffffff', inner: '#f19a8a', ears: 'tall', tail: 'fluffy', kitsune: true, unlock: 'WaniKani level 10' },
  kappa: { name: 'Kappa', ja: '河童', body: '#7cc47f', belly: '#f5e4a3', inner: '#7cc47f', ears: 'none', tail: 'none', kappa: true, unlock: 'Finish a textbook' },
  kodama: { name: 'Kodama', ja: '木霊', body: '#f7f6f0', belly: '#f7f6f0', inner: '#f7f6f0', ears: 'none', tail: 'none', kodama: true, unlock: 'Tree in full bloom (30/30)' },
  baku: { name: 'Baku', ja: '獏', body: '#b8a6dc', belly: '#efe8fb', inner: '#8f7cc0', ears: 'round', tail: 'tuft', baku: true, unlock: '50 study days' },
  komainu: { name: 'Komainu', ja: '狛犬', body: '#a9bdb3', belly: '#dfe9e4', inner: '#5f8576', ears: 'round', tail: 'flame', komainu: true, unlock: '100-day streak' },
  nekomata: { name: 'Nekomata', ja: '猫又', body: '#3c3552', belly: '#57507a', inner: '#9d8cd9', ears: 'pointy', tail: 'twin', nekomata: true, eye: '#ffe17a', unlock: 'Secret: study after midnight ×10' },
};

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k));
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const STYLES = {
  flat: { stroke: 'none', sw: 0 },
  ukiyo: { stroke: '#2b2118', sw: 3.2 },
};

/** SVG markup of a companion. view: front | side | back. expr: neutral | happy | sleepy | surprised | wink. */
export function companion(id, { view = 'front', expr = 'neutral', style = 'flat', t = 0, x = 0, y = 0, scale = 1, blink = false, tailWag = 0, bob = 0, paw = 0, cute = false } = {}) {
  const c = CAST[id];
  const S = STYLES[style] || STYLES.flat;
  // Flat style gets a soft outline in a darker shade of the fur, so light characters read on light cards.
  const line = style === 'flat' ? shade(c.body, c.body === '#3c3552' ? 0.25 : -0.22) : S.stroke;
  const st = `stroke="${line}" stroke-width="${style === 'flat' ? 2.4 : S.sw}" stroke-linejoin="round"`;
  const eyeCol = c.eye || '#2a2220';
  const parts = [];
  const add = (s) => parts.push(s);
  const side = view === 'side';
  const back = view === 'back';
  const by = bob; // breathing / hop offset

  // shadow
  add(`<ellipse cx="100" cy="186" rx="${side ? 50 : 40}" ry="6" fill="#000" opacity=".13"/>`);

  // ---- tail (behind body unless back view)
  const tailSvg = (() => {
    const tx = side ? 52 : 136; const ty = 150 + by;
    const rot = tailWag;
    switch (c.tail) {
      case 'curl': return `<g transform="rotate(${rot} ${tx} ${ty})"><circle cx="${tx}" cy="${ty - 14}" r="15" fill="${c.body}" ${st}/><circle cx="${tx}" cy="${ty - 14}" r="7" fill="${c.belly}"/></g>`;
      case 'thin': return `<path transform="rotate(${rot} ${tx} ${ty})" d="M${tx} ${ty} q 22 -6 18 -40" fill="none" stroke="${c.body === '#fffaf3' ? '#f2a65a' : c.body}" stroke-width="9" stroke-linecap="round"/>`;
      case 'bushy': return `<g transform="rotate(${rot} ${tx} ${ty})"><ellipse cx="${tx + 10}" cy="${ty - 16}" rx="15" ry="26" fill="${c.body}" ${st} transform="rotate(25 ${tx + 10} ${ty - 16})"/><path d="M${tx - 2} ${ty - 22} l 22 -8 M${tx + 2} ${ty - 8} l 20 -8" stroke="#4a3a2e" stroke-width="5" stroke-linecap="round"/></g>`;
      case 'striped': return `<g transform="rotate(${rot} ${tx} ${ty})"><ellipse cx="${tx + 10}" cy="${ty - 18}" rx="14" ry="28" fill="${c.body}" ${st} transform="rotate(20 ${tx + 10} ${ty - 18})"/>${[-34, -20, -6].map((d) => `<path d="M${tx - 2} ${ty + d + 8} l 24 -9" stroke="#7a3216" stroke-width="5" stroke-linecap="round"/>`).join('')}</g>`;
      case 'fluffy': return `<g transform="rotate(${rot} ${tx} ${ty})"><ellipse cx="${tx + 12}" cy="${ty - 20}" rx="17" ry="32" fill="${c.body}" ${st} transform="rotate(28 ${tx + 12} ${ty - 20})"/><ellipse cx="${tx + 26}" cy="${ty - 46}" rx="9" ry="11" fill="#e04b3a" transform="rotate(28 ${tx + 26} ${ty - 46})"/></g>`;
      case 'tuft': return `<g transform="rotate(${rot} ${tx} ${ty})"><path d="M${tx} ${ty} q 12 -4 14 -16" stroke="${c.body}" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="${tx + 14}" cy="${ty - 18}" r="7" fill="${c.inner}"/></g>`;
      case 'flame': return `<g transform="rotate(${rot} ${tx} ${ty})"><path d="M${tx} ${ty} c 26 -6 26 -40 6 -50 c 6 14 -4 20 -8 14 c 4 12 -10 18 -10 6" fill="${c.inner}" ${st}/></g>`;
      case 'twin': return `<g transform="rotate(${rot} ${tx} ${ty})">${[0, 1].map((k) => `<path d="M${tx} ${ty} q ${18 + k * 14} -${4 + k * 10} ${10 + k * 18} -${42 - k * 4}" fill="none" stroke="${c.body}" stroke-width="8" stroke-linecap="round"/><circle cx="${tx + 10 + k * 18}" cy="${ty - 46 + k * 4}" r="6" fill="#b48cff" opacity=".85"/>`).join('')}</g>`;
      default: return '';
    }
  })();
  if (!back) add(tailSvg);

  // ---- body, legs, arms
  const bodyRx = side ? 44 : 35;
  add(`<g transform="translate(0 ${by})${cute ? ' translate(100 186) scale(.84 .8) translate(-100 -186)' : ''}">`);
  if (c.kappa) add(`<ellipse cx="${side ? 74 : 100}" cy="146" rx="${side ? 26 : 38}" ry="${side ? 30 : 33}" fill="#4d8a55" ${st}/>`); // shell
  add(`<ellipse cx="${side ? 104 : 100}" cy="146" rx="${bodyRx}" ry="31" fill="${c.body}" ${st}/>`);
  if (!back) add(`<ellipse cx="${side ? 116 : 100}" cy="154" rx="${side ? 16 : 22}" ry="19" fill="${c.belly}"/>`);
  const feet = side ? [[78, 176], [96, 177], [118, 177], [134, 176]] : [[82, 176], [118, 176]];
  for (const [fx, fy] of feet) add(`<ellipse cx="${fx}" cy="${fy}" rx="11" ry="8" fill="${c.mask === 'panda' ? '#3d2b25' : c.body}" ${st}/>`);
  if (!side) {
    add(`<ellipse cx="70" cy="148" rx="9" ry="13" fill="${c.mask === 'panda' ? '#3d2b25' : c.body}" ${st}/>`);
    if (c.maneki && !back) add(`<g transform="rotate(${-paw} 130 132)"><ellipse cx="134" cy="112" rx="10" ry="16" fill="${c.body}" ${st}/><ellipse cx="134" cy="101" rx="7" ry="6" fill="#f6b4b4"/></g>`);
    else add(`<ellipse cx="130" cy="148" rx="9" ry="13" fill="${c.mask === 'panda' ? '#3d2b25' : c.body}" ${st}/>`);
  }
  add('</g>');
  if (back) add(tailSvg.replace(/translate\(0 0\)/, ''));

  // ---- head
  const hx = side ? 112 : 100; const hy = 84 + by;
  const ears = (() => {
    const col = c.body; const inn = c.inner;
    const L = (ox, mirror) => {
      const s = mirror ? -1 : 1; const bx = hx + s * ox;
      switch (c.ears) {
        case 'pointy': return `<path d="M${bx - s * 16} ${hy - 22} L${bx + s * 2} ${hy - 62} L${bx + s * 22} ${hy - 30} Z" fill="${col}" ${st}/><path d="M${bx - s * 6} ${hy - 30} L${bx + s * 3} ${hy - 50} L${bx + s * 14} ${hy - 33} Z" fill="${inn}"/>`;
        case 'tall': return `<path d="M${bx - s * 14} ${hy - 22} L${bx + s * 4} ${hy - 72} L${bx + s * 22} ${hy - 28} Z" fill="${col}" ${st}/><path d="M${bx - s * 4} ${hy - 30} L${bx + s * 5} ${hy - 58} L${bx + s * 14} ${hy - 31} Z" fill="${inn}"/>`;
        case 'round': return `<circle cx="${bx + s * 4}" cy="${hy - 34}" r="14" fill="${col}" ${st}/><circle cx="${bx + s * 4}" cy="${hy - 34}" r="7" fill="${inn}"/>`;
        default: return '';
      }
    };
    return side ? L(18, false) : L(26, true) + L(26, false);
  })();
  add(`<g class="head"${cute ? ` transform="translate(${hx} ${hy + 14}) scale(1.16) translate(${-hx} ${-hy})"` : ''}>${ears}`);
  if (c.komainu) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; add(`<circle cx="${hx + Math.cos(a) * 44}" cy="${hy + Math.sin(a) * 38}" r="11" fill="${c.inner}" ${st}/>`); }
  const headRx = c.kodama ? 36 : 46; const headRy = c.kodama ? 44 : 40;
  add(`<ellipse cx="${hx}" cy="${hy}" rx="${headRx}" ry="${headRy}" fill="${c.body}" ${st}/>`);
  if (c.kappa) {
    add(`<path d="M${hx - 44} ${hy - 6} q 44 -30 88 0 l -6 -18 q -38 -26 -76 0 z" fill="#3f7d4a"/>`);
    add(`<ellipse cx="${hx}" cy="${hy - 34}" rx="24" ry="8" fill="#cfe8ff" stroke="#8fc0e3" stroke-width="3"/>`);
  }
  if (c.leaf) add(`<path d="M${hx - 6} ${hy - 40} q 20 -30 34 -6 q -18 14 -34 6 z" fill="#7cb36a" ${st}/><path d="M${hx - 4} ${hy - 40} q 14 -10 28 -6" stroke="#4f7a3a" stroke-width="2" fill="none"/>`);
  if (c.kodama) add(`<path d="M${hx + 8} ${hy - 44} q 6 -14 16 -10 q -4 10 -16 10z" fill="#9cc98a"/>`);

  if (!back) {
    const fx = side ? 18 : 0; // face shift for profile
    if (c.mask === 'muzzle') add(`<ellipse cx="${hx + fx}" cy="${hy + 14}" rx="${side ? 22 : 30}" ry="20" fill="${c.belly}"/>`);
    if (c.mask === 'panda') add(`<ellipse cx="${hx + fx}" cy="${hy + 14}" rx="28" ry="17" fill="#fff2e6"/><circle cx="${hx - 24 + fx}" cy="${hy - 12}" r="9" fill="#fff2e6"/><circle cx="${hx + 24 + fx}" cy="${hy - 12}" r="9" fill="#fff2e6"/>`);
    if (c.mask === 'bandit') add(`<ellipse cx="${hx - 16 + fx}" cy="${hy + 2}" rx="15" ry="11" fill="#4a3a2e"/><ellipse cx="${hx + 16 + fx}" cy="${hy + 2}" rx="15" ry="11" fill="#4a3a2e"/><ellipse cx="${hx + fx}" cy="${hy + 16}" rx="16" ry="11" fill="${c.belly}"/>`);
    if (c.kitsune) add(`<path d="M${hx - 30 + fx} ${hy - 20} q 8 6 14 0 M${hx + 16 + fx} ${hy - 20} q 8 6 14 0" stroke="#e04b3a" stroke-width="${cute ? 5 : 4}" fill="none" stroke-linecap="round"/><circle cx="${hx + fx}" cy="${hy - 28}" r="4" fill="#e04b3a"/>`);
    if (c.patches) add(`<path d="M${hx + 18} ${hy - 38} q 26 6 26 30 q -20 -2 -26 -30z" fill="#f2a65a"/><path d="M${hx - 40} ${hy - 4} q 6 -22 22 -26 q 2 18 -22 26z" fill="#3a3a3a"/>`);
    if (c.kappa) add(`<path d="M${hx - 12 + fx} ${hy + 10} q 12 -8 24 0 q -12 14 -24 0z" fill="#f5b942" ${st}/>`);
    if (c.baku) add(`<path d="M${hx - 8 + fx} ${hy + 8} q 8 26 20 18 q 6 -4 0 -10 q -6 6 -10 -8z" fill="${c.body}" ${st}/>`);

    // eyes
    const ex = [hx - 16 + fx, hx + 16 + fx].slice(side ? 1 : 0);
    for (const [i, e] of ex.entries()) {
      const wink = expr === 'wink' && i === 0 && !side;
      if (blink || expr === 'sleepy') add(`<path d="M${e - 6} ${hy + 2} q 6 4 12 0" stroke="${eyeCol}" stroke-width="${cute ? 5 : 3}" fill="none" stroke-linecap="round"/>`);
      else if (expr === 'happy' || wink) add(`<path d="M${e - 6} ${hy + 3} q 6 -9 12 0" stroke="${eyeCol}" stroke-width="${cute ? 5 : 3.2}" fill="none" stroke-linecap="round"/>`);
      else if (c.kodama) add(`<ellipse cx="${e}" cy="${hy}" rx="5" ry="8" fill="#2a2220"/>`);
      else {
        const big = (expr === 'surprised' ? 1.35 : 1) * (cute ? 1.4 : 1);
        add(`<ellipse cx="${e}" cy="${hy}" rx="${5.5 * big}" ry="${7 * big}" fill="${eyeCol}"/><circle cx="${e + 2 * big}" cy="${hy - 3 * big}" r="${2.2 * big}" fill="#fff"/>${cute ? `<circle cx="${e - 2.5}" cy="${hy + 4}" r="1.6" fill="#fff" opacity=".8"/>` : ''}`);
      }
    }
    // blush
    if (!c.kodama || true) for (const b of [hx - 28 + fx, hx + 28 + fx].slice(side ? 1 : 0)) add(`<ellipse cx="${b}" cy="${hy + 14}" rx="8" ry="4.5" fill="#ff8fa3" opacity="${c.nekomata ? 0.35 : 0.55}"/>`);
    // nose + mouth
    if (!c.kappa && !c.kodama) add(`<ellipse cx="${hx + fx + (side ? 22 : 0)}" cy="${hy + 10}" rx="4" ry="3" fill="#3a2a24"/>`);
    const mx = hx + fx + (side ? 16 : 0); const my = hy + (c.kappa ? 20 : 16);
    if (expr === 'surprised') add(`<ellipse cx="${mx}" cy="${my + 3}" rx="4" ry="5" fill="#7a2e2e"/>`);
    else if (expr === 'happy') add(`<path d="M${mx - 6} ${my} q 6 9 12 0 z" fill="#7a2e2e"/>`);
    else if (c.kodama) add(`<ellipse cx="${mx}" cy="${my + 4}" rx="3.5" ry="5" fill="#2a2220"/>`);
    else if (expr === 'wink') add(`<path d="M${mx - 4} ${my} q 6 5 10 -2" stroke="#3a2a24" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
    else add(`<path d="M${mx - 7} ${my} q 3.5 4 7 0 q 3.5 4 7 0" stroke="#3a2a24" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
    if (expr === 'sleepy') add(`<text x="${hx + 34}" y="${hy - 30}" font-family="sans-serif" font-weight="700" font-size="16" fill="#8a90b8">z</text><text x="${hx + 44}" y="${hy - 44}" font-family="sans-serif" font-weight="700" font-size="12" fill="#8a90b8">z</text>`);
  }
  // collar / bell for neko, scarf for shiba, rope for komainu
  if (!back) {
    if (c.maneki) add(`<path d="M${hx - 30} ${hy + 36} q 30 12 60 0" stroke="#d63a3a" stroke-width="7" fill="none"/><circle cx="${hx}" cy="${hy + 46}" r="6.5" fill="#f2c14e" ${st}/>`);
    if (id === 'shiba') add(`<path d="M${hx - 30} ${hy + 36} q 30 12 60 0 l -2 8 q -28 10 -56 0z" fill="#d63a3a"/>`);
    if (c.komainu) add(`<circle cx="${hx}" cy="${hy + 44}" r="6" fill="#e0b84c" ${st}/>`);
  }
  add('</g>');
  return `<g transform="translate(${x} ${y}) scale(${scale})">${parts.join('')}</g>`;
}

// ---------- scenery ----------

export function blossomTree(x, y, s = 1, { blooms = 14, color = '#f4a7b9', center = '#e0457b', style = 'flat', canopy = null } = {}) {
  const S = STYLES[style] || STYLES.flat;
  const spots = [[80, 30], [60, 40], [100, 38], [45, 55], [115, 52], [75, 55], [95, 60], [35, 70], [125, 68], [60, 72], [100, 75], [85, 80], [50, 88], [115, 86]];
  const flower = (fx, fy, i) => `<g transform="translate(${fx} ${fy}) rotate(${i * 37})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-5" rx="4" ry="6" transform="rotate(${a})" fill="${color}" stroke="${S.stroke}" stroke-width="${S.sw ? 1.2 : 0}"/>`).join('')}<circle r="2.2" fill="${center}"/></g>`;
  const crown = canopy && blooms ? [[80, 50, 44, 30], [52, 66, 26, 20], [110, 64, 28, 21], [80, 78, 34, 16]].map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${canopy}"/>`).join('') : '';
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M80 150 C76 120 86 104 80 80 M80 96 C64 82 48 74 34 60 M80 92 C96 80 112 72 128 58 M80 82 C78 62 82 46 80 30" stroke="#6b4a3f" stroke-width="8" fill="none" stroke-linecap="round"/>${crown}${spots.slice(0, blooms).map(([a, b], i) => flower(a, b, i)).join('')}</g>`;
}

export function lantern(x, y, s = 1, style = 'flat') {
  const S = STYLES[style] || STYLES.flat; const st = `stroke="${S.stroke}" stroke-width="${S.sw}"`;
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-6" y="40" width="12" height="40" fill="#9a9488" ${st}/><rect x="-22" y="76" width="44" height="8" rx="2" fill="#8a8478" ${st}/><rect x="-16" y="18" width="32" height="24" rx="3" fill="#b8b1a4" ${st}/><rect x="-9" y="23" width="18" height="14" fill="#ffd27a"/><path d="M-26 20 L0 2 L26 20 Z" fill="#8a8478" ${st}/></g>`;
}

export function torii(x, y, s = 1, style = 'flat') {
  const S = STYLES[style] || STYLES.flat; const st = `stroke="${S.stroke}" stroke-width="${S.sw}"`;
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-38" y="12" width="9" height="76" fill="#d9381e" ${st}/><rect x="29" y="12" width="9" height="76" fill="#d9381e" ${st}/><path d="M-52 2 q52 -10 104 0 l-4 10 q-48 -8 -96 0z" fill="#2b2118"/><rect x="-46" y="10" width="92" height="7" fill="#d9381e" ${st}/><rect x="-40" y="26" width="80" height="6" fill="#d9381e" ${st}/></g>`;
}

export function pond(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="46" ry="14" fill="#8ec5e8"/><ellipse cx="-10" cy="-3" rx="16" ry="4" fill="#c9e6f7"/><ellipse cx="22" cy="2" rx="7" ry="3" fill="#7cb36a"/></g>`;
}

export function house(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-34" y="10" width="68" height="40" fill="#f3e6cf"/><rect x="-10" y="24" width="20" height="26" fill="#8b5e3c"/><rect x="-28" y="18" width="12" height="12" fill="#fff8e6" stroke="#8b5e3c"/><rect x="16" y="18" width="12" height="12" fill="#fff8e6" stroke="#8b5e3c"/><path d="M-46 14 L0 -18 L46 14 Z" fill="#5c4033"/></g>`;
}
