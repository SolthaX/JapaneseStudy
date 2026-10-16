// Local persistence. Everything lives in one localStorage document so it can be
// exported / imported as a single JSON backup.

const KEY = 'benkyo-v1';

export const ACTIVITIES = [
  { id: 'wk', en: 'WaniKani reviews', ja: 'ワニカニ', icon: '🐊', color: '#e0457b', url: 'https://www.wanikani.com/' },
  { id: 'bunpro', en: 'Bunpro reviews', ja: '[文プロ|ぶんプロ|]', icon: '📘', color: '#f08a24', url: 'https://bunpro.jp/dashboard' },
  { id: 'textbook', en: 'Textbook study', ja: '[教科書|きょうかしょ|]', icon: '📖', color: '#3b4f8f', url: null },
  { id: 'conj', en: 'Conjugation drill', ja: '[活用|かつよう|]', icon: '🔁', color: '#7a5bb5', url: 'https://sydney.jpf.go.jp/japanese-studies/resources/japanese-conjugation-practice/' },
  { id: 'reading', en: 'Reading', ja: '[読書|どくしょ|]', icon: '📚', color: '#5c9a5a', url: 'https://learnnatively.com/' },
  { id: 'news', en: 'Read the news', ja: 'ニュース', icon: '📰', color: '#c0392b', url: null },
];

const defaults = () => ({
  version: 1,
  settings: {
    wkToken: '',
    name: '',
    goals: { wk: true, bunpro: true, textbook: true, conj: true, reading: true, news: false },
    targets: {}, // bookId -> { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
    theme: 'auto',
  },
  log: {}, // 'YYYY-MM-DD' -> { wk, bunpro, textbook, conj, reading, news, minutes, note }
  books: {}, // bookId -> { [chapterNumber]: { steps: {stepId:true}, grammar: {i:true}, done: 'YYYY-MM-DD' } }
  reading: [], // { id, title, url, pages, current, status, started, finished }
  newsRead: {}, // url -> 'YYYY-MM-DD'
  badges: {}, // badgeId -> 'YYYY-MM-DD'
  cache: {}, // WaniKani API snapshot
  widgetSyncedAt: null,
});

function merge(base, extra) {
  for (const [k, v] of Object.entries(extra || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      merge(base[k], v);
    } else {
      base[k] = v;
    }
  }
  return base;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return merge(defaults(), raw ? JSON.parse(raw) : {});
  } catch {
    return defaults();
  }
}

export const state = load();

const listeners = new Set();
export const onChange = (fn) => listeners.add(fn);

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save', e);
  }
  listeners.forEach((fn) => fn());
}

export function exportData() {
  return JSON.stringify({ ...state, cache: {} }, null, 2);
}

export function importData(json) {
  const data = JSON.parse(json);
  if (!data || typeof data !== 'object' || !data.settings) throw new Error('Not a Benkyō backup file');
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, merge(defaults(), data));
  save();
}

// ---------- dates ----------

export const dayKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const parseDay = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

export const today = () => dayKey();

// ---------- daily log ----------

export function dayLog(key = today()) {
  return state.log[key] || {};
}

export function setActivity(id, value, key = today()) {
  const entry = state.log[key] || (state.log[key] = {});
  if (value) entry[id] = value;
  else delete entry[id];
  if (!Object.keys(entry).length) delete state.log[key];
  save();
}

export const activeGoals = () => ACTIVITIES.filter((a) => state.settings.goals[a.id]);

export function dayScore(key) {
  const entry = state.log[key];
  if (!entry) return 0;
  return ACTIVITIES.filter((a) => entry[a.id]).length;
}

export const isStudyDay = (key) => dayScore(key) > 0;

export function streak() {
  let d = new Date();
  // Today not done yet doesn't break the streak.
  if (!isStudyDay(dayKey(d))) d = addDays(d, -1);
  let n = 0;
  while (isStudyDay(dayKey(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function bestStreak() {
  const days = Object.keys(state.log).filter(isStudyDay).sort();
  let best = 0;
  let cur = 0;
  let prev = null;
  for (const k of days) {
    const d = parseDay(k);
    cur = prev && dayKey(addDays(prev, 1)) === k ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = d;
  }
  return best;
}

export function studyDaysInLast(n) {
  let c = 0;
  for (let i = 0; i < n; i++) if (isStudyDay(dayKey(addDays(new Date(), -i)))) c++;
  return c;
}
