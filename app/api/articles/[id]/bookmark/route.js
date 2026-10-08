import { db } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { fail, json, unauthorized } from '@/lib/api';

export async function POST(_req, { params }) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { id } = await params;
  if (!db.prepare('SELECT 1 FROM articles WHERE id = ?').get(id)) return fail('Article not found.', 404);
  const has = db.prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND article_id = ?').get(user.id, id);
  if (has) db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND article_id = ?').run(user.id, id);
  else db.prepare('INSERT INTO bookmarks (user_id, article_id, created_at) VALUES (?,?,?)').run(user.id, id, new Date().toISOString());
  return json({ bookmarked: !has });
}
