import { db } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { fail, json, readJson, unauthorized } from '@/lib/api';
import { addXp } from '@/lib/stats';

export async function POST(req, { params }) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { id } = await params;
  const article = db.prepare('SELECT word_count FROM articles WHERE id = ?').get(id);
  if (!article) return fail('Article not found.', 404);
  const b = await readJson(req);
  const seconds = Math.min(3 * 3600, Math.max(5, Math.round(Number(b.seconds) || 0)));
  const wpm = Math.min(900, Math.round((article.word_count / seconds) * 60));
  const mode = b.mode === 'simple' ? 'simple' : 'original';
  const first = !db.prepare('SELECT 1 FROM reads WHERE user_id = ? AND article_id = ?').get(user.id, id);
  db.prepare(
    `INSERT INTO reads (user_id, article_id, seconds, wpm, mode, finished_at) VALUES (?,?,?,?,?,?)
     ON CONFLICT (user_id, article_id) DO UPDATE SET seconds = excluded.seconds, wpm = excluded.wpm,
       mode = excluded.mode, finished_at = excluded.finished_at`
  ).run(user.id, id, seconds, wpm, mode, new Date().toISOString());
  const xp = first ? 20 : 0;
  await addXp(user.id, xp);
  return json({ ok: true, wpm, seconds, xp, first });
}
