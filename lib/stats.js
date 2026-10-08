import { db } from './db';
import { LEVELS, today, dayShift, pct } from './util';
import { groupVersions, pickVersion } from './articles';

/** Spaced repetition (Leitner boxes): days until the next review for each box. */
export const BOX_DAYS = [0, 1, 3, 7, 14, 30];
export const LEARNED_BOX = 4;

export async function addXp(userId, xp) {
  if (xp <= 0) return;
  const day = await today();
  db.prepare(
    `INSERT INTO activity_days (user_id, day, xp) VALUES (?,?,?)
     ON CONFLICT (user_id, day) DO UPDATE SET xp = xp + excluded.xp`
  ).run(userId, day, xp);
}

export function nextReview(box, grade) {
  // grade: 0 again, 1 hard, 2 good, 3 easy
  let nb = box;
  if (grade === 0) nb = 0;
  else if (grade === 2) nb = Math.min(box + 1, BOX_DAYS.length - 1);
  else if (grade === 3) nb = Math.min(box + 2, BOX_DAYS.length - 1);
  const due = grade === 0 ? Date.now() + 10 * 60000 : Date.now() + BOX_DAYS[nb] * 86400000;
  return { box: nb, due };
}

function streaks(days, todayKey) {
  const set = new Set(days);
  let current = 0;
  let cursor = set.has(todayKey) ? todayKey : dayShift(todayKey, -1);
  while (set.has(cursor)) {
    current++;
    cursor = dayShift(cursor, -1);
  }
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of [...set].sort()) {
    run = prev && dayShift(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best };
}

export async function userStats(userId) {
  const todayKey = await today();
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const days = db.prepare('SELECT day FROM activity_days WHERE user_id = ? AND xp > 0').all(userId).map((r) => r.day);
  const { current, best } = streaks(days, todayKey);
  const quiz = (kind) =>
    one(
      `SELECT COUNT(*) n, SUM(score) s, SUM(max) m FROM (
         SELECT article_id, score, max FROM quiz_attempts a WHERE user_id = ? AND kind = ?
         AND id = (SELECT id FROM quiz_attempts b WHERE b.user_id = a.user_id AND b.article_id = a.article_id
                   AND b.kind = a.kind ORDER BY b.score * 1.0 / b.max DESC, b.id DESC LIMIT 1))`,
      userId,
      kind
    );
  const lang = quiz('lang');
  const comp = quiz('comp');
  const words = one(
    'SELECT COUNT(*) n, SUM(box >= ?) learned FROM saved_words WHERE user_id = ?',
    LEARNED_BOX,
    userId
  );
  return {
    todayKey,
    xpTotal: one('SELECT COALESCE(SUM(xp),0) v FROM activity_days WHERE user_id = ?', userId).v,
    xpToday: one('SELECT COALESCE(xp,0) v FROM activity_days WHERE user_id = ? AND day = ?', userId, todayKey)?.v ?? 0,
    streak: current,
    bestStreak: best,
    articlesRead: one('SELECT COUNT(DISTINCT COALESCE(a.group_id, a.id)) v FROM reads r JOIN articles a ON a.id = r.article_id WHERE r.user_id = ?', userId).v,
    avgWpm: Math.round(one('SELECT AVG(wpm) v FROM reads WHERE user_id = ?', userId).v || 0),
    wordsSaved: words.n,
    wordsLearned: words.learned || 0,
    dueWords: one('SELECT COUNT(*) v FROM saved_words WHERE user_id = ? AND due <= ?', userId, Date.now()).v,
    langPct: pct(lang.s, lang.m),
    compPct: pct(comp.s, comp.m),
    quizzesDone: lang.n + comp.n,
    perfectQuizzes: one(
      'SELECT COUNT(*) v FROM quiz_attempts WHERE user_id = ? AND score = max AND max > 0',
      userId
    ).v,
  };
}

export function badgesFor(s) {
  const all = [
    ['First read', 'Finish your first article', s.articlesRead >= 1],
    ['Bookworm', 'Finish 5 articles', s.articlesRead >= 5],
    ['Reading machine', 'Finish 25 articles', s.articlesRead >= 25],
    ['Word collector', 'Save 25 words', s.wordsSaved >= 25],
    ['Word master', 'Learn 25 words (flashcard box 4+)', s.wordsLearned >= 25],
    ['On a roll', 'Reach a 3-day streak', s.bestStreak >= 3],
    ['Week warrior', 'Reach a 7-day streak', s.bestStreak >= 7],
    ['Unstoppable', 'Reach a 30-day streak', s.bestStreak >= 30],
    ['Perfect score', 'Get 100% in a quiz', s.perfectQuizzes >= 1],
    ['Quiz champion', 'Complete 10 quizzes', s.quizzesDone >= 10],
  ];
  return all.map(([name, hint, earned]) => ({ name, hint, earned }));
}

/** Suggests a target level from recent quiz results, and picks unread articles to read next. */
export function recommend(user, limit = 4) {
  const recent = db
    .prepare('SELECT score, max FROM quiz_attempts WHERE user_id = ? ORDER BY id DESC LIMIT 6')
    .all(user.id);
  const avg = recent.length ? pct(recent.reduce((a, r) => a + r.score, 0), recent.reduce((a, r) => a + r.max, 0)) : null;
  const idx = LEVELS.indexOf(user.level);
  let note = null;
  let target = user.level;
  if (recent.length >= 4 && avg >= 85 && idx < LEVELS.length - 1) {
    target = LEVELS[idx + 1];
    note = `You are scoring ${avg}% in recent quizzes. Try some ${target} articles.`;
  } else if (recent.length >= 4 && avg <= 50 && idx > 0) {
    target = LEVELS[idx - 1];
    note = `Recent quizzes averaged ${avg}%. Some ${target} articles may build your confidence.`;
  }
  const liked = db
    .prepare(
      `SELECT a.topic, COUNT(*) n FROM articles a WHERE a.id IN
       (SELECT article_id FROM reads WHERE user_id = ? UNION SELECT article_id FROM bookmarks WHERE user_id = ?)
       GROUP BY a.topic`
    )
    .all(user.id, user.id);
  const affinity = Object.fromEntries(liked.map((r) => [r.topic, r.n]));
  // An article counts as read when any of its level versions has been finished.
  const rows = db
    .prepare(
      `SELECT id, group_id, title, level, topic, summary, word_count FROM articles
       WHERE published = 1 AND COALESCE(group_id, id) NOT IN
         (SELECT COALESCE(a.group_id, a.id) FROM reads r JOIN articles a ON a.id = r.article_id WHERE r.user_id = ?)`
    )
    .all(user.id);
  const groups = groupVersions(rows).map((g) => ({ ...g, shown: pickVersion(g, target) }));
  const score = (g) => (g.shown.level === target ? 6 : Math.abs(LEVELS.indexOf(g.shown.level) - LEVELS.indexOf(target)) === 1 ? 2 : 0) + Math.min(affinity[g.shown.topic] || 0, 3);
  groups.sort((a, b) => score(b) - score(a) || b.group_id - a.group_id);
  const unread = groups.map((g) => ({ ...g.shown, levels: g.versions.map((v) => v.level) }));
  return { note, articles: unread.slice(0, limit) };
}
