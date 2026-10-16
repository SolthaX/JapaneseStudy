// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: leaf;

// 勉強 Benkyō — home screen widget for Scriptable (https://scriptable.app).
//
// Setup: in Scriptable create a script named exactly "Benkyo Widget", paste this
// file, then in the 勉強 app tap ⚙︎ → "Update widget". The app sends your goals,
// streak, textbook and reading progress (plus your WaniKani token, stored in the
// iOS Keychain). WaniKani numbers are fetched live each time the widget refreshes.
// Works in small, medium and large sizes — large shows everything.

const fm = FileManager.local();
const DIR = fm.joinPath(fm.documentsDirectory(), 'benkyo');
if (!fm.fileExists(DIR)) fm.createDirectory(DIR, true);
const SNAP = fm.joinPath(DIR, 'snapshot.json');
const WK_CACHE = fm.joinPath(DIR, 'wanikani.json');
const TOKEN_KEY = 'benkyo-wk-token';

const C = {
  bgTop: Color.dynamic(new Color('#fff7f9'), new Color('#1c1727')),
  bgBottom: Color.dynamic(new Color('#fcdde6'), new Color('#2b1c2e')),
  ink: Color.dynamic(new Color('#2a2438'), new Color('#f4eef2')),
  muted: Color.dynamic(new Color('#8a7f8d'), new Color('#b3a8bd')),
  tile: Color.dynamic(new Color('#ffffff', 0.78), new Color('#ffffff', 0.08)),
  pink: new Color('#e0457b'),
  sakura: new Color('#f4a7b9'),
  ok: new Color('#5c9a5a'),
  warn: new Color('#d9483b'),
  ai: Color.dynamic(new Color('#2f3e75'), new Color('#9fb0f0')),
};
// Drawn images can't follow dark mode, so they use tones readable on both backgrounds.
const HEAT = [['#e0457b', 0.15], ['#f6a9bc', 1], ['#ee7fa0', 1], ['#e0457b', 1], ['#b8285c', 1]];

const DOW = '日月火水木金土';
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysBetween = (a, b) => {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
};

// ---------- data ----------

function ingestPayload() {
  let raw = args.queryParameters && args.queryParameters.payload;
  if (!raw && !config.runsInWidget) {
    try {
      const clip = Pasteboard.paste();
      if (clip && clip.startsWith('{"benkyo"')) raw = clip;
    } catch (e) {
      /* no clipboard access */
    }
  }
  if (!raw) return false;
  const data = JSON.parse(raw);
  if (!data.benkyo) return false;
  if (data.token) Keychain.set(TOKEN_KEY, data.token);
  else if (data.token === '' && Keychain.contains(TOKEN_KEY)) Keychain.remove(TOKEN_KEY);
  delete data.token;
  fm.writeString(SNAP, JSON.stringify(data));
  return true;
}

function readJSON(path) {
  try {
    return fm.fileExists(path) ? JSON.parse(fm.readString(path)) : null;
  } catch (e) {
    return null;
  }
}

async function wk(token, path) {
  const req = new Request(`https://api.wanikani.com/v2${path}`);
  req.headers = { Authorization: `Bearer ${token}`, 'Wanikani-Revision': '20170710' };
  req.timeoutInterval = 20;
  const json = await req.loadJSON();
  if (req.response.statusCode !== 200) throw new Error(`WaniKani ${req.response.statusCode}`);
  return json;
}

async function loadWaniKani() {
  if (!Keychain.contains(TOKEN_KEY)) return null;
  const token = Keychain.get(TOKEN_KEY);
  try {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const [user, summary, stats] = await Promise.all([
      wk(token, '/user'),
      wk(token, '/summary'),
      wk(token, `/review_statistics?updated_after=${midnight.toISOString()}`),
    ]);
    const now = Date.now();
    const due = (buckets) => buckets.filter((b) => new Date(b.available_at) <= now).reduce((n, b) => n + b.subject_ids.length, 0);
    const data = {
      at: now,
      level: user.data.level,
      lessons: due(summary.data.lessons),
      reviews: due(summary.data.reviews),
      forecast: summary.data.reviews.filter((b) => new Date(b.available_at) > now).slice(0, 24).map((b) => b.subject_ids.length),
      doneToday: stats.total_count || 0,
      day: dayKey(new Date()),
    };
    fm.writeString(WK_CACHE, JSON.stringify(data));
    return data;
  } catch (e) {
    const cached = readJSON(WK_CACHE);
    if (cached) cached.stale = true;
    return cached || { error: e.message };
  }
}

