import Link from 'next/link';
import ArticleCard from '@/components/ArticleCard';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { groupVersions, pickVersion } from '@/lib/articles';
import { LEVELS, TOPICS } from '@/lib/util';

export const metadata = { title: 'Articles' };

export default async function Library({ searchParams }) {
  const user = await requireUser();
  const sp = await searchParams;
  const level = LEVELS.includes(sp.level) ? sp.level : '';
  const topic = String(sp.topic || '');
  const q = String(sp.q || '').trim().toLowerCase();
  const show = ['unread', 'read', 'saved'].includes(sp.show) ? sp.show : '';

  const rows = db
    .prepare(
      `SELECT a.id, a.group_id, a.title, a.level, a.topic, a.summary, a.word_count, a.published,
         r.user_id IS NOT NULL AS read, b.user_id IS NOT NULL AS bookmarked
       FROM articles a LEFT JOIN reads r ON r.article_id = a.id AND r.user_id = ?
       LEFT JOIN bookmarks b ON b.article_id = a.id AND b.user_id = ?
       ${user.role === 'teacher' ? '' : 'WHERE a.published = 1'} ORDER BY a.id DESC`
    )
    .all(user.id, user.id);

  // One card per article. It opens at the reader's own level when that version exists.
  const groups = groupVersions(rows)
    .filter((g) => !topic || g.versions.some((v) => v.topic === topic))
    .filter((g) => !level || g.versions.some((v) => v.level === level))
    .filter((g) => !q || g.versions.some((v) => `${v.title} ${v.summary}`.toLowerCase().includes(q)))
    .map((g) => ({
      ...g,
      read: g.versions.some((v) => v.read),
      bookmarked: g.versions.some((v) => v.bookmarked),
      shown: pickVersion(g, level || user.level),
    }))
    .filter((g) => (show === 'unread' ? !g.read : show === 'read' ? g.read : show === 'saved' ? g.bookmarked : true))
    .sort((a, b) => b.group_id - a.group_id);

  const topics = db.prepare('SELECT DISTINCT topic FROM articles ORDER BY topic').all().map((r) => r.topic);
  const allTopics = [...new Set([...TOPICS, ...topics])].sort();

  return (
    <>
      <div className="row between">
        <h1>Articles</h1>
        {user.role === 'teacher' && <Link href="/teacher/articles/new" className="btn primary">+ New article</Link>}
      </div>
      <form className="card filters" method="get">
        <input name="q" defaultValue={sp.q || ''} placeholder="Search titles…" aria-label="Search" />
        <select name="level" defaultValue={level} aria-label="Level">
          <option value="">Any level</option>
          {LEVELS.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select name="topic" defaultValue={topic} aria-label="Topic">
          <option value="">All topics</option>
          {allTopics.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select name="show" defaultValue={show} aria-label="Show">
          <option value="">Everything</option>
          <option value="unread">Not read yet</option>
          <option value="read">Already read</option>
          <option value="saved">Bookmarked</option>
        </select>
        <button className="btn primary">Filter</button>
        {(level || topic || q || show) && <Link href="/articles" className="btn ghost">Clear</Link>}
      </form>
      <p className="muted small">Many articles come in several levels. Open one and switch level at the top of the page.</p>
      {groups.length ? (
        <div className="grid">
          {groups.map((g) => (
            <ArticleCard
              key={g.group_id}
              a={g.shown}
              levels={g.versions.map((v) => v.level)}
              read={g.read}
              bookmarked={g.bookmarked}
              extra={g.shown.published ? '' : ' Draft'}
            />
          ))}
        </div>
      ) : (
        <p className="muted">No articles match. Try clearing the filters.</p>
      )}
    </>
  );
}
