import { BOOKS, bookById } from './curriculum.js';
import {
  state, save, onChange, ACTIVITIES, activeGoals, dayLog, setActivity, today, dayKey, parseDay, addDays,
  dayScore, streak, bestStreak, studyDaysInLast, exportData, importData,
} from './store.js';
import { syncWaniKani, syncBunpro, loadNews, SRS_GROUPS } from './api.js';
import {
  bookProgress, nextChapter, currentBook, peekChapter, chapterProgress, toggleStep, toggleGrammar,
  setChapterComplete, setBookComplete, pacing, setTarget, BADGES, checkBadges,
} from './progress.js';

// ---------- helpers ----------

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DOW_JA = '日月火水木金土';
const fmt1 = (n) => (Math.round(n * 10) / 10).toLocaleString('en');

function jaDate(d = new Date()) {
  return `${d.getMonth() + 1}月${d.getDate()}日（${DOW_JA[d.getDay()]}）`;
}
const enDate = (d) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = (key) => parseDay(key).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function relTime(ts) {
  const diff = Math.round((ts - Date.now()) / 60000);
  if (diff <= 0) return 'now';
  if (diff < 60) return `in ${diff} min`;
  const h = Math.round(diff / 60);
  return h < 24 ? `in ${h} h` : `in ${Math.round(h / 24)} d`;
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2600);
}

const section = (ja, en, extra = '') => `<h2 class="section-title"><span><span class="ja">${ja}</span><span class="en">${en}</span></span>${extra}</h2>`;

// ---------- ことわざ ----------

const PROVERBS = [
  ['継続は力なり', 'けいぞくはちからなり', 'Persistence is power.'],
  ['塵も積もれば山となる', 'ちりもつもればやまとなる', 'Even dust, piled up, becomes a mountain.'],
  ['七転び八起き', 'ななころびやおき', 'Fall seven times, get up eight.'],
  ['千里の道も一歩から', 'せんりのみちもいっぽから', 'A journey of a thousand miles begins with one step.'],
  ['石の上にも三年', 'いしのうえにもさんねん', 'Three years on a cold stone — perseverance wins.'],
  ['急がば回れ', 'いそがばまわれ', 'When in a hurry, take the long way round.'],
  ['習うより慣れろ', 'ならうよりなれろ', 'Get used to it rather than just learning it.'],
  ['雨垂れ石を穿つ', 'あまだれいしをうがつ', 'Dripping rain wears through stone.'],
  ['好きこそ物の上手なれ', 'すきこそもののじょうずなれ', 'What you love, you become good at.'],
  ['為せば成る', 'なせばなる', 'If you act, it can be done.'],
  ['初心忘るべからず', 'しょしんわするべからず', "Never forget your beginner's spirit."],
  ['猿も木から落ちる', 'さるもきからおちる', 'Even monkeys fall from trees.'],
  ['一期一会', 'いちごいちえ', 'One time, one meeting — treasure each moment.'],
  ['明日は明日の風が吹く', 'あしたはあしたのかぜがふく', "Tomorrow's wind will blow tomorrow."],
  ['花より団子', 'はなよりだんご', 'Dumplings over flowers.'],
  ['案ずるより産むが易し', 'あんずるよりうむがやすし', 'Doing is easier than worrying.'],
];

function proverbOfDay() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const doy = Math.floor((new Date() - start) / 86400000);
  return PROVERBS[doy % PROVERBS.length];
}

// ---------- sakura tree ----------

// Fixed blossom spots on the canopy (viewBox 320×180).
const SPOTS = [
  [160, 34], [138, 42], [182, 40], [118, 54], [202, 52], [150, 56], [172, 60], [98, 66], [222, 64], [128, 70],
  [194, 74], [84, 82], [236, 80], [110, 86], [160, 78], [212, 90], [140, 92], [68, 96], [252, 96], [186, 100],
  [96, 104], [228, 108], [122, 108], [262, 112], [56, 112], [164, 104], [204, 116], [80, 120], [244, 124], [144, 116],
];

function flower(x, y, i, r = 7) {
  const petals = [0, 72, 144, 216, 288]
    .map((a) => `<ellipse cx="0" cy="${-r * 0.55}" rx="${r * 0.42}" ry="${r * 0.6}" transform="rotate(${a})" fill="var(--sakura)"/>`)
    .join('');
  return `<g transform="translate(${x} ${y}) rotate(${(i * 37) % 72})"><g class="bloom" style="animation-delay:${i * 35}ms">${petals}<circle r="${r * 0.22}" fill="var(--sakura-deep)"/></g></g>`;
}

function treeSVG(blooms) {
  const flowers = SPOTS.map(([x, y], i) =>
    i < blooms ? flower(x, y, i) : `<circle cx="${x}" cy="${y}" r="2.6" fill="var(--heat-2)" opacity="0.55"/>`,
  ).join('');
  return `<svg viewBox="0 0 320 180" role="img" aria-label="Sakura tree with ${blooms} blossoms">
    <ellipse cx="160" cy="174" rx="120" ry="6" fill="var(--heat-0)"/>
    <g fill="none" stroke="#6b4a3f" stroke-linecap="round">
      <path d="M160 176 C 156 150, 166 130, 158 104" stroke-width="12"/>
      <path d="M158 112 C 140 96, 116 92, 92 74" stroke-width="6"/>
      <path d="M160 110 C 182 96, 208 92, 232 72" stroke-width="6"/>
      <path d="M158 104 C 156 80, 162 60, 160 40" stroke-width="5"/>
      <path d="M126 92 C 110 100, 86 106, 62 104" stroke-width="3.5"/>
      <path d="M196 94 C 216 104, 236 108, 258 104" stroke-width="3.5"/>
      <path d="M140 98 C 136 106, 130 112, 120 116" stroke-width="2.5"/>
      <path d="M180 98 C 190 108, 200 112, 214 118" stroke-width="2.5"/>
      <path d="M159 70 C 146 60, 134 56, 120 54" stroke-width="2.5"/>
      <path d="M160 64 C 174 56, 188 52, 204 52" stroke-width="2.5"/>
    </g>
    ${flowers}
  </svg>`;
}

