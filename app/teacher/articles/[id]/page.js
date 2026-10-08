import Link from 'next/link';
import { notFound } from 'next/navigation';
import ArticleEditor from '@/components/ArticleEditor';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { aiEnabled } from '@/lib/ai';
import { LEVELS, TOPICS, parseJson } from '@/lib/util';

export const metadata = { title: 'Edit article' };

export default async function EditArticle({ params }) {
  await requireUser('teacher');
  const { id } = await params;
  const a = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
  if (!a) notFound();
  const article = {
    id: a.id, title: a.title, level: a.level, topic: a.topic, summary: a.summary, body: a.body,
    body_simple: a.body_simple, writing_prompt: a.writing_prompt, published: Boolean(a.published), has_audio: Boolean(a.audio_file),
    glossary: parseJson(a.glossary, []), lang_quiz: parseJson(a.lang_quiz, []), comp_quiz: parseJson(a.comp_quiz, []),
  };
  const versions = db
    .prepare('SELECT id, level, title FROM articles WHERE group_id = ?')
    .all(a.group_id ?? a.id)
    .sort((x, y) => LEVELS.indexOf(x.level) - LEVELS.indexOf(y.level));
  const taken = versions.filter((v) => v.id !== a.id).map((v) => v.level);
  return (
    <>
      <h1>Edit article</h1>
      <div className="card">
        <div className="row between">
          <b>Levels of this article</b>
          {versions.length < LEVELS.length && <Link className="btn small" href={`/teacher/articles/new?from=${a.id}`}>+ Add another level</Link>}
        </div>
        <p className="row">
          {versions.map((v) => (
            <Link key={v.id} href={`/teacher/articles/${v.id}`} className={`lv lv-${v.level.toLowerCase()}${v.id === a.id ? ' here' : ' dim'}`} title={v.title}>{v.level}</Link>
          ))}
        </p>
        <p className="muted small">Each level has its own text, vocabulary and two quizzes. You are editing the {a.level} version.</p>
      </div>
      <ArticleEditor article={article} levels={LEVELS} topics={TOPICS} aiEnabled={aiEnabled()} takenLevels={taken} />
    </>
  );
}
