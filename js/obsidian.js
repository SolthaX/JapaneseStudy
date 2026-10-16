// Markdown export for an Obsidian vault: a zip of notes under "Benkyō/".
// Notes are regenerated on each export (frontmatter included, so Dataview and
// Claude can query them); edit your own notes elsewhere and link to these.

import { BOOKS } from './curriculum.js';
import { state, ACTIVITIES, streak, bestStreak, dayScore, dayKey, parseDay, addDays, today } from './store.js';
import { bookProgress, chapterProgress, peekChapter, nextChapter, pacing, currentBook, BADGES } from './progress.js';
import { SRS_GROUPS } from './api.js';
import { fullJa } from './jp.js';

const ROOT = 'Benkyō';
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pct = (r) => `${Math.round(r * 100)}%`;
const r1 = (n) => Math.round(n * 10) / 10;
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const yaml = (v) => (typeof v === 'string' ? JSON.stringify(v) : v ?? 'null');

function frontmatter(obj) {
  return `---\n${Object.entries(obj).map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.join(', ')}]` : yaml(v)}`).join('\n')}\n---\n`;
}

const stamp = () => `> Exported from Benkyō on ${new Date().toLocaleString('en-GB')}. Re-export to refresh: this note is overwritten.\n`;

function activityList(entry) {
  return ACTIVITIES.filter((a) => entry?.[a.id]).map((a) => {
    const v = entry[a.id];
    const n = typeof v === 'number' ? ` (${v}${a.id === 'reading' ? ' p.' : a.id === 'news' ? ' articles' : ''})` : '';
    return `${a.en}${n}`;
  });
}

function paceText(id) {
  const p = pacing(id);
  if (!p) return '';
  if (p.finished) return 'finished';
  if (Math.abs(p.delta) < 0.25) return 'on track';
  return p.delta > 0 ? `ahead by ${r1(p.delta)} ch.` : `behind by ${r1(-p.delta)} ch.`;
}

function chapterLabel(c) {
  const title = c.ja ? `${fullJa(c.ja)} (${c.en})` : c.en;
  return `Lesson ${c.n}${c.ja ? ` — ${title}` : ''}`;
}

function dashboard() {
  const wk = state.cache.wk;
  const t = today();
  const entry = state.log[t] || {};
  const cur = currentBook();
  const lines = [frontmatter({
    type: 'benkyo-dashboard',
    updated: t,
    streak: streak(),
    best_streak: bestStreak(),
    study_days: Object.keys(state.log).filter((k) => dayScore(k)).length,
    wanikani_level: wk?.level ?? null,
    kanji_learned: (state.cache.known || '').length,
    current_book: cur.title,
    tags: ['japanese', 'benkyo'],
  }), '# Benkyō dashboard', stamp()];

  lines.push(`## Today (${t})`);
  for (const a of ACTIVITIES.filter((x) => state.settings.goals[x.id])) {
    lines.push(`- [${entry[a.id] ? 'x' : ' '}] ${activityList({ [a.id]: entry[a.id] })[0] || a.en}`);
  }
  if (entry.note) lines.push('', `Note: ${entry.note}`);

  lines.push('', '## WaniKani');
  if (wk) {
    lines.push(`- Level ${wk.level} / ${wk.maxLevel} · ${wk.lessons} lessons and ${wk.reviews} reviews waiting · ${wk.doneToday || 0} reviewed today`);
    if (wk.srs) lines.push(`- SRS: ${SRS_GROUPS.map((g) => `${g.en} ${wk.srs[g.id]}`).join(' · ')}`);
  } else {
    lines.push('- Not connected.');
  }
  lines.push(`- Kanji learned (Guru or higher): ${(state.cache.known || '').length} → [[Kanji learned]]`);

  lines.push('', '## Textbooks', '| Book | Progress | Next | Target | Pace |', '| --- | --- | --- | --- | --- |');
  for (const b of BOOKS) {
    const p = bookProgress(b.id);
    const next = nextChapter(b.id);
    lines.push(`| [[${b.title}]] | ${r1(p.done)}/${p.total} (${pct(p.ratio)}) | ${next ? cell(chapterLabel(next)) : 'done'} | ${state.settings.targets[b.id]?.end || ''} | ${paceText(b.id)} |`);
  }

  const reading = state.reading.filter((r) => r.status === 'reading');
  lines.push('', '## Reading', ...(reading.length ? reading.map((r) => `- ${r.title}${r.pages ? ` · p.${r.current || 0}/${r.pages}` : ''}`) : ['- Nothing in progress.']), '- Full list: [[Reading]]');

  lines.push('', '## Last 14 days', '| Date | Activities | Note |', '| --- | --- | --- |');
  for (let i = 0; i < 14; i++) {
    const d = addDays(new Date(), -i);
    const k = dayKey(d);
    const e = state.log[k];
    lines.push(`| ${k} ${DOW[d.getDay()]} | ${cell(activityList(e).join(', ') || '—')} | ${cell(e?.note || '')} |`);
  }

  const earned = BADGES.filter((b) => state.badges[b.id]);
  lines.push('', '## Achievements', ...(earned.length ? earned.map((b) => `- ${b.icon} ${b.en} (${state.badges[b.id]})`) : ['- None yet.']));
  lines.push('', 'See also: [[Study log]] notes, [[Links]].');
  return lines.join('\n');
}