function petals() {
  return Array.from({ length: 7 }, (_, i) =>
    `<span class="petal" style="left:${8 + i * 13}%;animation-duration:${6 + (i % 3) * 2}s;animation-delay:${i * 0.9}s">🌸</span>`,
  ).join('');
}

// ---------- views ----------

let tab = (location.hash || '#today').slice(1);
let selectedBook = null;
let calMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let newsTab = 'easy';
let news = null;
let newsError = null;
const openChapters = new Set();
const busy = { wk: false, bunpro: false };
const errors = {};

function greeting() {
  const h = new Date().getHours();
  const name = state.settings.name ? `、${esc(state.settings.name)}さん` : '';
  if (h >= 5 && h < 11) return [`おはよう${name}`, 'Good morning'];
  if (h >= 11 && h < 18) return [`こんにちは${name}`, 'Good afternoon'];
  return [`こんばんは${name}`, 'Good evening'];
}

function ring(done, total) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const off = c * (1 - (total ? done / total : 0));
  return `<svg class="ring" viewBox="0 0 54 54"><circle class="track" cx="27" cy="27" r="${r}"/>
    <circle class="val" cx="27" cy="27" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 27 27)"/>
    <text x="27" y="31" text-anchor="middle">${done}/${total}</text></svg>`;
}

function goalDetail(a) {
  const log = dayLog();
  const wk = state.cache.wk;
  const bp = state.cache.bunpro;
  switch (a.id) {
    case 'wk':
      if (!state.settings.wkToken) return 'Add your API token in settings for auto-tracking';
      if (!wk) return 'Syncing…';
      return `${log.wk && log.wk !== true ? `${log.wk} reviewed today · ` : ''}${wk.reviews} reviews · ${wk.lessons} lessons waiting`;
    case 'bunpro':
      if (bp?.ok) return `${bp.reviews} reviews waiting`;
      return 'Tick when your Bunpro reviews are done';
    case 'textbook': {
      const b = currentBook();
      const ch = nextChapter(b.id);
      return ch ? `${b.title} · 第${ch.n}課 ${ch.ja}` : `${b.title} finished 🎉`;
    }
    case 'conj':
      return 'Japan Foundation Sydney conjugation practice';
    case 'reading': {
      const r = state.reading.find((x) => x.status === 'reading');
      return r ? `${r.title}${r.pages ? ` · p.${r.current || 0}/${r.pages}` : ''}` : 'Natively · WaniKani book clubs';
    }
    case 'news':
      return 'NHK News Web Easy / NHK News';
  }
  return '';
}

function goalOpen(a) {
  if (a.id === 'textbook') return `<button class="btn small goal-open" data-action="tab" data-tab="books">Open</button>`;
  if (a.id === 'news') return `<button class="btn small goal-open" data-action="tab" data-tab="news">Open</button>`;
  if (a.id === 'reading') return `<button class="btn small goal-open" data-action="tab" data-tab="reading">Open</button>`;
  return `<a class="btn small goal-open" href="${a.url}" target="_blank" rel="noopener">Open ↗</a>`;
}

function viewToday() {
  const [hi, hiEn] = greeting();
  const s = streak();
  const blooms = studyDaysInLast(30);
  const studiedToday = dayScore(today()) > 0;
  const goals = activeGoals();
  const log = dayLog();
  const doneCount = goals.filter((a) => log[a.id]).length;
  const [pjp, pkana, pen] = proverbOfDay();

  return `
    <div class="card hero">
      ${studiedToday ? petals() : ''}
      <div class="hero-top">
        <div><div class="greeting">${hi}</div><div class="greeting-en">${hiEn} · ${enDate(new Date())}</div></div>
        <div class="streak"><div class="streak-num">${s}</div><div class="streak-label">日連続 · day streak</div></div>
      </div>
      <div class="tree-wrap">${treeSVG(blooms)}</div>
      <div class="tree-caption"><span>${blooms}/30 days in bloom 開花</span><span>${blooms >= 30 ? '満開！ Full bloom' : `満開まであと${30 - blooms}日`}</span></div>
    </div>

    ${section('今日の目標', 'Daily goals')}
    <div class="card">
      <div class="row between" style="margin-bottom:4px">
        <div><h3>${doneCount === goals.length && goals.length ? 'お疲れ様でした！' : 'がんばって！'}</h3>
        <div class="sub">${doneCount === goals.length && goals.length ? 'All goals done today. Great work.' : `${goals.length - doneCount} left for today`}</div></div>
        ${ring(doneCount, goals.length)}
      </div>
      ${goals.map((a) => `
        <div class="goal ${log[a.id] ? 'done' : ''}">
          <button class="check ${log[a.id] ? 'on' : ''}" data-action="toggle-goal" data-id="${a.id}" aria-label="Mark ${a.en} done">${log[a.id] ? '✓' : ''}</button>
          <span class="goal-icon">${a.icon}</span>
          <div class="grow"><div class="goal-name">${a.en}<span class="ja">${a.ja}</span></div><div class="sub">${esc(goalDetail(a))}</div></div>
          ${goalOpen(a)}
        </div>`).join('') || '<div class="empty">No goals enabled — pick some in settings ⚙︎</div>'}
    </div>

    ${section('ワニカニ', 'WaniKani', state.settings.wkToken ? `<button class="btn small ghost" data-action="sync-wk">${busy.wk ? '…' : '↻ Sync'}</button>` : '')}
    ${wkCard()}

    ${section('文プロ', 'Bunpro', state.settings.bunproKey ? `<button class="btn small ghost" data-action="sync-bunpro">${busy.bunpro ? '…' : '↻ Sync'}</button>` : '')}
    ${bunproCard()}

    ${section('教科書', 'Textbook')}
    ${textbookCard(currentBook().id, true)}

    ${section('今日のことわざ', 'Proverb of the day')}
    <div class="card proverb"><div class="jp">${pjp}</div><div class="muted small">${pkana}</div><div style="margin-top:6px">${pen}</div></div>
  `;
}

