import Link from 'next/link';
import { levelClass, readMinutes } from '@/lib/util';

export default function ArticleCard({ a, read, bookmarked, extra }) {
  return (
    <Link href={`/articles/${a.id}`} className="card article-card">
      <div className="row between">
        <span className={levelClass(a.level)}>{a.level}</span>
        <span className="muted small">{a.topic}</span>
      </div>
      <h3>{a.title}</h3>
      {a.summary && <p className="muted clamp">{a.summary}</p>}
      <div className="row between small muted">
        <span>{readMinutes(a.word_count)} min read</span>
        <span>
          {bookmarked ? '★ Saved  ' : ''}
          {read ? <b className="ok">✓ Read</b> : ''}
          {extra}
        </span>
      </div>
    </Link>
  );
}