function bookNote(b) {
  const p = bookProgress(b.id);
  const target = state.settings.targets[b.id];
  const lines = [frontmatter({
    type: 'benkyo-book',
    book: b.title,
    chapters_done: r1(p.done),
    chapters_total: p.total,
    progress: Math.round(p.ratio * 100),
    target: target?.end || null,
    pace: paceText(b.id) || null,
    tags: ['japanese', 'benkyo', 'textbook'],
  }), `# ${b.title}`, stamp(), `ToKini Andy playlist: ${b.playlist}`, ''];
  for (const c of b.chapters) {
    const ch = peekChapter(b.id, c.n);
    const prog = chapterProgress(b.id, c.n);
    lines.push(`## ${chapterLabel(c)}`);
    lines.push(`Status: ${prog >= 1 ? `done${ch.done ? ` (${ch.done})` : ''}` : prog > 0 ? `in progress (${pct(prog)})` : 'not started'} · [ToKini Andy](${b.video(c.n)})`);
    lines.push(...b.steps.map((s) => `- [${ch.steps[s.id] ? 'x' : ' '}] ${s.en} ${fullJa(s.ja)}`));
    if (c.grammar.length) {
      lines.push('', 'Grammar:');
      lines.push(...c.grammar.map((g, i) => `- [${ch.grammar[i] ? 'x' : ' '}] ${fullJa(g)}`));
    }
    lines.push('');
  }
  return lines.join('\n');
}

function readingNote() {
  const groups = [['reading', 'Reading now'], ['planned', 'Up next'], ['finished', 'Finished']];
  const lines = [frontmatter({ type: 'benkyo-reading', books: state.reading.length, tags: ['japanese', 'benkyo', 'reading'] }), '# Reading', stamp()];
  for (const [st, title] of groups) {
    const list = state.reading.filter((r) => r.status === st);
    if (!list.length) continue;
    lines.push(`## ${title}`, '| Title | Pages | Started | Finished | Link |', '| --- | --- | --- | --- | --- |');
    for (const r of list) {
      lines.push(`| ${cell(r.title)} | ${r.pages ? `${r.current || 0}/${r.pages}` : ''} | ${r.started || ''} | ${r.finished || ''} | ${r.url ? `[open](${r.url})` : ''} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function logNotes() {
  const byMonth = {};
  for (const k of Object.keys(state.log).sort()) (byMonth[k.slice(0, 7)] ||= []).push(k);
  return Object.entries(byMonth).map(([month, days]) => {
    const studied = days.filter((k) => dayScore(k));
    const lines = [frontmatter({ type: 'benkyo-log', month, study_days: studied.length, tags: ['japanese', 'benkyo', 'log'] }), `# Study log ${month}`, stamp()];
    for (const k of days.reverse()) {
      const e = state.log[k];
      lines.push(`## ${k} ${DOW[parseDay(k).getDay()]}`, ...activityList(e).map((a) => `- ${a}`));
      if (e.note) lines.push('', e.note);
      lines.push('');
    }
    return [`${ROOT}/Study log/${month}.md`, lines.join('\n')];
  });
}

function kanjiNote() {
  const known = [...(state.cache.known || '')];
  const rows = [];
  for (let i = 0; i < known.length; i += 20) rows.push(known.slice(i, i + 20).join(' '));
  return [frontmatter({ type: 'benkyo-kanji', count: known.length, wanikani_level: state.cache.wk?.level ?? null, tags: ['japanese', 'benkyo', 'kanji'] }),
    '# Kanji learned', stamp(), 'Kanji taken to Guru at least once on WaniKani.', '', ...rows].join('\n');
}

function linksNote() {
  return [frontmatter({ type: 'benkyo-links', tags: ['japanese', 'benkyo'] }), '# Links', stamp(),
    ...(state.links || []).map((l) => `- ${l.icon ? `${l.icon} ` : ''}[${l.title}](${l.url})`)].join('\n');
}

export function buildNotes() {
  return [
    [`${ROOT}/Benkyō Dashboard.md`, dashboard()],
    ...BOOKS.map((b) => [`${ROOT}/Books/${b.title}.md`, bookNote(b)]),
    [`${ROOT}/Reading.md`, readingNote()],
    [`${ROOT}/Kanji learned.md`, kanjiNote()],
    [`${ROOT}/Links.md`, linksNote()],
    ...logNotes(),
  ];
}

// ---------- minimal zip (stored, no compression) ----------

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (bytes) => {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

export function zip(files) {
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  for (const [name, text] of files) {
    const nameBytes = enc.encode(name);
    const data = enc.encode(text);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    chunks.push(local, nameBytes, data);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint16(12, time, true);
    cen.setUint16(14, date, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, data.length, true);
    cen.setUint32(24, data.length, true);
    cen.setUint16(28, nameBytes.length, true);
    cen.setUint32(42, offset, true);
    central.push(cen, nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const size = central.reduce((n, c) => n + c.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, size, true);
  end.setUint32(16, offset, true);
  return new Blob([...chunks, ...central, end], { type: 'application/zip' });
}
