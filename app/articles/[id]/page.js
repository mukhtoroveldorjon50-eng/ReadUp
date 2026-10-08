import Link from 'next/link';
import { notFound } from 'next/navigation';
import ArticleTabs from '@/components/ArticleTabs';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { aiEnabled } from '@/lib/ai';
import { publicQuiz } from '@/lib/grade';
import { recommend } from '@/lib/stats';
import { levelClass, parseJson, readMinutes } from '@/lib/util';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const a = db.prepare('SELECT title FROM articles WHERE id = ?').get(id);
  return { title: a?.title || 'Article' };
}

export default async function ArticlePage({ params }) {
  const user = await requireUser();
  const { id } = await params;
  const a = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
  if (!a || (!a.published && user.role !== 'teacher')) notFound();

  if (user.role === 'student') {
    db.prepare(
      `INSERT INTO views (user_id, article_id, opened_at) VALUES (?,?,?)
       ON CONFLICT (user_id, article_id) DO UPDATE SET opened_at = excluded.opened_at, opens = opens + 1`
    ).run(user.id, a.id, new Date().toISOString());
  }

  const best = (kind) =>
    db
      .prepare('SELECT score, max FROM quiz_attempts WHERE user_id = ? AND article_id = ? AND kind = ? ORDER BY score * 1.0 / max DESC LIMIT 1')
      .get(user.id, a.id, kind) ?? null;
  const read = db.prepare('SELECT seconds, wpm FROM reads WHERE user_id = ? AND article_id = ?').get(user.id, a.id);
  const saved = db.prepare('SELECT word FROM saved_words WHERE user_id = ?').all(user.id).map((r) => r.word);
  const bookmarked = Boolean(db.prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND article_id = ?').get(user.id, a.id));
  const lastWriting = db
    .prepare('SELECT text, feedback FROM writings WHERE user_id = ? AND article_id = ? ORDER BY id DESC LIMIT 1')
    .get(user.id, a.id) ?? null;
  const next = recommend(user, 3).articles.find((x) => x.id !== a.id) ?? null;

  const langQ = parseJson(a.lang_quiz, []);
  const compQ = parseJson(a.comp_quiz, []);

  return (
    <>
      <p className="crumbs"><Link href="/articles">← All articles</Link></p>
      <header className="article-head">
        <div className="row">
          <span className={levelClass(a.level)}>{a.level}</span>
          <span className="chip">{a.topic}</span>
          <span className="muted">{a.word_count} words · {readMinutes(a.word_count)} min</span>
          {!a.published && <span className="chip warn">Draft</span>}
        </div>
        <h1>{a.title}</h1>
        {a.summary && <p className="lead">{a.summary}</p>}
        {user.role === 'teacher' && <p><Link className="btn small" href={`/teacher/articles/${a.id}`}>Edit this article</Link></p>}
      </header>
      <ArticleTabs
        article={{
          id: a.id, title: a.title, body: a.body, bodySimple: a.body_simple, wordCount: a.word_count,
          audioUrl: a.audio_file ? `/api/files/${a.audio_file}` : null,
        }}
        glossary={parseJson(a.glossary, [])}
        saved={saved}
        bookmarked={bookmarked}
        finished={read ? { seconds: read.seconds, wpm: read.wpm, xp: 0 } : null}
        quizzes={{
          lang: { questions: publicQuiz(langQ), best: best('lang') },
          comp: { questions: publicQuiz(compQ), best: best('comp') },
        }}
        nativeLang={user.native_lang}
        aiEnabled={aiEnabled()}
        lastWriting={lastWriting}
        next={next ? { id: next.id, title: next.title } : null}
      />
    </>
  );
}
