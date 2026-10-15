// WaniKani (official v2 API, CORS-enabled) and Bunpro (legacy key API, best effort).

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
  { id: 'apprentice', en: 'Apprentice', ja: '見習', stages: [1, 2, 3, 4], color: '#dd0093' },
  { id: 'guru', en: 'Guru', ja: '達人', stages: [5, 6], color: '#882d9e' },
  { id: 'master', en: 'Master', ja: '主人', stages: [7], color: '#294ddb' },
  { id: 'enlightened', en: 'Enlightened', ja: '啓蒙', stages: [8], color: '#0093dd' },
  { id: 'burned', en: 'Burned', ja: '焼却', stages: [9], color: '#434343' },
];
export { SRS_GROUPS };

const fresh = (snap, ms) => snap && Date.now() - snap.fetchedAt < ms;

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
    const stats = await wkAll(`/review_statistics?updated_after=${midnight.toISOString()}`);
    doneToday = stats.length;
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

// Bunpro has no stable public API. The legacy "study_queue" endpoint keyed by the
// settings API key is tried; if Bunpro or the browser (CORS) refuses, we fall
// back to manual logging and say so in the UI.
export async function syncBunpro({ force = false } = {}) {
  const key = state.settings.bunproKey.trim();
  if (!key) return null;
  const prev = state.cache.bunpro;
  if (!force && prev && fresh(prev, 5 * 60 * 1000)) return prev;
  try {
    const res = await fetch(`https://bunpro.jp/api/user/${encodeURIComponent(key)}/study_queue`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const info = json.requested_information || {};
    const user = json.user_information || {};
    if (info.reviews_available === undefined) throw new Error('Unexpected response');
    const snap = {
      ok: true,
      fetchedAt: Date.now(),
      username: user.username,
      grammarPoints: user.grammar_point_count,
      ghosts: user.ghost_review_count,
      reviews: info.reviews_available,
      nextHour: info.reviews_available_next_hour,
      nextDay: info.reviews_available_next_day,
      nextReviewAt: info.next_review_date ? Number(info.next_review_date) * 1000 : null,
    };
    state.cache.bunpro = snap;
    save();
    return snap;
  } catch (e) {
    const snap = { ok: false, fetchedAt: Date.now(), error: e.message || 'Unreachable' };
    state.cache.bunpro = snap;
    save();
    return snap;
  }
}

export async function loadNews() {
  const res = await fetch(`data/news.json?t=${Math.floor(Date.now() / 600000)}`);
  if (!res.ok) throw new Error('No news yet');
  return res.json();
}