/** Projects the last app snapshot onto today (the widget may run days later). */
function project(snap, wkData) {
  const today = dayKey(new Date());
  const wkDone = !!(wkData && wkData.day === today && wkData.doneToday > 0);
  if (!snap) return null;
  const age = daysBetween(snap.day, today);
  const sameDay = age === 0;

  let streak;
  if (sameDay) streak = snap.streak + (!snap.studiedToday && wkDone ? 1 : 0);
  else if (age === 1) streak = (snap.studiedToday ? snap.streak : 0) + (wkDone ? 1 : 0);
  else streak = wkDone ? 1 : 0;

  const heat = snap.heat.slice(Math.min(age, snap.heat.length));
  while (heat.length < snap.heat.length) heat.push(0);
  if (wkDone) heat[heat.length - 1] = Math.max(heat[heat.length - 1], 1);

  const goals = snap.goals.map((g) => ({
    ...g,
    done: (sameDay && g.done) || (g.id === 'wk' && wkDone),
  }));

  return { ...snap, streak, heat, goals, stale: age > 0 };
}

// ---------- drawing helpers ----------

function txt(stack, str, size, color, weight) {
  const t = stack.addText(String(str));
  t.font = weight === 'bold' ? Font.boldRoundedSystemFont(size) : weight === 'medium' ? Font.mediumRoundedSystemFont(size) : Font.regularRoundedSystemFont(size);
  t.textColor = color || C.ink;
  t.lineLimit = 1;
  t.minimumScaleFactor = 0.6;
  return t;
}

function hstack(parent, spacing = 0) {
  const s = parent.addStack();
  s.layoutHorizontally();
  s.centerAlignContent();
  s.spacing = spacing;
  return s;
}

function vstack(parent, spacing = 0) {
  const s = parent.addStack();
  s.layoutVertically();
  s.spacing = spacing;
  return s;
}

function barImage(width, height, ratio, color) {
  const dc = new DrawContext();
  dc.size = new Size(width, height);
  dc.opaque = false;
  dc.respectScreenScale = true;
  const r = height / 2;
  const track = new Path();
  track.addRoundedRect(new Rect(0, 0, width, height), r, r);
  dc.addPath(track);
  dc.setFillColor(new Color('#e0457b', 0.15));
  dc.fillPath();
  const w = Math.max(height, width * Math.min(1, Math.max(0, ratio)));
  if (ratio > 0) {
    const fill = new Path();
    fill.addRoundedRect(new Rect(0, 0, w, height), r, r);
    dc.addPath(fill);
    dc.setFillColor(color);
    dc.fillPath();
  }
  return dc.getImage();
}

function forecastImage(width, height, values) {
  const dc = new DrawContext();
  dc.size = new Size(width, height);
  dc.opaque = false;
  dc.respectScreenScale = true;
  const n = 24;
  const gap = 2;
  const bw = (width - gap * (n - 1)) / n;
  const max = Math.max(1, ...values);
  for (let i = 0; i < n; i++) {
    const v = values[i] || 0;
    const h = v ? Math.max(3, (v / max) * height) : 2;
    const p = new Path();
    p.addRoundedRect(new Rect(i * (bw + gap), height - h, bw, h), 2, 2);
    dc.addPath(p);
    dc.setFillColor(new Color(v ? '#ee7fa0' : '#e0457b', v ? 1 : 0.18));
    dc.fillPath();
  }
  return dc.getImage();
}

function heatImage(width, height, scores) {
  const dc = new DrawContext();
  dc.size = new Size(width, height);
  dc.opaque = false;
  dc.respectScreenScale = true;
  const n = scores.length;
  const gap = 2.5;
  const cw = (width - gap * (n - 1)) / n;
  scores.forEach((s, i) => {
    const p = new Path();
    p.addRoundedRect(new Rect(i * (cw + gap), 0, cw, height), 2.5, 2.5);
    dc.addPath(p);
    dc.setFillColor(new Color(...HEAT[Math.min(4, s)]));
    dc.fillPath();
  });
  return dc.getImage();
}

function tile(parent, value, label, color, width, url, height = 50) {
  const s = vstack(parent, 1);
  s.size = new Size(width, height);
  s.backgroundColor = C.tile;
  s.cornerRadius = 12;
  s.setPadding(6, 10, 6, 10);
  s.centerAlignContent();
  if (url) s.url = url;
  const top = hstack(s);
  top.addSpacer();
  txt(top, value, height < 50 ? 19 : 22, color, 'bold');
  top.addSpacer();
  const bot = hstack(s);
  bot.addSpacer();
  txt(bot, label, 10, C.muted, 'medium');
  bot.addSpacer();
  return s;
}

