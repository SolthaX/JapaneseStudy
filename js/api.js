// WaniKani (official v2 API, CORS-enabled) and the news file.

import { state, save, today, setActivity, dayLog } from './store.js';

const WK = 'https://api.wanikani.com/v2';

async function wk(path) {
  const res = await fetch(path.startsWith('http') ? path : WK + path, {
    headers: {
      Authorization: `Bearer ${state.settings.wkToken.trim()}`,
      'Wanikani-Revision': '20170710',
    },
  });
  if (res.status === 401) throw new Error('Invalid WaniKani token');
  if (!res.ok) throw new Error(`WaniKani error ${res.status}`);
  return res.json();
}

async function wkAll(path) {
  const out = [];
  let url = path;
  while (url) {
    const page = await wk(url);
    out.push(...page.data);
    url = page.pages?.next_url;
  }
  return out;
}

const SRS_GROUPS = [
  { id: 'apprentice', en: 'Apprentice', ja: '[見習|みならい|]', stages: [1, 2, 3, 4], color: '#dd0093' },
  { id: 'guru', en: 'Guru', ja: '[達人|たつじん|]', stages: [5, 6], color: '#882d9e' },
  { id: 'master', en: 'Master', ja: '[主人|しゅじん|]', stages: [7], color: '#294ddb' },
  { id: 'enlightened', en: 'Enlightened', ja: '[啓蒙|けいもう|]', stages: [8], color: '#0093dd' },
  { id: 'burned', en: 'Burned', ja: '[焼却|しょうきゃく|]', stages: [9], color: '#434343' },
];
export { SRS_GROUPS };

const fresh = (snap, ms) => snap && Date.now() - snap.fetchedAt < ms;

/** Maps kanji subject ids to characters, fetching only ids not seen before. */
async function kanjiCharacters(ids) {
  const chars = (state.cache.kanjiChars ||= {});
  const missing = ids.filter((id) => !chars[id]);
  for (let i = 0; i < missing.length; i += 300) {
    const subjects = await wkAll(`/subjects?ids=${missing.slice(i, i + 300).join(',')}`);
    for (const s of subjects) chars[s.id] = s.data.characters;
  }
  return ids.map((id) => chars[id] || '').join('');
}

export async function syncWaniKani({ force = false } = {}) {
  if (!state.settings.wkToken) return null;
  const prev = state.cache.wk || {};
  if (!force && fresh(prev, 5 * 60 * 1000)) return prev;

  const [user, summary] = await Promise.all([wk('/user'), wk('/summary')]);

  const now = Date.now();
  const lessons = summary.data.lessons.reduce((n, b) => n + (new Date(b.available_at) <= now ? b.subject_ids.length : 0), 0);
  const reviewBuckets = summary.data.reviews.map((b) => ({ at: b.available_at, n: b.subject_ids.length }));
  const reviews = reviewBuckets.filter((b) => new Date(b.at) <= now).reduce((n, b) => n + b.n, 0);
  const forecast = reviewBuckets.filter((b) => new Date(b.at) > now).slice(0, 24);

  // Items reviewed today: review statistics get touched on every answered review.
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  let doneToday = prev.doneTodayKey === today() ? prev.doneToday : 0;
  try {
    const stats = await wk(`/review_statistics?updated_after=${midnight.toISOString()}`);
    doneToday = stats.total_count ?? stats.data.length;
  } catch {
    /* keep previous value */
  }

  // SRS distribution is heavier (paginated) — refresh hourly.
  let srs = prev.srs;
  if (force || !srs || !fresh({ fetchedAt: prev.srsAt }, 60 * 60 * 1000)) {
    const assignments = await wkAll('/assignments?unlocked=true&hidden=false');
    srs = Object.fromEntries(SRS_GROUPS.map((g) => [g.id, 0]));
    for (const a of assignments) {
      const grp = SRS_GROUPS.find((g) => g.stages.includes(a.data.srs_stage));
      if (grp) srs[grp.id]++;
    }
    // Learned kanji = reached Guru at least once (passed_at is kept even if it slips back).
    const passed = assignments.filter((a) => a.data.subject_type === 'kanji' && a.data.passed_at).map((a) => a.data.subject_id);
    state.cache.known = await kanjiCharacters(passed);
    prev.srsAt = Date.now();
  }

  const snap = {
    fetchedAt: Date.now(),
    srsAt: prev.srsAt,
    username: user.data.username,
    level: user.data.level,
    maxLevel: user.data.subscription?.max_level_granted ?? 60,
    startedAt: user.data.started_at,
    lessons,
    reviews,
    forecast,
    nextReviewsAt: summary.data.next_reviews_at,
    srs,
    doneToday,
    doneTodayKey: today(),
  };
  state.cache.wk = snap;
  if (doneToday > 0 && (dayLog().wk || 0) < doneToday) setActivity('wk', doneToday);
  else save();
  return snap;
}

export async function loadNews() {
  const res = await fetch(`data/news.json?t=${Math.floor(Date.now() / 600000)}`);
  if (!res.ok) throw new Error('No news yet');
  return res.json();
}
