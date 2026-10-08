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
    body_simple: a.body_simple, published: Boolean(a.published), has_audio: Boolean(a.audio_file),
    glossary: parseJson(a.glossary, []), lang_quiz: parseJson(a.lang_quiz, []), comp_quiz: parseJson(a.comp_quiz, []),
  };
  return (
    <>
      <h1>Edit article</h1>
      <ArticleEditor article={article} levels={LEVELS} topics={TOPICS} aiEnabled={aiEnabled()} />
    </>
  );
}
