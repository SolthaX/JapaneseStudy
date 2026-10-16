// Japanese only with kanji you've learned on WaniKani.
//
// Labels are written as specs: "[今日|きょう|Today's]の[目標|もくひょう|goals]".
// A bracketed word shows in Japanese only if every kanji in it is learned (Guru
// at least once); otherwise its English gloss is used. Kana outside brackets
// attach to the word before them, so they're dropped when that word turns English.
// Learned words are tappable and reveal their reading (furigana).

const KANJI = /[㐀-䶿一-鿿]/;
let known = new Set();

export const setKnown = (chars) => {
  known = new Set(chars);
};
export const knownCount = () => known.size;

const isKnown = (word) => [...word].every((ch) => !KANJI.test(ch) || known.has(ch));

const cache = new Map();
function parse(spec) {
  if (cache.has(spec)) return cache.get(spec);
  const tokens = [];
  const re = /\[([^|\]]+)\|([^|\]]*)\|([^\]]*)\]|([^[]+)/g;
  let m;
  while ((m = re.exec(spec))) {
    if (m[1]) tokens.push({ w: m[1], r: m[2], en: m[3] });
    else tokens.push(m[4]);
  }
  cache.set(spec, tokens);
  return tokens;
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Resolves a spec.
 * @param {string} spec
 * @param {string} [en] English for the whole phrase, used when no word is known.
 * @param {{whole?: boolean}} [opts] whole: all-or-nothing instead of word by word.
 * @returns {{html: string, text: string, jp: boolean}} jp is true if any Japanese is shown.
 */
export function resolve(spec, en, opts = {}) {
  const tokens = parse(spec);
  const words = tokens.filter((t) => typeof t !== 'string');
  const flags = words.map((t) => isKnown(t.w));
  const all = flags.every(Boolean);
  const none = words.length > 0 && !flags.some(Boolean);
  const english = en ?? words.map((t) => t.en).join(' ');

  if (!all && (opts.whole || (none && en !== undefined))) return { html: esc(english), text: english, jp: false };

  // Pieces are joined with a space only around English words.
  const pieces = [];
  let prevKnown = true;
  for (const t of tokens) {
    if (typeof t === 'string') {
      if (prevKnown) pieces.push({ en: false, html: esc(t), text: t });
      continue;
    }
    prevKnown = isKnown(t.w);
    if (prevKnown) {
      const html = KANJI.test(t.w) ? `<span class="fg" data-r="${esc(t.r)}">${esc(t.w)}</span>` : esc(t.w);
      pieces.push({ en: false, html, text: t.w });
    } else if (t.en) {
      pieces.push({ en: true, html: esc(t.en), text: t.en });
    }
  }
  let html = '';
  let text = '';
  pieces.forEach((p, i) => {
    const sep = i > 0 && (p.en || pieces[i - 1].en) && !/\s$/.test(text) && !/^\s/.test(p.text) ? ' ' : '';
    html += sep + p.html;
    text += sep + p.text;
  });
  const jp = flags.some(Boolean) || (words.length === 0 && text.trim().length > 0);
  return { html: html.trim(), text: text.trim(), jp };
}

/** HTML: Japanese where learned, English otherwise. */
export const J = (spec, en, opts) => resolve(spec, en, opts).html;

/** HTML of the Japanese part only — empty when nothing would be in Japanese. */
export const jx = (spec, opts) => {
  const r = resolve(spec, '', opts);
  return r.jp ? r.html : '';
};

/** Plain text (for widget, <option>, attributes). */
export const T = (spec, en, opts) => resolve(spec, en, opts).text;
export const jt = (spec, opts) => {
  const r = resolve(spec, '', opts);
  return r.jp ? r.text : '';
};

// ---------- numbers & dates ----------

const DIGITS = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];

export function numKana(n) {
  if (n === 0) return 'ぜろ';
  let out = '';
  const th = Math.floor(n / 1000);
  const hu = Math.floor((n % 1000) / 100);
  const te = Math.floor((n % 100) / 10);
  const on = n % 10;
  if (th) out += (th === 1 ? '' : th === 3 ? 'さん' : th === 8 ? 'は' : DIGITS[th]) + (th === 3 ? 'ぜん' : th === 8 ? 'っせん' : 'せん');
  if (hu) out += hu === 1 ? 'ひゃく' : hu === 3 ? 'さんびゃく' : hu === 6 ? 'ろっぴゃく' : hu === 8 ? 'はっぴゃく' : `${DIGITS[hu]}ひゃく`;
  if (te) out += (te === 1 ? '' : DIGITS[te]) + 'じゅう';
  if (on) out += DIGITS[on];
  return out;
}

const DAY_READ = { 1: 'ついたち', 2: 'ふつか', 3: 'みっか', 4: 'よっか', 5: 'いつか', 6: 'むいか', 7: 'なのか', 8: 'ようか', 9: 'ここのか', 10: 'とおか', 14: 'じゅうよっか', 20: 'はつか', 24: 'にじゅうよっか' };
const dayRead = (d) => DAY_READ[d] || `${numKana(d).replace(/よん$/, 'よっ').replace(/なな$/, 'しち').replace(/きゅう$/, 'く')}にち`;
const monthRead = (m) => ({ 4: 'しがつ', 7: 'しちがつ', 9: 'くがつ' }[m] || `${numKana(m)}がつ`);

export const DOW = [
  ['日', 'にち', 'Sun'], ['月', 'げつ', 'Mon'], ['火', 'か', 'Tue'], ['水', 'すい', 'Wed'],
  ['木', 'もく', 'Thu'], ['金', 'きん', 'Fri'], ['土', 'ど', 'Sat'],
];

/** 10月16日（金） when 月・日 and the weekday kanji are learned, else English. */
export function dateSpec(d) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const [w, r] = DOW[d.getDay()];
  return `[${m}月|${monthRead(m)}|][${day}日|${dayRead(day)}|]（[${w}|${r}|]）`;
}

export const monthSpec = (y, m) => `[${y}年|${numKana(y)}ねん|][${m}月|${monthRead(m)}|]`;

// ---------- furigana bubble ----------

export function installFurigana() {
  const bubble = document.createElement('div');
  bubble.className = 'furi';
  bubble.hidden = true;
  document.body.appendChild(bubble);
  let timer;
  let current = null;
  const hide = () => {
    bubble.hidden = true;
    current = null;
  };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('.fg');
    if (!el) {
      hide();
      return;
    }
    if (current === el && !bubble.hidden) {
      hide();
      return;
    }
    current = el;
    const rect = el.getBoundingClientRect();
    bubble.textContent = el.dataset.r;
    bubble.hidden = false;
    const bw = bubble.offsetWidth;
    const left = Math.min(window.innerWidth - bw - 8, Math.max(8, rect.left + rect.width / 2 - bw / 2));
    bubble.style.left = `${left}px`;
    bubble.style.top = `${Math.max(8, rect.top + window.scrollY - bubble.offsetHeight - 6)}px`;
    clearTimeout(timer);
    timer = setTimeout(hide, 3500);
  }, true);
  window.addEventListener('scroll', hide, { passive: true });
}
