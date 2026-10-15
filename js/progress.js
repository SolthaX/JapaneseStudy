// Textbook progress, target-date pacing and achievements.

import { BOOKS, bookById } from './curriculum.js';
import { state, save, today, parseDay, streak, bestStreak, ACTIVITIES } from './store.js';

export function chapterState(bookId, n) {
  const book = (state.books[bookId] ||= {});
  return (book[n] ||= { steps: {}, grammar: {} });
}

export function peekChapter(bookId, n) {
  return state.books[bookId]?.[n] || { steps: {}, grammar: {} };
}

export function chapterProgress(bookId, n) {
  const book = bookById(bookId);
  const ch = peekChapter(bookId, n);
  if (ch.done) return 1;
  const done = book.steps.filter((s) => ch.steps[s.id]).length;
  return done / book.steps.length;
}

export function bookProgress(bookId) {
  const book = bookById(bookId);
  const sum = book.chapters.reduce((t, c) => t + chapterProgress(bookId, c.n), 0);
  return { done: sum, total: book.chapters.length, ratio: sum / book.chapters.length };
}

export function nextChapter(bookId) {
  const book = bookById(bookId);
  return book.chapters.find((c) => chapterProgress(bookId, c.n) < 1) || null;
}

/** The book you're currently working through: first one not finished. */
export function currentBook() {
  return BOOKS.find((b) => bookProgress(b.id).ratio < 1) || BOOKS[BOOKS.length - 1];
}

function refreshChapterDone(bookId, n) {
  const book = bookById(bookId);
  const ch = chapterState(bookId, n);
  const all = book.steps.every((s) => ch.steps[s.id]);
  if (all && !ch.done) ch.done = today();
  if (!all) delete ch.done;
}

export function toggleStep(bookId, n, stepId) {
  const ch = chapterState(bookId, n);
  ch.steps[stepId] = !ch.steps[stepId];
  if (!ch.steps[stepId]) delete ch.steps[stepId];
  refreshChapterDone(bookId, n);
  touchTextbook();
  save();
}

export function toggleGrammar(bookId, n, i) {
  const book = bookById(bookId);
  const chapter = book.chapters.find((c) => c.n === n);
  const ch = chapterState(bookId, n);
  ch.grammar[i] = !ch.grammar[i];
  if (!ch.grammar[i]) delete ch.grammar[i];
  const allGrammar = chapter.grammar.every((_, j) => ch.grammar[j]);
  if (allGrammar) ch.steps.grammar = true;
  else delete ch.steps.grammar;
  refreshChapterDone(bookId, n);
  touchTextbook();
  save();
}

export function setChapterComplete(bookId, n, complete) {
  const book = bookById(bookId);
  const chapter = book.chapters.find((c) => c.n === n);
  const ch = chapterState(bookId, n);
  if (complete) {
    book.steps.forEach((s) => (ch.steps[s.id] = true));
    chapter.grammar.forEach((_, j) => (ch.grammar[j] = true));
    ch.done ||= today();
  } else {
    ch.steps = {};
    ch.grammar = {};
    delete ch.done;
  }
  save();
}

export function setBookComplete(bookId, complete) {
  bookById(bookId).chapters.forEach((c) => setChapterComplete(bookId, c.n, complete));
}

function touchTextbook() {
  const key = today();
  const entry = (state.log[key] ||= {});
  entry.textbook = true;
}

// ---------- pacing ----------

const DAY = 86400000;

export function pacing(bookId) {
  const t = state.settings.targets[bookId];
  if (!t?.end) return null;
  const start = parseDay(t.start || today());
  const end = parseDay(t.end);
  const now = parseDay(today());
  const { done, total } = bookProgress(bookId);
  const span = Math.max(1, (end - start) / DAY);
  const elapsed = Math.min(span, Math.max(0, (now - start) / DAY));
  const daysLeft = Math.max(0, Math.round((end - now) / DAY));
  const weeksLeft = Math.max(daysLeft / 7, 1 / 7);
  // Chapters already finished when the plan started count as "on schedule" from day one.
  const baseline = t.baseline ?? 0;
  const expected = baseline + ((total - baseline) * elapsed) / span;
  return {
    done,
    total,
    expected,
    delta: done - expected, // >0 ahead, <0 behind (in chapters)
    daysLeft,
    perWeek: (total - done) / weeksLeft,
    end: t.end,
    finished: done >= total,
  };
}