function pill(parent, str, color) {
  const s = hstack(parent);
  s.backgroundColor = new Color(color.hex, 0.16);
  s.cornerRadius = 8;
  s.setPadding(2, 7, 2, 7);
  txt(s, str, 10, color, 'bold');
}

// ---------- layout ----------

function header(w, data, big) {
  const now = new Date();
  const row = hstack(w);
  const left = vstack(row);
  const title = hstack(left, 4);
  txt(title, '桜 勉強', big ? 17 : 15, C.pink, 'bold');
  txt(left, `${now.getMonth() + 1}月${now.getDate()}日（${DOW[now.getDay()]}）`, 11, C.muted, 'medium');
  row.addSpacer();
  const right = vstack(row);
  const sRow = hstack(right, 3);
  sRow.addSpacer();
  txt(sRow, '🔥', big ? 18 : 15);
  txt(sRow, data ? data.streak : '–', big ? 26 : 20, C.pink, 'bold');
  if (!big) {
    txt(sRow, '日連続', 10, C.muted, 'medium');
    return;
  }
  const lab = hstack(right);
  lab.addSpacer();
  txt(lab, '日連続 · streak', 10, C.muted, 'medium');
}

function wkSection(w, wkData, width, height) {
  if (!wkData) {
    txt(w, 'WaniKani: add your token in 勉強, then tap “Update widget”.', 11, C.muted);
    return;
  }
  if (wkData.error) {
    txt(w, `WaniKani: ${wkData.error}`, 11, C.warn);
    return;
  }
  const gap = 8;
  const tw = (width - gap * 2) / 3;
  const row = hstack(w, gap);
  tile(row, wkData.level, 'Level レベル', C.ai, tw, 'https://www.wanikani.com/dashboard', height);
  tile(row, wkData.lessons, 'Lessons 授業', C.ink, tw, 'https://www.wanikani.com/subject-lessons/start', height);
  tile(row, wkData.reviews, 'Reviews 復習', wkData.reviews ? C.pink : C.ok, tw, 'https://www.wanikani.com/subjects/review', height);
}

function forecastSection(w, wkData, width) {
  if (!wkData || wkData.error) return;
  const head = hstack(w);
  txt(head, 'Next 24h 予報', 10, C.muted, 'medium');
  head.addSpacer();
  const total = wkData.forecast.reduce((a, b) => a + b, 0);
  txt(head, `${total} reviews · ${wkData.doneToday} done today${wkData.stale ? ' · offline' : ''}`, 10, C.muted, 'medium');
  w.addSpacer(3);
  const img = w.addImage(forecastImage(width, 30, wkData.forecast));
  img.imageSize = new Size(width, 30);
}

function goalsSection(w, data, compact) {
  const done = data.goals.filter((g) => g.done).length;
  const head = hstack(w);
  txt(head, '今日の目標 Daily goals', 11, C.ink, 'bold');
  head.addSpacer();
  txt(head, done === data.goals.length && done ? 'お疲れ様！' : `${done}/${data.goals.length}`, 11, C.pink, 'bold');
  w.addSpacer(compact ? 4 : 5);
  const row = hstack(w);
  data.goals.forEach((g, i) => {
    if (i) row.addSpacer();
    const cell = vstack(row, 2);
    cell.centerAlignContent();
    cell.size = new Size(compact ? 48 : 42, compact ? 30 : 40);
    cell.cornerRadius = 10;
    cell.backgroundColor = g.done ? new Color('#e0457b', 0.9) : C.tile;
    const top = hstack(cell, 3);
    top.addSpacer();
    txt(top, g.icon, compact ? 13 : 15);
    if (compact && g.done) txt(top, '✓', 11, Color.white(), 'bold');
    top.addSpacer();
    if (compact) return;
    const bot = hstack(cell);
    bot.addSpacer();
    txt(bot, g.done ? '✓' : g.ja, g.done ? 11 : 8, g.done ? Color.white() : C.muted, 'bold');
    bot.addSpacer();
  });
}