function wkCard() {
  if (!state.settings.wkToken) {
    return `<div class="card"><h3>Connect WaniKani</h3>
      <p class="sub">Create a read-only personal access token on WaniKani and paste it in settings to see your level, reviews and forecast here.</p>
      <div class="row"><a class="btn ghost" href="https://www.wanikani.com/settings/personal_access_tokens" target="_blank" rel="noopener">Get token ↗</a>
      <button class="btn primary" data-action="open-settings">Settings</button></div></div>`;
  }
  const wk = state.cache.wk;
  if (errors.wk && !wk) return `<div class="card"><h3>WaniKani</h3><p class="sub">⚠︎ ${esc(errors.wk)}</p></div>`;
  if (!wk) return `<div class="card"><div class="empty">Loading WaniKani…</div></div>`;
  const max = Math.max(1, ...wk.forecast.map((b) => b.n));
  const srsTotal = Object.values(wk.srs || {}).reduce((a, b) => a + b, 0) || 1;
  return `<div class="card">
    <div class="row between">
      <div><h3>Level ${wk.level} <span class="muted small">/ ${wk.maxLevel}</span></h3><div class="sub">${esc(wk.username)} · ${wk.doneToday || 0} reviewed today</div></div>
      <a class="btn small" href="https://www.wanikani.com/" target="_blank" rel="noopener">Open ↗</a>
    </div>
    <div class="stats">
      <div class="stat"><b>${wk.lessons}</b><span>Lessons 授業</span></div>
      <div class="stat"><b style="color:var(--sakura-deep)">${wk.reviews}</b><span>Reviews 復習</span></div>
      <div class="stat"><b>${wk.forecast.reduce((a, b) => a + b.n, 0)}</b><span>Next 24h</span></div>
    </div>
    <div class="forecast" aria-label="Review forecast for the next 24 hours">${wk.forecast.map((b) => `<span style="height:${(b.n / max) * 100}%" title="${new Date(b.at).getHours()}:00 — ${b.n}"></span>`).join('')}</div>
    <div class="forecast-axis"><span>now</span><span>+12h</span><span>+24h</span></div>
    ${wk.srs ? `<div class="srs">${SRS_GROUPS.map((g) => `<span style="width:${(wk.srs[g.id] / srsTotal) * 100}%;background:${g.color}"></span>`).join('')}</div>
    <div class="srs-legend">${SRS_GROUPS.map((g) => `<span><i style="background:${g.color}"></i>${g.ja} ${g.en} ${wk.srs[g.id]}</span>`).join('')}</div>` : ''}
    ${errors.wk ? `<p class="sub">⚠︎ ${esc(errors.wk)}</p>` : ''}
    <div class="sub small" style="margin-top:8px">Updated ${new Date(wk.fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
  </div>`;
}

function bunproCard() {
  const bp = state.cache.bunpro;
  const done = dayLog().bunpro;
  const tick = `<button class="btn ${done ? '' : 'primary'}" data-action="toggle-goal" data-id="bunpro">${done ? '✓ Done today' : 'Mark reviews done'}</button>`;
  const open = `<a class="btn ghost" href="https://bunpro.jp/dashboard" target="_blank" rel="noopener">Open ↗</a>`;
  if (bp?.ok) {
    return `<div class="card">
      <div class="row between"><div><h3>${esc(bp.username || 'Bunpro')}</h3><div class="sub">${bp.grammarPoints ?? '—'} grammar points studied</div></div>${open}</div>
      <div class="stats">
        <div class="stat"><b style="color:var(--sakura-deep)">${bp.reviews}</b><span>Reviews 復習</span></div>
        <div class="stat"><b>${bp.nextHour ?? '—'}</b><span>Next hour</span></div>
        <div class="stat"><b>${bp.nextDay ?? '—'}</b><span>Next 24h</span></div>
      </div>
      ${bp.ghosts ? `<div class="sub" style="margin-top:8px">👻 ${bp.ghosts} ghost reviews</div>` : ''}
      <div class="row" style="margin-top:12px">${tick}</div></div>`;
  }
  const note = !state.settings.bunproKey
    ? 'Bunpro has no stable public API. Add your API key in settings to try auto-sync, or simply log your reviews here.'
    : `Auto-sync unavailable (${esc(bp?.error || 'not tried yet')}). Bunpro's legacy API may be disabled or blocked by the browser — manual logging still counts toward your streak.`;
  return `<div class="card"><p class="sub" style="margin-top:0">${note}</p><div class="row">${tick}${open}</div></div>`;
}