export function setTarget(bookId, end) {
  if (!end) {
    delete state.settings.targets[bookId];
  } else {
    const prev = state.settings.targets[bookId];
    state.settings.targets[bookId] = {
      start: prev?.start || today(),
      baseline: prev?.baseline ?? bookProgress(bookId).done,
      end,
    };
  }
  save();
}

// ---------- achievements ----------

const finished = (id) => bookProgress(id).ratio >= 1;
const countLog = (id) => Object.values(state.log).filter((e) => e[id]).length;
const studyDays = () => Object.values(state.log).filter((e) => ACTIVITIES.some((a) => e[a.id])).length;
const wkLevel = () => state.cache.wk?.level || 0;

export const BADGES = [
  { id: 'first-day', icon: '🌱', ja: '初日', en: 'First study day', test: () => studyDays() >= 1 },
  { id: 'streak-7', icon: '🌸', ja: '一週間', en: '7-day streak', test: () => bestStreak() >= 7 },
  { id: 'streak-30', icon: '🎏', ja: '一ヶ月', en: '30-day streak', test: () => bestStreak() >= 30 },
  { id: 'streak-100', icon: '🗻', ja: '百日', en: '100-day streak', test: () => bestStreak() >= 100 },
  { id: 'streak-365', icon: '🎍', ja: '一年', en: '365-day streak', test: () => bestStreak() >= 365 },
  { id: 'days-50', icon: '🍡', ja: '五十日', en: '50 study days', test: () => studyDays() >= 50 },
  { id: 'genki1', icon: '📗', ja: 'げんき I 卒業', en: 'Finished Genki I', test: () => finished('genki1') },
  { id: 'genki2', icon: '📘', ja: 'げんき II 卒業', en: 'Finished Genki II', test: () => finished('genki2') },
  { id: 'quartet1', icon: '🎻', ja: 'カルテット I', en: 'Finished Quartet I', test: () => finished('quartet1') },
  { id: 'quartet2', icon: '🎼', ja: 'カルテット II', en: 'Finished Quartet II', test: () => finished('quartet2') },
  { id: 'wk-10', icon: '🐊', ja: 'レベル10', en: 'WaniKani level 10', test: () => wkLevel() >= 10 },
  { id: 'wk-20', icon: '🔥', ja: 'レベル20', en: 'WaniKani level 20', test: () => wkLevel() >= 20 },
  { id: 'wk-30', icon: '⚡', ja: 'レベル30', en: 'WaniKani level 30', test: () => wkLevel() >= 30 },
  { id: 'wk-60', icon: '👑', ja: 'レベル60', en: 'WaniKani level 60', test: () => wkLevel() >= 60 },
  { id: 'conj-20', icon: '🔁', ja: '活用マスター', en: '20 conjugation sessions', test: () => countLog('conj') >= 20 },
  { id: 'news-10', icon: '📰', ja: '新聞好き', en: 'Read the news 10 days', test: () => countLog('news') >= 10 },
  { id: 'book-1', icon: '📚', ja: '初めての本', en: 'Finished a Japanese book', test: () => state.reading.some((b) => b.status === 'finished') },
  { id: 'book-5', icon: '🏯', ja: '本の虫', en: 'Finished 5 books', test: () => state.reading.filter((b) => b.status === 'finished').length >= 5 },
];

/** Records newly earned badges and returns them. */
export function checkBadges() {
  const fresh = [];
  for (const b of BADGES) {
    if (!state.badges[b.id] && b.test()) {
      state.badges[b.id] = today();
      fresh.push(b);
    }
  }
  if (fresh.length) save();
  return fresh;
}

export { streak };
