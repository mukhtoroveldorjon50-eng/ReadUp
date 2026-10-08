import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { badgesFor, userStats } from '@/lib/stats';
import { dayShift, fmtDate, levelClass, pct } from '@/lib/util';

export const metadata = { title: 'My progress' };

export default async function ProgressPage() {
  const user = await requireUser();
  const s = await userStats(user.id);
  const badges = badgesFor(s);

  // XP for the last 14 days
  const rows = db.prepare('SELECT day, xp FROM activity_days WHERE user_id = ? AND day >= ?').all(user.id, dayShift(s.todayKey, -13));
  const xpBy = Object.fromEntries(rows.map((r) => [r.day, r.xp]));
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = dayShift(s.todayKey, i - 13);
    return { d, xp: xpBy[d] || 0 };
  });
  const maxXp = Math.max(30, user.daily_goal, ...days.map((x) => x.xp));

  const history = db
    .prepare(
      `SELECT a.id, a.title, a.level, v.opened_at, r.wpm, r.finished_at,
         (SELECT MAX(score * 100 / max) FROM quiz_attempts q WHERE q.user_id = v.user_id AND q.article_id = a.id AND q.kind = 'lang') lang,
         (SELECT MAX(score * 100 / max) FROM quiz_attempts q WHERE q.user_id = v.user_id AND q.article_id = a.id AND q.kind = 'comp') comp
       FROM views v JOIN articles a ON a.id = v.article_id
       LEFT JOIN reads r ON r.user_id = v.user_id AND r.article_id = a.id
       WHERE v.user_id = ? ORDER BY v.opened_at DESC LIMIT 25`
    )
    .all(user.id);

  return (
    <>
      <h1>My progress</h1>
      <section className="grid stats">
        <div className="card stat"><b>🔥 {s.streak}</b><span>day streak (best {s.bestStreak})</span></div>
        <div className="card stat"><b>{s.xpTotal}</b><span>total XP</span></div>
        <div className="card stat"><b>{s.articlesRead}</b><span>articles read</span></div>
        <div className="card stat"><b>{s.avgWpm || '–'}</b><span>avg words/minute</span></div>
        <div className="card stat"><b>{s.wordsLearned} / {s.wordsSaved}</b><span>words learned / saved</span></div>
        <div className="card stat"><b>{s.quizzesDone ? s.langPct + '%' : '–'}</b><span>language quiz average</span></div>
        <div className="card stat"><b>{s.quizzesDone ? s.compPct + '%' : '–'}</b><span>comprehension average</span></div>
        <div className="card stat"><b>{s.perfectQuizzes}</b><span>perfect quizzes</span></div>
      </section>

      <section className="card">
        <h2>Last 14 days (XP)</h2>
        <div className="chart" aria-label="XP per day for the last 14 days">
          {days.map((x) => (
            <div key={x.d} className="col" title={`${x.d}: ${x.xp} XP`}>
              <i style={{ height: Math.max(2, (x.xp / maxXp) * 100) + '%' }} className={x.xp >= user.daily_goal ? 'hit' : ''} />
              <span>{x.d.slice(8)}</span>
            </div>
          ))}
        </div>
        <p className="muted small">Dark bars reached your daily goal of {user.daily_goal} XP. <Link href="/account">Change goal</Link></p>
      </section>

      <section>
        <h2>Badges</h2>
        <div className="badges">
          {badges.map((b) => (
            <div key={b.name} className={'badge' + (b.earned ? ' on' : '')} title={b.hint}>
              <span>{b.earned ? '🏅' : '🔒'}</span>
              <b>{b.name}</b>
              <small>{b.hint}</small>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Reading history</h2>
        {history.length ? (
          <div className="card table-wrap">
            <table>
              <thead><tr><th>Article</th><th>Opened</th><th>Speed</th><th>Language</th><th>Comprehension</th></tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td><span className={levelClass(h.level)}>{h.level}</span> <Link href={`/articles/${h.id}`}>{h.title}</Link>{h.finished_at ? ' ✓' : ''}</td>
                    <td>{fmtDate(h.opened_at)}</td>
                    <td>{h.wpm ? `${h.wpm} wpm` : '–'}</td>
                    <td>{h.lang != null ? `${h.lang}%` : '–'}</td>
                    <td>{h.comp != null ? `${h.comp}%` : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Nothing yet. <Link href="/articles">Open your first article.</Link></p>
        )}
      </section>
    </>
  );
}
