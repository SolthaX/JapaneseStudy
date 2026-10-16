import { BOOKS, bookById, lessonSpec } from './curriculum.js';
import { J, jx, T, jt, resolve, setKnown, dateSpec, monthSpec, numKana, DOW, installFurigana } from './jp.js';
import {
  state, save, onChange, ACTIVITIES, activeGoals, dayLog, setActivity, today, dayKey, parseDay, addDays,
  dayScore, streak, bestStreak, studyDaysInLast, exportData, importData,
} from './store.js';
import { syncWaniKani, loadNews, SRS_GROUPS } from './api.js';
import {
  bookProgress, nextChapter, currentBook, peekChapter, chapterProgress, toggleStep, toggleGrammar,
  setChapterComplete, setBookComplete, pacing, setTarget, BADGES, checkBadges,
} from './progress.js';

// ---------- helpers ----------

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt1 = (n) => (Math.round(n * 10) / 10).toLocaleString('en');

/** Japanese date if its kanji are learned, else null. */
function jaDate(d = new Date()) {
  const r = resolve(dateSpec(d), '', { whole: true });
  return r.jp ? r.html : null;
}
const chapterLabel = (n, titleSpec, en) => {
  const lesson = J(lessonSpec(n, numKana));
  return titleSpec ? `${lesson} ${J(titleSpec, en)}` : lesson;
};
const chapterText = (n, titleSpec, en) => {
  const lesson = T(lessonSpec(n, numKana));
  return titleSpec ? `${lesson} ${T(titleSpec, en)}` : lesson;
};
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

/** Section heading: Japanese (as far as learned) with the English as a hint. */
function section(spec, en, extra = '') {
  const r = resolve(spec, en);
  return `<h2 class="section-title"><span><span class="ja">${r.html}</span>${r.jp ? `<span class="en">${en}</span>` : ''}</span>${extra}</h2>`;
}
/** "English 日本語" label where the Japanese part only appears once learned. */
const bi = (en, spec) => {
  const ja = jx(spec);
  return ja ? `${en} <span class="ja-hint">${ja}</span>` : en;
};

// ---------- ことわざ ----------