function paceHTML(bookId) {
  const p = pacing(bookId);
  if (!p) return `<p class="sub">No target date yet. Set one to get a weekly pace.</p>`;
  if (p.finished) return `<span class="pill ok">✓ Finished 卒業</span>`;
  const d = p.delta;
  const status = Math.abs(d) < 0.25
    ? `<span class="pill ai">On track 順調</span>`
    : d > 0
      ? `<span class="pill ok">Ahead by ${fmt1(d)} ch. 先行</span>`
      : `<span class="pill warn">Behind by ${fmt1(-d)} ch. 遅れ</span>`;
  return `<div class="row between" style="flex-wrap:wrap;gap:6px">${status}<span class="sub">Target ${shortDate(p.end)} · ${p.daysLeft} days left</span></div>
    <div class="pace">
      <div class="stat"><b>${fmt1(p.perWeek)}</b><span>chapters / week needed</span></div>
      <div class="stat"><b>${fmt1(p.done)}<small class="muted">/${p.total}</small></b><span>done · expected ${fmt1(p.expected)}</span></div>
    </div>`;
}

function textbookCard(bookId, compact) {
  const book = bookById(bookId);
  const prog = bookProgress(bookId);
  const ch = nextChapter(bookId);
  return `<div class="card">
    <div class="row between">
      <div class="grow"><h3>${book.title} <span class="muted small">${book.ja}</span></h3>
      <div class="sub">${ch ? `Next: 第${ch.n}課 ${ch.ja} — ${ch.en}` : 'All chapters done!'}</div></div>
      ${compact ? `<button class="btn small" data-action="tab" data-tab="books">Open</button>` : ''}
    </div>
    <div class="bar" style="margin:12px 0 6px"><span style="width:${prog.ratio * 100}%"></span></div>
    <div class="sub small" style="margin-bottom:10px">${fmt1(prog.done)} / ${prog.total} chapters · ${Math.round(prog.ratio * 100)}%</div>
    ${paceHTML(bookId)}
    ${compact ? '' : `<label class="field"><span>Target date 目標日</span>
      <input class="input" type="date" value="${state.settings.targets[bookId]?.end || ''}" data-action="set-target" data-book="${bookId}"></label>
      <small class="muted small">Pace is measured from the day you set the target.</small>`}
  </div>`;
}

function viewBooks() {
  const id = selectedBook || currentBook().id;
  const book = bookById(id);
  const prog = bookProgress(id);
  return `
    <div class="segmented" style="margin-top:12px">${BOOKS.map((b) => `<button class="${b.id === id ? 'on' : ''}" data-action="pick-book" data-book="${b.id}">${b.title}</button>`).join('')}</div>
    ${textbookCard(id, false)}
    <div class="row" style="justify-content:flex-end;gap:8px;margin-bottom:4px">
      ${prog.ratio < 1 ? `<button class="btn small ghost" data-action="book-complete" data-book="${id}">Mark whole book done</button>` : ''}
      ${prog.done > 0 ? `<button class="btn small danger" data-action="book-reset" data-book="${id}">Reset</button>` : ''}
    </div>
    ${section('課', 'Chapters')}
    ${book.chapters.map((c) => chapterHTML(book, c)).join('')}
    ${section('リンク', 'Links')}
    <div class="link-list">
      <a class="link-tile" href="https://www.youtube.com/@TokiniAndy/playlists" target="_blank" rel="noopener"><span style="font-size:22px">▶︎</span><div class="grow"><b>ToKini Andy playlists</b><span>Genki & Quartet grammar videos</span></div>↗</a>
      <a class="link-tile" href="https://sydney.jpf.go.jp/japanese-studies/resources/japanese-conjugation-practice/" target="_blank" rel="noopener"><span style="font-size:22px">🔁</span><div class="grow"><b>Conjugation practice</b><span>The Japan Foundation, Sydney</span></div>↗</a>
    </div>`;
}

function chapterHTML(book, c) {
  const ch = peekChapter(book.id, c.n);
  const p = chapterProgress(book.id, c.n);
  const key = `${book.id}-${c.n}`;
  return `<details class="card chapter ${p >= 1 ? 'complete' : ''}" data-key="${key}" ${openChapters.has(key) ? 'open' : ''}>
    <summary>
      <span class="ch-num">${p >= 1 ? '✓' : c.n}</span>
      <span class="grow ch-title">第${c.n}課 ${c.ja}<span class="en">${c.en}</span></span>
      <span class="sub">${Math.round(p * 100)}%</span>
    </summary>
    <div class="ch-body">
      <div class="chips">${book.steps.map((s) => `<button class="chip ${ch.steps[s.id] ? 'on' : ''}" data-action="step" data-book="${book.id}" data-n="${c.n}" data-step="${s.id}">${ch.steps[s.id] ? '✓ ' : ''}${s.ja} ${s.en}</button>`).join('')}</div>
      ${c.grammar.length ? `<ul class="grammar">${c.grammar.map((gp, i) => `<li class="${ch.grammar[i] ? 'on' : ''}"><button class="check ${ch.grammar[i] ? 'on' : ''}" data-action="grammar" data-book="${book.id}" data-n="${c.n}" data-i="${i}" aria-label="Grammar point done">${ch.grammar[i] ? '✓' : ''}</button><span>${gp}</span></li>`).join('')}</ul>` : ''}
      <div class="row" style="margin-top:12px;flex-wrap:wrap;gap:8px">
        <a class="btn small" href="${book.video(c.n)}" target="_blank" rel="noopener">▶︎ ToKini Andy</a>
        <button class="btn small ghost" data-action="chapter-complete" data-book="${book.id}" data-n="${c.n}" data-v="${p >= 1 ? '0' : '1'}">${p >= 1 ? 'Reset chapter' : 'Mark chapter done'}</button>
        ${ch.done ? `<span class="sub small">Finished ${shortDate(ch.done)}</span>` : ''}
      </div>
    </div>
  </details>`;
}

