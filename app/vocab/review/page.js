import Link from 'next/link';
import Flashcards from '@/components/Flashcards';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export const metadata = { title: 'Review flashcards' };

export default async function ReviewPage() {
  const user = await requireUser();
  const cards = db
    .prepare(
      `SELECT id, word, definition, translation, example, own_sentence FROM saved_words
       WHERE user_id = ? AND due <= ? ORDER BY due LIMIT 20`
    )
    .all(user.id, Date.now());
  return (
    <>
      <p className="crumbs"><Link href="/vocab">← My vocabulary</Link></p>
      <h1>Flashcards</h1>
      <Flashcards cards={cards} />
    </>
  );
}