const PROVERBS = [
  ['[継続|けいぞく|persistence]は[力|ちから|power]なり', 'Persistence is power.'],
  ['[塵|ちり|dust]も[積もれ|つもれ|piled up]ば[山|やま|mountain]となる', 'Even dust, piled up, becomes a mountain.'],
  ['[七転び|ななころび|fall seven times][八起き|やおき|rise eight]', 'Fall seven times, get up eight.'],
  ['[千里|せんり|a thousand miles]の[道|みち|road]も[一歩|いっぽ|one step]から', 'A journey of a thousand miles begins with one step.'],
  ['[石|いし|stone]の[上|うえ|on]にも[三年|さんねん|three years]', 'Three years on a cold stone — perseverance wins.'],
  ['[急がば|いそがば|if in a hurry][回れ|まわれ|go around]', 'When in a hurry, take the long way round.'],
  ['[習う|ならう|learning]より[慣れろ|なれろ|get used to it]', 'Get used to it rather than just learning it.'],
  ['[雨垂れ|あまだれ|raindrops][石|いし|stone]を[穿つ|うがつ|pierce]', 'Dripping rain wears through stone.'],
  ['[好き|すき|love]こそ[物|もの|things]の[上手|じょうず|skill]なれ', 'What you love, you become good at.'],
  ['[為せば|なせば|if you act][成る|なる|it happens]', 'If you act, it can be done.'],
  ['[初心|しょしん|beginner\'s spirit][忘る|わする|forget]べからず', "Never forget your beginner's spirit."],
  ['[猿|さる|monkeys]も[木|き|tree]から[落ちる|おちる|fall]', 'Even monkeys fall from trees.'],
  ['[一期一会|いちごいちえ|once-in-a-lifetime meeting]', 'One time, one meeting — treasure each moment.'],
  ['[明日|あした|tomorrow]は[明日|あした|tomorrow]の[風|かぜ|wind]が[吹く|ふく|blows]', "Tomorrow's wind will blow tomorrow."],
  ['[花|はな|flowers]より[団子|だんご|dumplings]', 'Dumplings over flowers.'],
  ['[案ずる|あんずる|worrying]より[産む|うむ|doing]が[易し|やすし|easy]', 'Doing is easier than worrying.'],
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
const busy = { wk: false };
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
  switch (a.id) {
    case 'wk':
      if (!state.settings.wkToken) return 'Add your API token in settings for auto-tracking';
      if (!wk) return 'Syncing…';
      return `${log.wk && log.wk !== true ? `${log.wk} reviewed today · ` : ''}${wk.reviews} reviews · ${wk.lessons} lessons waiting${state.cache.known ? ` · ${state.cache.known.length} kanji learned` : ''}`;
    case 'bunpro':
      return 'Tick when your Bunpro reviews are done';
    case 'textbook': {
      const b = currentBook();
      const ch = nextChapter(b.id);
      return ch ? `${b.title} · ${chapterLabel(ch.n, ch.ja, ch.en)}` : `${b.title} finished 🎉`;
    }
    case 'conj':
      return 'Japan Foundation Sydney conjugation practice';
    case 'reading': {
      const r = state.reading.find((x) => x.status === 'reading');
      return r ? `${esc(r.title)}${r.pages ? ` · p.${r.current || 0}/${r.pages}` : ''}` : 'Natively · WaniKani book clubs';
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
  const [pjp, pen] = proverbOfDay();

  return `
    <div class="card hero">
      ${studiedToday ? petals() : ''}
      <div class="hero-top">
        <div><div class="greeting">${hi}</div><div class="greeting-en">${hiEn} · ${enDate(new Date())}</div></div>
        <div class="streak"><div class="streak-num">${s}</div><div class="streak-label">${bi('day streak', '[日連続|にちれんぞく|]')}</div></div>
      </div>
      <div class="tree-wrap">${treeSVG(blooms)}</div>
      <div class="tree-caption"><span>${blooms}/30 ${bi('days in bloom', '[開花|かいか|]')}</span><span>${blooms >= 30 ? bi('Full bloom!', '[満開|まんかい|]！') : `${30 - blooms} ${bi('days to full bloom', '[満開|まんかい|]まで')}`}</span></div>
    </div>

    ${section("[今日|きょう|Today's]の[目標|もくひょう|goals]", 'Daily goals')}
    <div class="card">
      <div class="row between" style="margin-bottom:4px">
        <div><h3>${doneCount === goals.length && goals.length ? J('お[疲れ様|つかれさま|good work]でした！', 'Great work!') : 'がんばって！'}</h3>
        <div class="sub">${doneCount === goals.length && goals.length ? 'All goals done today. Great work.' : `${goals.length - doneCount} left for today`}</div></div>
        ${ring(doneCount, goals.length)}
      </div>
      ${goals.map((a) => `
        <div class="goal ${log[a.id] ? 'done' : ''}">
          <button class="check ${log[a.id] ? 'on' : ''}" data-action="toggle-goal" data-id="${a.id}" aria-label="Mark ${a.en} done">${log[a.id] ? '✓' : ''}</button>
          <span class="goal-icon">${a.icon}</span>
          <div class="grow"><div class="goal-name">${a.en}<span class="ja">${jx(a.ja)}</span></div><div class="sub">${goalDetail(a)}</div></div>
          ${goalOpen(a)}
        </div>`).join('') || '<div class="empty">No goals enabled — pick some in settings ⚙︎</div>'}
    </div>

    ${section('ワニカニ', 'WaniKani', state.settings.wkToken ? `<button class="btn small ghost" data-action="sync-wk">${busy.wk ? '…' : '↻ Sync'}</button>` : '')}
    ${wkCard()}

    ${section('[文プロ|ぶんプロ|Bunpro]', 'Bunpro')}
    ${bunproCard()}

    ${section('[教科書|きょうかしょ|Textbook]', 'Textbook')}
    ${textbookCard(currentBook().id, true)}

    ${section('ウィジェット', 'Widget')}
    <div class="card"><div class="row between">
      <div class="grow"><h3>Home screen widget</h3><div class="sub">${state.widgetSyncedAt ? `Updated ${new Date(state.widgetSyncedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}${dayKey(new Date(state.widgetSyncedAt)) === today() ? '' : ` · ${shortDate(dayKey(new Date(state.widgetSyncedAt)))}`}` : 'Set it up in ⚙︎ Settings'}</div></div>
      <button class="btn primary small" data-action="update-widget">Update 🌸</button></div></div>

    ${section("[今日|きょう|Today's]の[ことわざ|ことわざ|proverb]", 'Proverb of the day')}
    <div class="card proverb">${jx(pjp) ? `<div class="jp">${jx(pjp)}</div>` : ''}<div style="margin-top:6px">${pen}</div>
    ${jx(pjp) ? '<div class="muted small" style="margin-top:6px">Tap a kanji to see its reading.</div>' : ''}</div>
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
      <div class="stat"><b>${wk.lessons}</b><span>${bi('Lessons', '[授業|じゅぎょう|]')}</span></div>
      <div class="stat"><b style="color:var(--sakura-deep)">${wk.reviews}</b><span>${bi('Reviews', '[復習|ふくしゅう|]')}</span></div>
      <div class="stat"><b>${wk.forecast.reduce((a, b) => a + b.n, 0)}</b><span>Next 24h</span></div>
    </div>
    <div class="forecast" aria-label="Review forecast for the next 24 hours">${wk.forecast.map((b) => `<span style="height:${(b.n / max) * 100}%" title="${new Date(b.at).getHours()}:00 — ${b.n}"></span>`).join('')}</div>
    <div class="forecast-axis"><span>now</span><span>+12h</span><span>+24h</span></div>
    ${wk.srs ? `<div class="srs">${SRS_GROUPS.map((g) => `<span style="width:${(wk.srs[g.id] / srsTotal) * 100}%;background:${g.color}"></span>`).join('')}</div>
    <div class="srs-legend">${SRS_GROUPS.map((g) => `<span><i style="background:${g.color}"></i>${bi(g.en, g.ja)} ${wk.srs[g.id]}</span>`).join('')}</div>` : ''}
    ${errors.wk ? `<p class="sub">⚠︎ ${esc(errors.wk)}</p>` : ''}
    <div class="sub small" style="margin-top:8px">Updated ${new Date(wk.fetchedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
  </div>`;
}

function bunproCard() {
  const done = dayLog().bunpro;
  return `<div class="card"><div class="row between">
    <div class="grow"><h3>${done ? J('お[疲れ様|つかれさま|good work]！', 'Great work!') : bi('Grammar reviews', '[文法|ぶんぽう|]の[復習|ふくしゅう|]')}</h3>
    <div class="sub">Bunpro has no API — tick it once your reviews are done.</div></div></div>
    <div class="row" style="margin-top:12px">
      <button class="btn ${done ? '' : 'primary'}" data-action="toggle-goal" data-id="bunpro">${done ? '✓ Done today' : 'Mark reviews done'}</button>
      <a class="btn ghost" href="https://bunpro.jp/dashboard" target="_blank" rel="noopener">Open Bunpro ↗</a>
    </div></div>`;
}

function paceHTML(bookId) {
  const p = pacing(bookId);
  if (!p) return `<p class="sub">No target date yet. Set one to get a weekly pace.</p>`;
  if (p.finished) return `<span class="pill ok">✓ ${bi('Finished', '[卒業|そつぎょう|]')}</span>`;
  const d = p.delta;
  const status = Math.abs(d) < 0.25
    ? `<span class="pill ai">${bi('On track', '[順調|じゅんちょう|]')}</span>`
    : d > 0
      ? `<span class="pill ok">${bi(`Ahead by ${fmt1(d)} ch.`, '[先行|せんこう|]')}</span>`
      : `<span class="pill warn">${bi(`Behind by ${fmt1(-d)} ch.`, '[遅れ|おくれ|]')}</span>`;
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
      <div class="sub">${ch ? `Next: ${chapterLabel(ch.n, ch.ja, ch.en)}${resolve(ch.ja || ' ', '').jp && ch.ja ? ` — ${ch.en}` : ''}` : 'All chapters done!'}</div></div>
      ${compact ? `<button class="btn small" data-action="tab" data-tab="books">Open</button>` : ''}
    </div>
    <div class="bar" style="margin:12px 0 6px"><span style="width:${prog.ratio * 100}%"></span></div>
    <div class="sub small" style="margin-bottom:10px">${fmt1(prog.done)} / ${prog.total} chapters · ${Math.round(prog.ratio * 100)}%</div>
    ${paceHTML(bookId)}
    ${compact ? '' : `<label class="field"><span>${bi('Target date', '[目標日|もくひょうび|]')}</span>
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
    ${section('[課|か|Chapters]', 'Chapters')}
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
      <span class="grow ch-title">${chapterLabel(c.n, c.ja, c.en)}${c.ja && !resolve(c.ja, c.en).jp ? '' : `<span class="en">${c.en}</span>`}</span>
      <span class="sub">${Math.round(p * 100)}%</span>
    </summary>
    <div class="ch-body">
      <div class="chips">${book.steps.map((s) => `<button class="chip ${ch.steps[s.id] ? 'on' : ''}" data-action="step" data-book="${book.id}" data-n="${c.n}" data-step="${s.id}">${ch.steps[s.id] ? '✓ ' : ''}${bi(s.en, s.ja)}</button>`).join('')}</div>
      ${c.grammar.length ? `<ul class="grammar">${c.grammar.map((gp, i) => `<li class="${ch.grammar[i] ? 'on' : ''}"><button class="check ${ch.grammar[i] ? 'on' : ''}" data-action="grammar" data-book="${book.id}" data-n="${c.n}" data-i="${i}" aria-label="Grammar point done">${ch.grammar[i] ? '✓' : ''}</button><span>${J(gp)}</span></li>`).join('')}</ul>` : ''}
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
      <div class="stat"><b style="color:var(--sakura-deep)">${streak()}</b><span>${bi('Streak', '[連続|れんぞく|]')}</span></div>
      <div class="stat"><b>${bestStreak()}</b><span>${bi('Best', '[最高|さいこう|]')}</span></div>
      <div class="stat"><b>${total}</b><span>${bi('Study days', '[合計|ごうけい|]')}</span></div>
    </div>

    ${section('[暦|こよみ|Calendar]', 'Calendar')}
    <div class="card">
      <div class="cal-head">
        <button class="btn small ghost" data-action="cal-prev" aria-label="Previous month">‹</button>
        <div class="center"><h3>${J(monthSpec(y, m + 1), first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }), { whole: true })}</h3><div class="sub">${resolve(monthSpec(y, m + 1), '', { whole: true }).jp ? `${first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} · ` : ''}${monthDays} study days</div></div>
        <button class="btn small ghost" data-action="cal-next" aria-label="Next month">›</button>
      </div>
      <div class="cal-grid">${DOW.map(([k, r, en], i) => `<span class="cal-dow ${i === 0 ? 'sun' : ''}">${J(`[${k}|${r}|${en.slice(0, 2)}]`)}</span>`).join('')}${cells}</div>
      <div class="act-legend">${ACTIVITIES.map((a) => `<span><i style="background:${a.color}"></i>${a.en}</span>`).join('')}</div>
      <p class="sub small" style="margin-bottom:0">Tap a day to log or edit what you studied.</p>
    </div>

    ${section('[半年|はんとし|Last 6 months]', 'Last 6 months')}
    <div class="card"><div class="year-strip">${strip}</div>
      <div class="legend">less <i style="background:var(--heat-0)"></i><i style="background:var(--heat-1)"></i><i style="background:var(--heat-2)"></i><i style="background:var(--heat-3)"></i><i style="background:var(--heat-4)"></i> more</div></div>

    ${section('[実績|じっせき|Achievements]', 'Achievements', `<span class="sub">${Object.keys(state.badges).length}/${BADGES.length}</span>`)}
    <div class="badges">${BADGES.map((b) => `<div class="badge ${state.badges[b.id] ? '' : 'locked'}" title="${state.badges[b.id] ? `Earned ${state.badges[b.id]}` : 'Locked'}">
      <div class="b-icon">${b.icon}</div>${jx(b.ja) ? `<div class="b-ja">${jx(b.ja)}</div>` : ''}<div class="b-en">${b.en}</div></div>`).join('')}</div>`;
}

const STATUSES = [['reading', '[読書中|どくしょちゅう|]', 'Reading'], ['planned', '[積読|つんどく|]', 'Planned'], ['finished', '[読了|どくりょう|]', 'Finished']];
const optLabel = (spec, en) => [jt(spec), en].filter(Boolean).join(' ');

function readingItem(b) {
  const pct = b.pages ? Math.min(100, ((b.current || 0) / b.pages) * 100) : 0;
  return `<div class="card book-item">
    <div class="row between">
      <div class="grow"><div class="title">${b.url ? `<a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(b.title)} ↗</a>` : esc(b.title)}</div>
      <div class="sub">${b.status === 'finished' && b.finished ? `Finished ${shortDate(b.finished)}` : b.started ? `Started ${shortDate(b.started)}` : 'Not started'}</div></div>
      <select class="input" style="width:auto;padding:6px 8px;font-size:13px" data-action="book-status" data-id="${b.id}">
        ${STATUSES.map(([v, spec, l]) => `<option value="${v}" ${b.status === v ? 'selected' : ''}>${optLabel(spec, l)}</option>`).join('')}
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
  const groups = [['reading', '[読書中|どくしょちゅう|Reading now]', 'Reading now'], ['planned', '[積読|つんどく|Up next]', 'Up next'], ['finished', '[読了|どくりょう|Finished]', 'Finished']];
  return `
    <div style="height:4px"></div>
    ${groups.map(([st, ja, en]) => {
      const list = state.reading.filter((b) => b.status === st);
      return list.length ? `${section(ja, en)}${list.map(readingItem).join('')}` : '';
    }).join('')}
    ${state.reading.length ? '' : '<div class="empty">No books yet. Add the one you are reading — every page counts toward your streak. 📚</div>'}
    <div style="height:12px"></div>
    <details class="card chapter" ${state.reading.length ? '' : 'open'}>
      <summary><span class="ch-num">＋</span><span class="grow ch-title">${J('[本|ほん|book]を[追加|ついか|add]', 'Add a book')}${resolve('[本|ほん|book]を[追加|ついか|add]', 'x').jp ? '<span class="en">Add a book</span>' : ''}</span></summary>
    <form class="ch-body" data-form="add-book">
      <label class="field"><span>${bi('Title', '[題名|だいめい|]')}</span><input class="input" name="title" required placeholder="e.g. よつばと！"></label>
      <div class="row" style="gap:10px">
        <label class="field grow"><span>Pages ページ</span><input class="input" name="pages" type="number" inputmode="numeric" min="0" placeholder="240"></label>
        <label class="field grow"><span>Status</span><select class="input" name="status">${STATUSES.slice(0, 2).map(([v, spec, l]) => `<option value="${v}">${optLabel(spec, l)}</option>`).join('')}</select></label>
      </div>
      <label class="field"><span>Natively / book club link (optional)</span><input class="input" name="url" type="url" placeholder="https://learnnatively.com/book/…"></label>
      <button class="btn primary" type="submit">${bi('Add book', '[追加|ついか|]')}</button>
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
      <a class="link-tile" href="https://www3.nhk.or.jp/news/easy/" target="_blank" rel="noopener" data-action="read-news" data-url="nhk-easy-site"><span style="font-size:22px">🗞️</span><div class="grow"><b>NHK NEWS WEB EASY</b><span>${jx('やさしい[日本語|にほんご|]の')}ニュース · furigana & audio</span></div>↗</a>
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
  const ja = jaDate();
  $('#today-label').innerHTML = `${ja ? `${ja} · ` : ''}${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`;
  renderChrome();
}

const TABS = [
  ['today', '[今日|きょう|]', '🌸', 'Today'],
  ['calendar', '[暦|こよみ|]', '📅', 'Calendar'],
  ['books', '[教科書|きょうかしょ|]', '📖', 'Books'],
  ['reading', '[読書|どくしょ|]', '📚', 'Reading'],
  ['news', '[新聞|しんぶん|]', '📰', 'News'],
];

/** Tab bar and brand follow the learned-kanji rule too. */
function renderChrome() {
  document.querySelectorAll('.tabbar button').forEach((b) => {
    const [, spec, icon, en] = TABS.find((t) => t[0] === b.dataset.tab);
    b.innerHTML = `<span class="tab-ja">${jx(spec) || icon}</span><span class="tab-en">${en}</span>`;
  });
  const study = jx('[勉強|べんきょう|]');
  $('.brand-title').innerHTML = study ? `${study} <small>Benkyō</small>` : 'Benkyō';
  $('.brand-mark').innerHTML = jx('[桜|さくら|]') || '🌸';
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
    <h2>${jaDate(d) || enDate(d)}</h2>${jaDate(d) ? `<p class="sub" style="margin-top:-4px">${enDate(d)}</p>` : ''}
    <div class="card">
      ${ACTIVITIES.map((a) => `<div class="goal ${entry[a.id] ? 'done' : ''}">
        <button class="check ${entry[a.id] ? 'on' : ''}" data-action="day-toggle" data-day="${key}" data-id="${a.id}">${entry[a.id] ? '✓' : ''}</button>
        <span class="goal-icon">${a.icon}</span><div class="grow"><div class="goal-name">${a.en}<span class="ja">${jx(a.ja)}</span></div>
        ${typeof entry[a.id] === 'number' ? `<div class="sub">${entry[a.id]} ${a.id === 'news' ? 'articles' : a.id === 'reading' ? 'pages' : 'items'}</div>` : ''}</div></div>`).join('')}
    </div>
    <label class="field"><span>Notes メモ</span><textarea class="input" rows="3" data-action="day-note" data-day="${key}" placeholder="What did you learn today?">${esc(entry.note || '')}</textarea></label>
    <button class="btn primary" style="width:100%" data-action="close-sheet">${bi('Done', '[完了|かんりょう|]')}</button>`);
}

function openSettings() {
  const s = state.settings;
  openSheet(`
    <h2>${bi('Settings', '[設定|せってい|]')}</h2>
    <p class="sub">${state.cache.known ? `${state.cache.known.length} kanji learned on WaniKani — only these appear in Japanese. Tap one to see its reading.` : 'Connect WaniKani: Japanese appears as you learn kanji (Guru).'}</p>
    <label class="field"><span>${bi('Your name', '[名前|なまえ|]')}</span><input class="input" data-setting="name" value="${esc(s.name)}" placeholder="Used in the greeting"></label>

    <h3 style="margin:18px 0 0">ワニカニ WaniKani</h3>
    <label class="field"><span>Personal access token</span>
      <input class="input" type="password" autocomplete="off" data-setting="wkToken" value="${esc(s.wkToken)}" placeholder="xxxxxxxx-xxxx-…">
      <small>Create one at <a href="https://www.wanikani.com/settings/personal_access_tokens" target="_blank" rel="noopener">wanikani.com → Settings → API tokens</a> (default read-only permissions are enough). Stored only on this device.</small></label>
    <button class="btn small" data-action="sync-wk">Test connection</button>

    <h3 style="margin:18px 0 0">ウィジェット Home screen widget</h3>
    <p class="sub">Uses the free <a href="https://apps.apple.com/app/scriptable/id1405459188" target="_blank" rel="noopener">Scriptable</a> app (small, medium or large widget).</p>
    <ol class="sub" style="padding-left:18px;margin:6px 0">
      <li>Install Scriptable, then tap <b>Copy widget script</b>.</li>
      <li>In Scriptable tap ＋, paste, and name the script <b>${WIDGET_SCRIPT}</b>.</li>
      <li>Back here tap <b>Update widget</b> (sends your progress and WaniKani token).</li>
      <li>Long-press the home screen → ＋ → Scriptable → <b>Large</b> → edit it and pick <b>${WIDGET_SCRIPT}</b>.</li>
    </ol>
    <div class="row" style="flex-wrap:wrap;gap:8px">
      <button class="btn" data-action="copy-widget">Copy widget script</button>
      <button class="btn primary" data-action="update-widget">Update widget 🌸</button>
    </div>
    <p class="sub small">${state.widgetSyncedAt ? `Last update ${new Date(state.widgetSyncedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : 'Not sent yet.'}</p>

    <h3 style="margin:18px 0 4px">${section("[今日|きょう|Today's]の[目標|もくひょう|goals]", 'Daily goals').replace(/<\/?h2[^>]*>/g, '')}</h3>
    ${ACTIVITIES.map((a) => `<div class="switch-row"><span>${a.icon} ${a.en} <span class="muted small">${jx(a.ja)}</span></span>
      <label class="switch"><input type="checkbox" data-goal="${a.id}" ${s.goals[a.id] ? 'checked' : ''}><span></span></label></div>`).join('')}

    <label class="field" style="margin-top:18px"><span>Theme テーマ</span>
      <select class="input" data-setting="theme">
        ${[['auto', '', 'Auto (system)'], ['light', '[昼|ひる|]', 'Light'], ['dark', '[夜桜|よざくら|]', 'Night sakura']].map(([v, spec, l]) => `<option value="${v}" ${s.theme === v ? 'selected' : ''}>${spec ? optLabel(spec, l) : l}</option>`).join('')}
      </select></label>

    <h3 style="margin:18px 0 4px">Backup バックアップ</h3>
    <p class="sub">Your data lives in this browser only. Export a backup now and then.</p>
    <div class="row" style="flex-wrap:wrap;gap:8px">
      <button class="btn" data-action="export">Export JSON</button>
      <label class="btn ghost">Import JSON<input type="file" accept="application/json,.json" data-action="import" hidden></label>
      <button class="btn danger" data-action="reset-all">Erase all</button>
    </div>

    <p class="sub small" style="margin-top:18px">Add to iPhone home screen: Safari → Share → “Add to Home Screen”.</p>
    <button class="btn primary" style="width:100%;margin-top:6px" data-action="close-sheet">${bi('Done', '[完了|かんりょう|]')}</button>`);
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

// ---------- widget (Scriptable) ----------

const WIDGET_SCRIPT = 'Benkyo Widget';

function widgetPayload() {
  const t = today();
  const heat = [];
  for (let i = 29; i >= 0; i--) heat.push(Math.min(4, dayScore(dayKey(addDays(new Date(), -i)))));
  const log = dayLog();
  const b = currentBook();
  const prog = bookProgress(b.id);
  const ch = nextChapter(b.id);
  const p = pacing(b.id);
  let pace = null;
  if (p && !p.finished) {
    if (Math.abs(p.delta) < 0.25) pace = { label: jt('[順調|じゅんちょう|]') || 'On track', kind: 'on' };
    else if (p.delta > 0) pace = { label: `+${fmt1(p.delta)} ch. ${jt('[先行|せんこう|]')}`.trim(), kind: 'ahead' };
    else pace = { label: `−${fmt1(-p.delta)} ch. ${jt('[遅れ|おくれ|]')}`.trim(), kind: 'behind' };
  }
  const r = state.reading.find((x) => x.status === 'reading');
  const [pja, pen] = proverbOfDay();
  const plain = (en, spec) => [en, jt(spec)].filter(Boolean).join(' ');
  const SHORT = { wk: 'WK', bunpro: 'Bunpro', textbook: 'Book', conj: 'Conj.', reading: 'Read', news: 'News' };
  return {
    benkyo: 1,
    day: t,
    streak: streak(),
    studiedToday: dayScore(t) > 0,
    heat,
    goals: activeGoals().map((a) => ({ id: a.id, icon: a.icon, label: jt(a.ja) || SHORT[a.id], done: !!log[a.id] })),
    book: { title: b.title, next: ch ? chapterText(ch.n, ch.ja, ch.en) : null, ratio: prog.ratio, done: Math.floor(prog.done), total: prog.total, pace },
    reading: r ? { title: r.title, current: r.current || 0, pages: r.pages || 0 } : null,
    proverb: { ja: jt(pja), en: pen },
    dateKanji: [...'月日火水木金土'].filter((k) => jt(`[${k}|x|]`)).join(''),
    labels: {
      brand: jt('[勉強|べんきょう|]') ? `${jt('[桜|さくら|]') || '🌸'} ${jt('[勉強|べんきょう|]')}` : '🌸 Benkyō',
      mark: jt('[桜|さくら|]') || '🌸',
      streak: [jt('[日連続|にちれんぞく|]'), 'streak'].filter(Boolean).join(' · '),
      streakShort: jt('[日連続|にちれんぞく|]') || 'days',
      level: 'Level レベル',
      lessons: plain('Lessons', '[授業|じゅぎょう|]'),
      reviews: plain('Reviews', '[復習|ふくしゅう|]'),
      reviewsShort: jt('[復習|ふくしゅう|]') || 'reviews',
      forecast: plain('Next 24h', '[予報|よほう|]'),
      goals: T("[今日|きょう|Today's]の[目標|もくひょう|goals]", 'Daily goals'),
      goalsShort: jt('[目標|もくひょう|]') || 'Goals',
      allDone: T('お[疲れ様|つかれさま|good work]！', 'Great work!'),
      bloom: plain('days in bloom', '[開花|かいか|]'),
    },
    appUrl: location.href.split('#')[0],
    token: state.settings.wkToken || '',
  };
}

function updateWidget() {
  const json = JSON.stringify(widgetPayload());
  // Clipboard copy is a fallback: the script also reads it when run by hand.
  navigator.clipboard?.writeText(json).catch(() => {});
  state.widgetSyncedAt = Date.now();
  save();
  location.href = `scriptable:///run/${encodeURIComponent(WIDGET_SCRIPT)}?payload=${encodeURIComponent(json)}`;
}

async function copyWidgetScript() {
  const src = fetch('widget/benkyo-widget.js').then((r) => r.text());
  try {
    // Safari only allows clipboard writes inside the tap, so hand it a pending blob.
    await navigator.clipboard.write([new ClipboardItem({ 'text/plain': src.then((t) => new Blob([t], { type: 'text/plain' })) })]);
  } catch {
    await navigator.clipboard.writeText(await src);
  }
  toast('Widget script copied — paste it into Scriptable');
}

// ---------- sync ----------

async function runSync(kind, force) {
  if (busy[kind]) return;
  busy[kind] = true;
  if (tab === 'today') render();
  try {
    if (kind === 'wk') {
      await syncWaniKani({ force });
      setKnown(state.cache.known || '');
      delete errors.wk;
      if (force) toast('WaniKani synced ✓');
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
    case 'update-widget': return updateWidget();
    case 'copy-widget': return copyWidgetScript();
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
  if (earned.length) toast(`${earned[0].icon} ${jt('[実績解除|じっせきかいじょ|]！') || 'Unlocked!'} ${earned[0].en}`);
  if ($('#sheet').hidden) render();
});

window.addEventListener('hashchange', () => setTab((location.hash || '#today').slice(1)));

// Re-sync when coming back to the app (iOS keeps PWAs suspended).
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    runSync('wk', false);
    render();
  }
});

// ---------- boot ----------

setKnown(state.cache.known || '');
installFurigana();
applyTheme();
render();
checkBadges();
runSync('wk', false);

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
