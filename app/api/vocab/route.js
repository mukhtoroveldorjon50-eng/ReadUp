import { db } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { fail, json, readJson, unauthorized } from '@/lib/api';
import { addXp } from '@/lib/stats';

const clip = (v, n) => String(v ?? '').trim().slice(0, n);

export async function POST(req) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const b = await readJson(req);
  const word = clip(b.word, 60).toLowerCase();
  if (!word) return fail('No word.');
  const articleId = db.prepare('SELECT id FROM articles WHERE id = ?').get(Number(b.article_id))?.id ?? null;
  const info = db
    .prepare(
      `INSERT INTO saved_words (user_id, word, definition, translation, example, article_id, due, added_at)
       VALUES (?,?,?,?,?,?,?,?) ON CONFLICT (user_id, word) DO NOTHING`
    )
    .run(user.id, word, clip(b.definition, 400), clip(b.translation, 200), clip(b.example, 400), articleId, Date.now(), new Date().toISOString());
  if (info.changes) await addXp(user.id, 2);
  return json({ ok: true, added: info.changes > 0 });
}
