import { db } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { fail, json, readJson, unauthorized } from '@/lib/api';
import { addXp, nextReview } from '@/lib/stats';

// POST { grade: 0..3 } records a flashcard review.
export async function POST(req, { params }) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const card = db.prepare('SELECT box FROM saved_words WHERE id = ? AND user_id = ?').get(id, user.id);
  if (!card) return fail('Word not found.', 404);
  const grade = Math.min(3, Math.max(0, Math.round(Number((await readJson(req)).grade))));
  const { box, due } = nextReview(card.box, grade);
  db.prepare('UPDATE saved_words SET box = ?, due = ?, reviews = reviews + 1 WHERE id = ?').run(box, due, id);
  await addXp(user.id, grade === 0 ? 0 : 1);
  return json({ ok: true, box, due });
}

// PATCH { own_sentence } stores the reader's own example sentence for a saved word.
export async function PATCH(req, { params }) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const sentence = String((await readJson(req)).own_sentence ?? '').trim().slice(0, 400);
  const info = db.prepare('UPDATE saved_words SET own_sentence = ? WHERE id = ? AND user_id = ?').run(sentence, id, user.id);
  if (!info.changes) return fail('Word not found.', 404);
  return json({ ok: true, own_sentence: sentence });
}

// Removing a word, by its owner.
export async function DELETE(_req, { params }) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { id } = await params;
  db.prepare('DELETE FROM saved_words WHERE id = ? AND user_id = ?').run(id, user.id);
  return json({ ok: true });
}
