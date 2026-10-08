import Link from 'next/link';
import ArticleEditor from '@/components/ArticleEditor';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { aiEnabled } from '@/lib/ai';
import { LEVELS, TOPICS } from '@/lib/util';

export const metadata = { title: 'New article' };

// /teacher/articles/new?from=ID adds another level version to an existing article.
export default async function NewArticle({ searchParams }) {
  await requireUser('teacher');
  const sp = await searchParams;
  const base = sp.from ? db.prepare('SELECT id, group_id, title, topic FROM articles WHERE id = ?').get(sp.from) : null;
  const groupId = base ? base.group_id ?? base.id : null;
  const taken = groupId ? db.prepare('SELECT level FROM articles WHERE group_id = ?').all(groupId).map((r) => r.level) : [];
  return (
    <>
      <h1>{base ? 'Add another level' : 'New article'}</h1>
      {base && (
        <p className="muted">
          This becomes another level of <Link href={`/teacher/articles/${base.id}`}>{base.title}</Link>. Readers can switch
          between levels. Adapt the text, vocabulary and both quizzes to the new level.
        </p>
      )}
      <ArticleEditor levels={LEVELS} topics={TOPICS} aiEnabled={aiEnabled()} groupId={groupId} takenLevels={taken} defaults={{ topic: base?.topic }} />
    </>
  );
}