function level(key) {
  const s = dayScore(key);
  return s >= 4 ? 4 : s;
}

function viewCalendar() {
  const y = calMonth.getFullYear();
  const m = calMonth.getMonth();
  const first = new Date(y, m, 1);
  const days = new Date(y, m + 1, 0).getDate();
  const t = today();
  let cells = '';
  for (let i = 0; i < first.getDay(); i++) cells += '<span class="cal-day blank"></span>';
  let monthDays = 0;
  for (let d = 1; d <= days; d++) {
    const key = dayKey(new Date(y, m, d));
    const entry = state.log[key] || {};
    if (dayScore(key)) monthDays++;
    const dots = ACTIVITIES.filter((a) => entry[a.id]).map((a) => `<i style="background:${a.color}"></i>`).join('');
    cells += `<button class="cal-day l${level(key)} ${key === t ? 'today' : ''} ${key > t ? 'future' : ''}" data-action="open-day" data-day="${key}">${d}<span class="cal-dots">${dots}</span></button>`;
  }

  // Last 26 weeks strip, oldest first, aligned on Sundays.
  const end = new Date();
  let start = addDays(end, -7 * 26 + 1);
  start = addDays(start, -start.getDay());
  let strip = '';
  for (let d = start; d <= end; d = addDays(d, 1)) strip += `<i class="l${level(dayKey(d))}" title="${dayKey(d)}"></i>`;

  const total = Object.keys(state.log).filter((k) => dayScore(k)).length;

  return `
    <div class="stats" style="margin-top:14px">
      <div class="stat"><b style="color:var(--sakura-deep)">${streak()}</b><span>Streak 連続</span></div>
      <div class="stat"><b>${bestStreak()}</b><span>Best 最高</span></div>
      <div class="stat"><b>${total}</b><span>Study days 合計</span></div>
    </div>

    ${section('暦', 'Calendar')}
    <div class="card">
      <div class="cal-head">
        <button class="btn small ghost" data-action="cal-prev" aria-label="Previous month">‹</button>
        <div class="center"><h3>${y}年${m + 1}月</h3><div class="sub">${first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} · ${monthDays} study days</div></div>
        <button class="btn small ghost" data-action="cal-next" aria-label="Next month">›</button>
      </div>
      <div class="cal-grid">${[...DOW_JA].map((d, i) => `<span class="cal-dow ${i === 0 ? 'sun' : ''}">${d}</span>`).join('')}${cells}</div>
      <div class="act-legend">${ACTIVITIES.map((a) => `<span><i style="background:${a.color}"></i>${a.en}</span>`).join('')}</div>
      <p class="sub small" style="margin-bottom:0">Tap a day to log or edit what you studied.</p>
    </div>

    ${section('半年', 'Last 6 months')}
    <div class="card"><div class="year-strip">${strip}</div>
      <div class="legend">less <i style="background:var(--heat-0)"></i><i style="background:var(--heat-1)"></i><i style="background:var(--heat-2)"></i><i style="background:var(--heat-3)"></i><i style="background:var(--heat-4)"></i> more</div></div>

    ${section('実績', 'Achievements', `<span class="sub">${Object.keys(state.badges).length}/${BADGES.length}</span>`)}
    <div class="badges">${BADGES.map((b) => `<div class="badge ${state.badges[b.id] ? '' : 'locked'}" title="${state.badges[b.id] ? `Earned ${state.badges[b.id]}` : 'Locked'}">
      <div class="b-icon">${b.icon}</div><div class="b-ja">${b.ja}</div><div class="b-en">${b.en}</div></div>`).join('')}</div>`;
}

