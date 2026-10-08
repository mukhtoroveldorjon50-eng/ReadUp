import Link from 'next/link';
import VocabList from '@/components/VocabList';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const metadata = { title: 'Vocabulary' };

export default async function VocabPage() {
  const user = await requireUser();
  const now = Date.now();
  const words = db
    .prepare(
      `SELECT w.id, w.word, w.definition, w.translation, w.example, w.own_sentence, w.box, w.due, w.article_id, a.title article_title
       FROM saved_words w LEFT JOIN articles a ON a.id = w.article_id WHERE w.user_id = ? ORDER BY w.added_at DESC`
    )
    .all(user.id)
    .map((w) => ({ ...w, now }));
  const due = words.filter((w) => w.due <= now).length;

  return (
    <>
      <div className="row between">
        <h1>My vocabulary</h1>
        <Link href="/vocab/review" className={'btn' + (due ? ' primary' : '')}>
          Review flashcards{due ? ` (${due} due)` : ''}
        </Link>
      </div>
      {words.length ? (
        <VocabList words={words} />
      ) : (
        <div className="card">
          <p>No saved words yet. Open an <Link href="/articles">article</Link>, tap a word you don't know, and press <b>Save word</b>.</p>
        </div>
      )}
    </>
  );
}
