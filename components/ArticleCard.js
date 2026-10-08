import Link from 'next/link';
import { levelClass, readMinutes } from '@/lib/util';

// `levels` lists every level this article is available in (when it has more than one).
export default function ArticleCard({ a, levels, read, bookmarked, extra }) {
  const all = levels && levels.length > 1 ? levels : null;
  return (
    <Link href={`/articles/${a.id}`} className="card article-card">
      <div className="row between">
        <span className="row tight">
          {all ? all.map((l) => <span key={l} className={levelClass(l) + (l === a.level ? ' here' : ' dim')}>{l}</span>) : <span className={levelClass(a.level)}>{a.level}</span>}
        </span>
        <span className="muted small">{a.topic}</span>
      </div>
      <h3>{a.title}</h3>
      {a.summary && <p className="muted clamp">{a.summary}</p>}
      <div className="row between small muted">
        <span>{readMinutes(a.word_count)} min read{all ? ` · ${all.length} levels` : ''}</span>
        <span>
          {bookmarked ? '★ Saved  ' : ''}
          {read ? <b className="ok">✓ Read</b> : ''}
          {extra}
        </span>
      </div>
    </Link>
  );
}
