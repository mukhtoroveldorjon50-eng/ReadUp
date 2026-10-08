import Link from 'next/link';
import ArticleCard from '@/components/ArticleCard';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { LEVELS, TOPICS } from '@/lib/util';

export const metadata = { title: 'Articles' };

export default async function Library({ searchParams }) {
  const user = await requireUser();
  const sp = await searchParams;
  const level = LEVELS.includes(sp.level) ? sp.level : '';
  const topic = String(sp.topic || '');
  const q = String(sp.q || '').trim();
  const show = ['unread', 'read', 'saved'].includes(sp.show) ? sp.show : '';

  const where = [user.role === 'teacher' ? '1=1' : 'a.published = 1'];
  const args = [user.id, user.id];
  if (level) { where.push('a.level = ?'); args.push(level); }
  if (topic) { where.push('a.topic = ?'); args.push(topic); }
  if (q) { where.push('(a.title LIKE ? OR a.summary LIKE ?)'); args.push(`%${q}%`, `%${q}%`); }
  if (show === 'unread') where.push('r.user_id IS NULL');
  if (show === 'read') where.push('r.user_id IS NOT NULL');
  if (show === 'saved') where.push('b.user_id IS NOT NULL');

  const rows = db
    .prepare(
      `SELECT a.id, a.title, a.level, a.topic, a.summary, a.word_count, a.published,
         r.user_id IS NOT NULL AS read, b.user_id IS NOT NULL AS bookmarked
       FROM articles a LEFT JOIN reads r ON r.article_id = a.id AND r.user_id = ?
       LEFT JOIN bookmarks b ON b.article_id = a.id AND b.user_id = ?
       WHERE ${where.join(' AND ')} ORDER BY a.id DESC`
    )
    .all(...args);
  const topics = db.prepare('SELECT DISTINCT topic FROM articles ORDER BY topic').all().map((r) => r.topic);
  const allTopics = [...new Set([...TOPICS, ...topics])].sort();

  return (
    <>
      <div className="row between">
        <h1>Articles</h1>
        {user.role === 'teacher' && <Link href="/teacher/articles/new" className="btn primary">+ New article</Link>}
      </div>
      <form className="card filters" method="get">
        <input name="q" defaultValue={q} placeholder="Search titles…" aria-label="Search" />
        <select name="level" defaultValue={level} aria-label="Level">
          <option value="">All levels</option>
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
      {rows.length ? (
        <div className="grid">
          {rows.map((a) => (
            <ArticleCard key={a.id} a={a} read={a.read} bookmarked={a.bookmarked} extra={a.published ? '' : ' Draft'} />
          ))}
        </div>
      ) : (
        <p className="muted">No articles match. Try clearing the filters.</p>
      )}
    </>
  );
}