function readingItem(b) {
  const pct = b.pages ? Math.min(100, ((b.current || 0) / b.pages) * 100) : 0;
  return `<div class="card book-item">
    <div class="row between">
      <div class="grow"><div class="title">${b.url ? `<a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(b.title)} ↗</a>` : esc(b.title)}</div>
      <div class="sub">${b.status === 'finished' && b.finished ? `Finished ${shortDate(b.finished)}` : b.started ? `Started ${shortDate(b.started)}` : 'Not started'}</div></div>
      <select class="input" style="width:auto;padding:6px 8px;font-size:13px" data-action="book-status" data-id="${b.id}">
        ${[['reading', '読書中 Reading'], ['planned', '積読 Planned'], ['finished', '読了 Finished']].map(([v, l]) => `<option value="${v}" ${b.status === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
    </div>
    ${b.pages ? `<div class="bar" style="margin:12px 0 6px"><span style="width:${pct}%"></span></div>` : ''}
    <div class="row between" style="margin-top:8px">
      ${b.status === 'reading' ? `<div class="stepper">
        <button data-action="page" data-id="${b.id}" data-d="-1" aria-label="Previous page">−</button>
        <input type="number" inputmode="numeric" min="0" value="${b.current || 0}" data-action="page-set" data-id="${b.id}" aria-label="Current page">
        <button data-action="page" data-id="${b.id}" data-d="1" aria-label="Next page">＋</button>
        <span class="sub">${b.pages ? `/ ${b.pages} p.` : 'p.'}</span></div>` : `<span class="sub">${b.pages ? `${b.pages} pages` : ''}</span>`}
      <button class="btn small danger" data-action="book-delete" data-id="${b.id}">Delete</button>
    </div>
  </div>`;
}

function viewReading() {
  const groups = [['reading', '読書中', 'Reading now'], ['planned', '積読', 'Up next'], ['finished', '読了', 'Finished']];
  return `
    <div style="height:4px"></div>
    ${groups.map(([st, ja, en]) => {
      const list = state.reading.filter((b) => b.status === st);
      return list.length ? `${section(ja, en)}${list.map(readingItem).join('')}` : '';
    }).join('')}
    ${state.reading.length ? '' : '<div class="empty">No books yet. Add the one you are reading — every page counts toward your streak. 📚</div>'}
    <div style="height:12px"></div>
    <details class="card chapter" ${state.reading.length ? '' : 'open'}>
      <summary><span class="ch-num">＋</span><span class="grow ch-title">本を追加<span class="en">Add a book</span></span></summary>
    <form class="ch-body" data-form="add-book">
      <label class="field"><span>Title 題名</span><input class="input" name="title" required placeholder="e.g. 魔女の宅急便"></label>
      <div class="row" style="gap:10px">
        <label class="field grow"><span>Pages ページ</span><input class="input" name="pages" type="number" inputmode="numeric" min="0" placeholder="240"></label>
        <label class="field grow"><span>Status</span><select class="input" name="status"><option value="reading">読書中 Reading</option><option value="planned">積読 Planned</option></select></label>
      </div>
      <label class="field"><span>Natively / book club link (optional)</span><input class="input" name="url" type="url" placeholder="https://learnnatively.com/book/…"></label>
      <button class="btn primary" type="submit">Add book 追加</button>
    </form></details>
    ${section('リンク', 'Links')}
    <div class="link-list">
      <a class="link-tile" href="https://learnnatively.com/" target="_blank" rel="noopener"><span style="font-size:22px">📚</span><div class="grow"><b>Natively</b><span>Graded library, reading log & book clubs</span></div>↗</a>
      <a class="link-tile" href="https://community.wanikani.com/search?q=book%20club" target="_blank" rel="noopener"><span style="font-size:22px">🐊</span><div class="grow"><b>WaniKani book clubs</b><span>Absolute beginner, beginner & intermediate clubs</span></div>↗</a>
    </div>`;
}

function viewNews() {
  if (!news && !newsError) {
    loadNews().then((n) => { news = n; render(); }).catch((e) => { newsError = e.message; render(); });
  }
  const items = news?.[newsTab] || [];
  const readCount = Object.values(state.newsRead).filter((d) => d === today()).length;
  return `
    <div class="segmented" style="margin-top:12px">
      <button class="${newsTab === 'easy' ? 'on' : ''}" data-action="news-tab" data-v="easy">やさしい Easy</button>
      <button class="${newsTab === 'regular' ? 'on' : ''}" data-action="news-tab" data-v="regular">ニュース Regular</button>
    </div>
    <div class="card">
      <div class="row between"><div><h3>${newsTab === 'easy' ? 'NHK NEWS WEB EASY' : 'NHK ニュース'}</h3>
      <div class="sub">${news?.updated ? `Updated ${new Date(news.updated).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Headlines refresh every few hours'} · ${readCount} read today</div></div></div>
      ${items.length
        ? items.map((n) => `<div class="news-item ${state.newsRead[n.url] ? 'read' : ''}">
            <span style="font-size:18px">${state.newsRead[n.url] ? '✓' : '📰'}</span>
            <div class="grow"><a href="${esc(n.url)}" target="_blank" rel="noopener" data-action="read-news" data-url="${esc(n.url)}">${esc(n.title)}</a>
            ${n.date ? `<div class="news-date">${esc(new Date(n.date).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}</div>` : ''}</div></div>`).join('')
        : `<div class="empty">${newsError || !news ? (newsError ? 'Headlines are not available yet.' : 'Loading…') : 'No headlines in this feed right now.'}<br>Open the sites directly below.</div>`}
    </div>
    ${section('リンク', 'Links')}
    <div class="link-list">
      <a class="link-tile" href="https://www3.nhk.or.jp/news/easy/" target="_blank" rel="noopener" data-action="read-news" data-url="nhk-easy-site"><span style="font-size:22px">🗞️</span><div class="grow"><b>NHK NEWS WEB EASY</b><span>やさしい日本語のニュース · furigana & audio</span></div>↗</a>
      <a class="link-tile" href="https://www3.nhk.or.jp/news/" target="_blank" rel="noopener" data-action="read-news" data-url="nhk-site"><span style="font-size:22px">📺</span><div class="grow"><b>NHK NEWS WEB</b><span>Regular news</span></div>↗</a>
    </div>
    <p class="sub small center">Tapping a headline logs “Read the news” for today.</p>`;
}

const VIEWS = { today: viewToday, calendar: viewCalendar, books: viewBooks, reading: viewReading, news: viewNews };

function render() {
  if (!VIEWS[tab]) tab = 'today';
  const view = $('#view');
  view.innerHTML = VIEWS[tab]();
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  $('#today-label').textContent = `${jaDate()} · ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`;
}

function setTab(t) {
  tab = t;
  history.replaceState(null, '', `#${t}`);
  render();
  window.scrollTo({ top: 0 });
}

// ---------- sheets ----------

function openSheet(html) {
  const sheet = $('#sheet');
  sheet.innerHTML = `<div class="sheet-grip"></div>${html}`;
  sheet.hidden = false;
  $('#sheet-backdrop').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeSheet() {
  $('#sheet').hidden = true;
  $('#sheet-backdrop').hidden = true;
  document.body.style.overflow = '';
  render();
}

function openDay(key) {
  const entry = state.log[key] || {};
  const d = parseDay(key);
  openSheet(`
    <h2>${jaDate(d)}</h2><p class="sub" style="margin-top:-4px">${enDate(d)}</p>
    <div class="card">
      ${ACTIVITIES.map((a) => `<div class="goal ${entry[a.id] ? 'done' : ''}">
        <button class="check ${entry[a.id] ? 'on' : ''}" data-action="day-toggle" data-day="${key}" data-id="${a.id}">${entry[a.id] ? '✓' : ''}</button>
        <span class="goal-icon">${a.icon}</span><div class="grow"><div class="goal-name">${a.en}<span class="ja">${a.ja}</span></div>
        ${typeof entry[a.id] === 'number' ? `<div class="sub">${entry[a.id]} ${a.id === 'news' ? 'articles' : a.id === 'reading' ? 'pages' : 'items'}</div>` : ''}</div></div>`).join('')}
    </div>
    <label class="field"><span>Notes メモ</span><textarea class="input" rows="3" data-action="day-note" data-day="${key}" placeholder="What did you learn today?">${esc(entry.note || '')}</textarea></label>
    <button class="btn primary" style="width:100%" data-action="close-sheet">Done 完了</button>`);
}

function openSettings() {
  const s = state.settings;
  openSheet(`
    <h2>設定 Settings</h2>
    <label class="field"><span>Your name 名前</span><input class="input" data-setting="name" value="${esc(s.name)}" placeholder="Used in the greeting"></label>

    <h3 style="margin:18px 0 0">ワニカニ WaniKani</h3>
    <label class="field"><span>Personal access token</span>
      <input class="input" type="password" autocomplete="off" data-setting="wkToken" value="${esc(s.wkToken)}" placeholder="xxxxxxxx-xxxx-…">
      <small>Create one at <a href="https://www.wanikani.com/settings/personal_access_tokens" target="_blank" rel="noopener">wanikani.com → Settings → API tokens</a> (default read-only permissions are enough). Stored only on this device.</small></label>
    <button class="btn small" data-action="sync-wk">Test connection</button>

    <h3 style="margin:18px 0 0">文プロ Bunpro</h3>
    <label class="field"><span>API key (experimental)</span>
      <input class="input" type="password" autocomplete="off" data-setting="bunproKey" value="${esc(s.bunproKey)}" placeholder="From Bunpro → Settings">
      <small>Bunpro has no stable public API; the legacy key endpoint is tried and, if refused, you log Bunpro by hand.</small></label>
    <button class="btn small" data-action="sync-bunpro">Test connection</button>

    <h3 style="margin:18px 0 4px">今日の目標 Daily goals</h3>
    ${ACTIVITIES.map((a) => `<div class="switch-row"><span>${a.icon} ${a.en} <span class="muted small">${a.ja}</span></span>
      <label class="switch"><input type="checkbox" data-goal="${a.id}" ${s.goals[a.id] ? 'checked' : ''}><span></span></label></div>`).join('')}

    <label class="field" style="margin-top:18px"><span>Theme テーマ</span>
      <select class="input" data-setting="theme">
        ${[['auto', 'Auto (system)'], ['light', '昼 Light'], ['dark', '夜桜 Night sakura']].map(([v, l]) => `<option value="${v}" ${s.theme === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select></label>

    <h3 style="margin:18px 0 4px">Backup バックアップ</h3>
    <p class="sub">Your data lives in this browser only. Export a backup now and then.</p>
    <div class="row" style="flex-wrap:wrap;gap:8px">
      <button class="btn" data-action="export">Export JSON</button>
      <label class="btn ghost">Import JSON<input type="file" accept="application/json,.json" data-action="import" hidden></label>
      <button class="btn danger" data-action="reset-all">Erase all</button>
    </div>

    <p class="sub small" style="margin-top:18px">Add to iPhone home screen: Safari → Share → “Add to Home Screen”.</p>
    <button class="btn primary" style="width:100%;margin-top:6px" data-action="close-sheet">Done 完了</button>`);
}

function applyTheme() {
  const t = state.settings.theme;
  if (t === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}

async function exportBackup() {
  const blob = new Blob([exportData()], { type: 'application/json' });
  const name = `benkyo-backup-${today()}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return;
    } catch {
      /* fall through to download */
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- sync ----------

async function runSync(kind, force) {
  if (busy[kind]) return;
  busy[kind] = true;
  if (tab === 'today') render();
  try {
    if (kind === 'wk') {
      await syncWaniKani({ force });
      delete errors.wk;
      if (force) toast('WaniKani synced ✓');
    } else {
      const r = await syncBunpro({ force });
      if (force) toast(r?.ok ? 'Bunpro synced ✓' : 'Bunpro API unavailable — log manually');
    }
  } catch (e) {
    errors[kind] = e.message;
    if (force) toast(`⚠︎ ${e.message}`);
  } finally {
    busy[kind] = false;
    if ($('#sheet').hidden) render();
  }
}

// ---------- events ----------

document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('.tabbar button');
  if (tabBtn) return setTab(tabBtn.dataset.tab);

  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action } = el.dataset;
  const n = Number(el.dataset.n);

  switch (action) {
    case 'tab': return setTab(el.dataset.tab);
    case 'open-settings': return openSettings();
    case 'close-sheet': return closeSheet();
    case 'toggle-goal': {
      const id = el.dataset.id;
      setActivity(id, !dayLog()[id]);
      return;
    }
    case 'sync-wk': return runSync('wk', true);
    case 'sync-bunpro': return runSync('bunpro', true);
    case 'pick-book': selectedBook = el.dataset.book; return render();
    case 'step': return toggleStep(el.dataset.book, n, el.dataset.step);
    case 'grammar': return toggleGrammar(el.dataset.book, n, Number(el.dataset.i));
    case 'chapter-complete': return setChapterComplete(el.dataset.book, n, el.dataset.v === '1');
    case 'book-complete':
      if (confirm(`Mark every chapter of ${bookById(el.dataset.book).title} as done?`)) setBookComplete(el.dataset.book, true);
      return;
    case 'book-reset':
      if (confirm(`Reset all progress for ${bookById(el.dataset.book).title}?`)) setBookComplete(el.dataset.book, false);
      return;
    case 'cal-prev': calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); return render();
    case 'cal-next': calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); return render();
    case 'open-day': return openDay(el.dataset.day);
    case 'day-toggle': {
      const { day, id } = el.dataset;
      setActivity(id, !(state.log[day] || {})[id], day);
      return openDay(day);
    }
    case 'page': {
      const b = state.reading.find((x) => x.id === el.dataset.id);
      const before = b.current || 0;
      b.current = Math.max(0, before + Number(el.dataset.d));
      logPages(b, b.current - before);
      return;
    }
    case 'book-delete': {
      const b = state.reading.find((x) => x.id === el.dataset.id);
      if (confirm(`Delete “${b.title}”?`)) {
        state.reading = state.reading.filter((x) => x !== b);
        save();
      }
      return;
    }
    case 'news-tab': newsTab = el.dataset.v; return render();
    case 'read-news': {
      if (!state.newsRead[el.dataset.url]) state.newsRead[el.dataset.url] = today();
      const count = Object.values(state.newsRead).filter((d) => d === today()).length;
      setActivity('news', count);
      return; // let the link open
    }
    case 'export': return exportBackup();
    case 'reset-all':
      if (confirm('Erase all progress on this device? Export a backup first!')) {
        localStorage.clear();
        location.reload();
      }
      return;
  }
});