function bookSection(w, data, width) {
  const b = data.book;
  if (!b) return;
  const head = hstack(w);
  txt(head, `📖 ${b.title}`, 12, C.ink, 'bold');
  head.addSpacer(6);
  const ch = txt(head, b.next || 'Finished 🎉', 11, C.muted, 'medium');
  ch.lineLimit = 1;
  head.addSpacer();
  if (b.pace) pill(head, b.pace.label, b.pace.kind === 'behind' ? C.warn : b.pace.kind === 'ahead' ? C.ok : C.ai);
  w.addSpacer(5);
  const img = w.addImage(barImage(width, 7, b.ratio, C.pink));
  img.imageSize = new Size(width, 7);
  w.addSpacer(2);
  const foot = hstack(w);
  txt(foot, `${Math.round(b.ratio * 100)}% · ${b.done}/${b.total} chapters`, 9, C.muted, 'medium');
  foot.addSpacer();
  if (data.reading) txt(foot, `📚 ${data.reading.title}${data.reading.pages ? ` p.${data.reading.current}/${data.reading.pages}` : ''}`, 9, C.muted, 'medium');
}

function heatSection(w, data, width) {
  const studied = data.heat.filter((s) => s > 0).length;
  const head = hstack(w);
  txt(head, `🌸 ${studied}/${data.heat.length} days in bloom 開花`, 10, C.muted, 'medium');
  head.addSpacer();
  txt(head, data.stale ? `synced ${data.day.slice(5).replace('-', '/')}` : 'today', 10, C.muted, 'medium');
  w.addSpacer(4);
  const img = w.addImage(heatImage(width, 12, data.heat));
  img.imageSize = new Size(width, 12);
}

function emptyState(w) {
  w.addSpacer();
  txt(w, 'Open 勉強 → ⚙︎ → “Update widget”', 12, C.ink, 'bold');
  txt(w, 'to send your goals and progress here.', 11, C.muted);
  w.addSpacer();
}

async function build(family) {
  const synced = ingestPayload();
  const snap = readJSON(SNAP);
  const wkData = await loadWaniKani();
  const data = project(snap, wkData);

  const w = new ListWidget();
  const grad = new LinearGradient();
  grad.colors = [C.bgTop, C.bgBottom];
  grad.locations = [0, 1];
  w.backgroundGradient = grad;
  w.setPadding(14, 15, 12, 15);
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
  if (snap && snap.appUrl) w.url = snap.appUrl;

  const screen = Device.screenSize();
  const short = Math.min(screen.width, screen.height);
  const width = (family === 'small' ? short / 2 - 22 : short - 29) - 30; // widget width minus padding

  if (family === 'small') {
    const top = hstack(w, 3);
    txt(top, '桜', 15, C.pink, 'bold');
    top.addSpacer();
    txt(top, '🔥', 13);
    txt(top, data ? data.streak : '–', 18, C.pink, 'bold');
    w.addSpacer();
    if (wkData && !wkData.error) {
      const r = hstack(w);
      txt(r, wkData.reviews, 30, wkData.reviews ? C.pink : C.ok, 'bold');
      r.addSpacer(4);
      txt(r, '復習', 12, C.muted, 'bold');
      txt(w, `${wkData.lessons} lessons · Lv ${wkData.level}`, 11, C.muted, 'medium');
    }
    if (data) {
      w.addSpacer(4);
      const done = data.goals.filter((g) => g.done).length;
      txt(w, `目標 ${done}/${data.goals.length} ${data.goals.map((g) => (g.done ? '●' : '○')).join('')}`, 11, C.ink, 'medium');
    }
    return { w, synced };
  }

  const medium = family === 'medium';
  header(w, data, !medium);
  w.addSpacer(medium ? 6 : 8);
  wkSection(w, wkData, width, medium ? 42 : 50);

  if (medium) {
    w.addSpacer(6);
    if (data) goalsSection(w, data, true);
    else emptyState(w);
    return { w, synced };
  }

  w.addSpacer(8);
  forecastSection(w, wkData, width);
  w.addSpacer(10);
  if (!data) {
    emptyState(w);
    return { w, synced };
  }
  goalsSection(w, data);
  w.addSpacer(10);
  bookSection(w, data, width);
  w.addSpacer(10);
  heatSection(w, data, width);
  w.addSpacer();
  if (data.proverb) {
    const p = hstack(w);
    txt(p, data.proverb.ja, 10, C.ink, 'bold');
    p.addSpacer(6);
    txt(p, data.proverb.en, 9, C.muted);
  }
  return { w, synced };
}

const family = config.runsInWidget ? config.widgetFamily : 'large';
const { w, synced } = await build(family === 'extraLarge' ? 'large' : family);

if (config.runsInWidget) {
  Script.setWidget(w);
} else {
  if (synced) {
    const n = new Notification();
    n.title = '勉強 widget updated ✓';
    n.body = 'Your goals and progress are on the home screen.';
    n.schedule();
  }
  await w.presentLarge();
}
Script.complete();
