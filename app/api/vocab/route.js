import { db } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { fail, json, readJson, unauthorized } from '@/lib/api';
import { addXp } from '@/lib/stats';

const clip = (v, n) => String(v ?? '').trim().slice(0, n);

// Saves a word with the sentence it came from. Saving a word you already have changes nothing.
export async function POST(req) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const b = await readJson(req);
  const word = clip(b.word, 60).toLowerCase();
  if (!word) return fail('No word.');
  const articleId = db.prepare('SELECT id FROM articles WHERE id = ?').get(Number(b.article_id))?.id ?? null;
  const info = db
    .prepare(
      `INSERT INTO saved_words (user_id, word, definition, translation, example, own_sentence, article_id, due, added_at)
       VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT (user_id, word) DO NOTHING`
    )
    .run(user.id, word, clip(b.definition, 400), clip(b.translation, 200), clip(b.example, 400), clip(b.own_sentence, 400), articleId, Date.now(), new Date().toISOString());
  if (info.changes) await addXp(user.id, 2);
  const row = db.prepare('SELECT id, own_sentence FROM saved_words WHERE user_id = ? AND word = ?').get(user.id, word);
  return json({ ok: true, added: info.changes > 0, id: row.id, own_sentence: row.own_sentence });
}

// Look up one of your saved words: /api/vocab?word=habit
export async function GET(req) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const word = clip(new URL(req.url).searchParams.get('word'), 60).toLowerCase();
  const row = db.prepare('SELECT id, own_sentence FROM saved_words WHERE user_id = ? AND word = ?').get(user.id, word);
  return json(row ? { saved: true, ...row } : { saved: false });
}