// Pages read today are logged as a number so the calendar can show them.
function logPages(b, delta) {
  if (b.pages && b.current > b.pages) b.current = b.pages;
  b.started ||= today();
  if (delta > 0) {
    const entry = (state.log[today()] ||= {});
    entry.reading = (typeof entry.reading === 'number' ? entry.reading : 0) + delta;
  }
  save();
}

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.setting) {
    state.settings[el.dataset.setting] = el.value.trim();
    save();
    if (el.dataset.setting === 'theme') applyTheme();
    if (el.dataset.setting === 'wkToken') { delete state.cache.wk; save(); }
    if (el.dataset.setting === 'bunproKey') { delete state.cache.bunpro; save(); }
    return;
  }
  if (el.dataset.goal) {
    state.settings.goals[el.dataset.goal] = el.checked;
    save();
    return;
  }
  switch (el.dataset.action) {
    case 'set-target': return setTarget(el.dataset.book, el.value);
    case 'book-status': {
      const b = state.reading.find((x) => x.id === el.dataset.id);
      b.status = el.value;
      if (el.value === 'finished') {
        b.finished = today();
        if (b.pages) b.current = b.pages;
        const entry = (state.log[today()] ||= {});
        entry.reading ||= true;
      }
      if (el.value === 'reading') b.started ||= today();
      save();
      return;
    }
    case 'page-set': {
      const b = state.reading.find((x) => x.id === el.dataset.id);
      const before = b.current || 0;
      b.current = Math.max(0, Number(el.value) || 0);
      logPages(b, b.current - before);
      return;
    }
    case 'import': {
      const file = el.files[0];
      if (!file) return;
      file.text().then((txt) => {
        try {
          importData(txt);
          applyTheme();
          toast('Backup restored ✓');
          closeSheet();
        } catch (err) {
          toast(`⚠︎ ${err.message}`);
        }
      });
    }
  }
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.action === 'day-note') {
    const entry = (state.log[el.dataset.day] ||= {});
    if (el.value.trim()) entry.note = el.value;
    else delete entry.note;
    if (!Object.keys(entry).length) delete state.log[el.dataset.day];
    try { localStorage.setItem('benkyo-v1', JSON.stringify(state)); } catch { /* ignore */ }
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target;
  if (form.dataset.form !== 'add-book') return;
  e.preventDefault();
  const f = new FormData(form);
  const status = f.get('status');
  state.reading.unshift({
    id: Math.random().toString(36).slice(2, 10),
    title: f.get('title').trim(),
    pages: Number(f.get('pages')) || 0,
    url: f.get('url').trim(),
    current: 0,
    status,
    started: status === 'reading' ? today() : null,
  });
  save();
  toast('Book added 📚');
});

document.addEventListener('toggle', (e) => {
  const d = e.target;
  if (d.tagName !== 'DETAILS' || !d.dataset.key) return;
  if (d.open) openChapters.add(d.dataset.key);
  else openChapters.delete(d.dataset.key);
}, true);

$('#sheet-backdrop').addEventListener('click', closeSheet);

onChange(() => {
  const earned = checkBadges();
  if (earned.length) toast(`${earned[0].icon} 実績解除！ ${earned[0].en}`);
  if ($('#sheet').hidden) render();
});

window.addEventListener('hashchange', () => setTab((location.hash || '#today').slice(1)));

// Re-sync when coming back to the app (iOS keeps PWAs suspended).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    runSync('wk', false);
    runSync('bunpro', false);
    render();
  }
});

// ---------- boot ----------

applyTheme();
render();
checkBadges();
runSync('wk', false);
runSync('bunpro', false);

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
